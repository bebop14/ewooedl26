import { defineStore } from 'pinia'
import {
  collection, doc, addDoc, deleteDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, startAfter,
  Timestamp, increment, writeBatch,
  type DocumentSnapshot, type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { Comment, CommentDoc, RankedUser, GalleryFilters, WorkoutTypeStat, GroupFilter } from '~/types/social'
import type { Workout } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'

/** 배열을 size 크기의 청크로 분할 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  if (!size || size <= 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export const useSocialStore = defineStore('social', () => {
  const db = useFirestore()
  const user = useCurrentUser()

  /** 청크별 in 쿼리를 병렬로 실행하고 결과를 합침 */
  async function queryInChunks(
    collectionPath: string,
    field: string,
    ids: string[],
    extraConstraints: ReturnType<typeof where>[] = [],
  ): Promise<QueryDocumentSnapshot[]> {
    if (!db) return []
    const chunks = chunkArray(ids, 30)
    const results = await Promise.all(
      chunks.map(chunk =>
        getDocs(query(collection(db, collectionPath), where(field, 'in', chunk), ...extraConstraints)),
      ),
    )
    return results.flatMap(r => r.docs)
  }

  // ========== LIKES ==========

  const userLikes = ref<Map<string, string>>(new Map())

  async function toggleLike(workoutId: string) {
    if (!db || !user.value) return

    const existingLikeId = userLikes.value.get(workoutId)
    const batch = writeBatch(db)

    if (existingLikeId) {
      batch.delete(doc(db, 'likes', existingLikeId))
      batch.update(doc(db, 'workouts', workoutId), { likes: increment(-1) })
      await batch.commit()
      userLikes.value.delete(workoutId)
    } else {
      const likeRef = doc(collection(db, 'likes'))
      batch.set(likeRef, {
        workoutId,
        userId: user.value.uid,
        createdAt: Timestamp.now(),
      })
      batch.update(doc(db, 'workouts', workoutId), { likes: increment(1) })
      await batch.commit()
      userLikes.value.set(workoutId, likeRef.id)
    }
  }

  async function loadUserLikesForWorkouts(workoutIds: string[]) {
    if (!db || !user.value || workoutIds.length === 0) return

    const chunks = chunkArray(workoutIds, 30)
    const results = await Promise.all(
      chunks.map(chunk =>
        getDocs(query(
          collection(db, 'likes'),
          where('userId', '==', user.value!.uid),
          where('workoutId', 'in', chunk),
        )),
      ),
    )
    results.flatMap(r => r.docs).forEach((d) => {
      const data = d.data()
      userLikes.value.set(data.workoutId as string, d.id)
    })
  }

  // ========== COMMENTS ==========

  const comments = ref<Comment[]>([])
  const commentsLoading = ref(false)

  async function fetchComments(workoutId: string) {
    if (!db) return

    commentsLoading.value = true
    try {
      const q = query(
        collection(db, 'comments'),
        where('workoutId', '==', workoutId),
      )
      const snapshot = await getDocs(q)
      comments.value = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as Comment))
      comments.value.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
    } finally {
      commentsLoading.value = false
    }
  }

  async function addComment(workoutId: string, content: string) {
    if (!db || !user.value) return

    const commentData: CommentDoc = {
      workoutId,
      userId: user.value.uid,
      userName: user.value.displayName || 'Unknown',
      userPhoto: user.value.photoURL || '',
      content,
      createdAt: Timestamp.now(),
    }

    const batch = writeBatch(db)
    const commentRef = doc(collection(db, 'comments'))
    batch.set(commentRef, commentData)
    batch.update(doc(db, 'workouts', workoutId), { comments: increment(1) })
    await batch.commit()
    comments.value.push({ id: commentRef.id, ...commentData })
  }

  async function deleteComment(commentId: string, workoutId: string) {
    if (!db) return

    const batch = writeBatch(db)
    batch.delete(doc(db, 'comments', commentId))
    batch.update(doc(db, 'workouts', workoutId), { comments: increment(-1) })
    await batch.commit()
    comments.value = comments.value.filter((c) => c.id !== commentId)
  }

  // ========== GALLERY ==========

  const galleryWorkouts = ref<Workout[]>([])
  const galleryLoading = ref(false)
  const galleryHasMore = ref(true)
  const lastGalleryDoc = ref<DocumentSnapshot | null>(null)
  // 30명 초과 그룹용 클라이언트 필터
  const galleryMemberFilter = ref<Set<string> | null>(null)

  async function fetchGalleryPage(pageSize = 12, filters?: GalleryFilters & GroupFilter) {
    if (!db || galleryLoading.value) return

    galleryLoading.value = true
    try {
      const constraints: any[] = [
        orderBy('date', 'desc'),
        limit(pageSize),
      ]

      if (filters?.workoutType) {
        constraints.unshift(where('workoutType', '==', filters.workoutType))
      }

      // 그룹 필터: 그룹 멤버들의 운동만 표시
      if (filters?.groupId) {
        const membersSnapshot = await getDocs(collection(db, 'groups', filters.groupId, 'members'))
        const memberIds = membersSnapshot.docs.map(d => d.id)
        if (memberIds.length === 0) {
          galleryHasMore.value = false
          return
        }
        if (memberIds.length <= 30) {
          constraints.unshift(where('userId', 'in', memberIds))
          galleryMemberFilter.value = null
        } else {
          // 30명 초과: 클라이언트 필터링 (더 많이 fetch하여 보정)
          galleryMemberFilter.value = new Set(memberIds)
          constraints.pop() // limit 제거
          constraints.push(limit(pageSize * 3))
        }
      } else {
        galleryMemberFilter.value = null
      }

      if (lastGalleryDoc.value) {
        constraints.push(startAfter(lastGalleryDoc.value))
      }

      const q = query(collection(db, 'workouts'), ...constraints)
      const snapshot = await getDocs(q)

      let docs = snapshot.docs
      // 30명 초과 그룹: 클라이언트에서 멤버 필터링
      if (galleryMemberFilter.value) {
        docs = docs.filter(d => galleryMemberFilter.value!.has(d.data().userId as string))
      }

      const newWorkouts = docs.slice(0, pageSize).map((d) => ({
        id: d.id,
        ...d.data(),
      } as Workout))

      galleryWorkouts.value.push(...newWorkouts)
      // 커서는 원본 snapshot 기준 (필터링 전)
      lastGalleryDoc.value = snapshot.docs[snapshot.docs.length - 1] ?? null
      galleryHasMore.value = snapshot.docs.length >= pageSize

      const newIds = newWorkouts.map((w) => w.id)
      await loadUserLikesForWorkouts(newIds)
    } finally {
      galleryLoading.value = false
    }
  }

  function resetGallery() {
    galleryWorkouts.value = []
    lastGalleryDoc.value = null
    galleryHasMore.value = true
    galleryMemberFilter.value = null
  }

  // ========== RANKING ==========

  const rankings = ref<RankedUser[]>([])
  const rankingsLoading = ref(false)

  async function fetchRankings(groupId?: string | null, myGroupIds?: string[]) {
    if (!db) return

    rankingsLoading.value = true
    try {
      let userDocs: QueryDocumentSnapshot[] = []
      let workoutDocs: QueryDocumentSnapshot[] = []

      if (groupId) {
        // 특정 그룹의 멤버들만 가져오기
        const [groupSnap, membersSnapshot] = await Promise.all([
          getDoc(doc(db, 'groups', groupId)),
          getDocs(collection(db, 'groups', groupId, 'members')),
        ])
        const memberIds = membersSnapshot.docs.map(d => d.id)

        if (memberIds.length === 0) {
          rankings.value = []
          return
        }

        // 그룹 생성일 이후의 운동만 조회
        const groupCreatedAt = groupSnap.data()?.createdAt as Timestamp | undefined
        const workoutFilters = groupCreatedAt
          ? [where('date', '>=', groupCreatedAt)]
          : []

        // 사용자 정보 + 운동 데이터 병렬 조회
        const [users, workouts] = await Promise.all([
          queryInChunks('users', '__name__', memberIds),
          queryInChunks('workouts', 'userId', memberIds, workoutFilters),
        ])
        userDocs = users
        workoutDocs = workouts
      } else if (myGroupIds && myGroupIds.length > 0) {
        // "전체 그룹" 선택 시: 내가 속한 모든 그룹의 멤버들만 표시
        const memberSnapshots = await Promise.all(
          myGroupIds.map(gid => getDocs(collection(db, 'groups', gid, 'members'))),
        )
        const allMemberIds = new Set<string>()
        memberSnapshots.forEach(snap => snap.docs.forEach(d => allMemberIds.add(d.id)))

        if (allMemberIds.size === 0) {
          rankings.value = []
          return
        }

        const memberIdArray = Array.from(allMemberIds)

        // 사용자 정보 + 운동 데이터 병렬 조회
        const [users, workouts] = await Promise.all([
          queryInChunks('users', '__name__', memberIdArray),
          queryInChunks('workouts', 'userId', memberIdArray),
        ])
        userDocs = users
        workoutDocs = workouts
      } else {
        // 그룹이 없으면 빈 결과
        rankings.value = []
        return
      }

      // 사용자별 운동 종류 집계 + 최근 운동일
      const userWorkoutMap = new Map<string, { typeCounts: Map<string, number>; lastDate: string | null; totalCount: number }>()

      workoutDocs.forEach((d) => {
        const data = d.data()
        const userId = data.userId as string
        const workoutType = data.workoutType as string

        if (!userWorkoutMap.has(userId)) {
          userWorkoutMap.set(userId, { typeCounts: new Map(), lastDate: null, totalCount: 0 })
        }
        const entry = userWorkoutMap.get(userId)!
        entry.typeCounts.set(workoutType, (entry.typeCounts.get(workoutType) || 0) + 1)
        entry.totalCount += 1

        // 최근 운동일 계산
        const ts = data.date as Timestamp
        if (ts) {
          const dateStr = ts.toDate().toISOString().split('T')[0]!
          if (!entry.lastDate || dateStr > entry.lastDate) {
            entry.lastDate = dateStr
          }
        }
      })

      rankings.value = userDocs.map((d) => {
        const data = d.data()
        const workoutData = userWorkoutMap.get(d.id)
        const typeStats: WorkoutTypeStat[] = []

        if (workoutData) {
          workoutData.typeCounts.forEach((count, type) => {
            const info = WORKOUT_TYPES.find((t) => t.value === type)
            typeStats.push({
              type,
              label: info?.label ?? '기타',
              icon: info?.icon ?? 'i-lucide-activity',
              count,
            })
          })
          typeStats.sort((a, b) => b.count - a.count)
        }

        // 그룹 필터 시에는 해당 그룹 내 운동 횟수, 전체 모드는 실제 집계값 우선
        const totalWorkouts = groupId
          ? (workoutData?.totalCount ?? 0)
          : (workoutData?.totalCount ?? data.stats?.totalWorkouts ?? 0)

        return {
          userId: d.id,
          displayName: data.displayName ?? 'Unknown',
          photoURL: data.photoURL ?? '',
          totalWorkouts,
          currentStreak: data.stats?.currentStreak ?? 0,
          longestStreak: data.stats?.longestStreak ?? 0,
          mainWorkoutType: typeStats[0] ?? null,
          workoutTypeStats: typeStats,
          lastWorkoutDate: workoutData?.lastDate ?? data.stats?.lastWorkoutDate ?? null,
        } as RankedUser
      })
    } finally {
      rankingsLoading.value = false
    }
  }

  return {
    userLikes,
    toggleLike,
    loadUserLikesForWorkouts,
    comments,
    commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
    galleryWorkouts,
    galleryLoading,
    galleryHasMore,
    fetchGalleryPage,
    resetGallery,
    rankings,
    rankingsLoading,
    fetchRankings,
  }
})
