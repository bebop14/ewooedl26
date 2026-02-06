import { defineStore } from 'pinia'
import {
  collection, doc, addDoc, deleteDoc, getDocs, updateDoc,
  query, where, orderBy, limit, startAfter,
  Timestamp, increment,
  type DocumentSnapshot,
} from 'firebase/firestore'
import type { Comment, CommentDoc, RankedUser, GalleryFilters, WorkoutTypeStat, GroupFilter } from '~/types/social'
import type { Workout } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'

export const useSocialStore = defineStore('social', () => {
  const db = useFirestore()
  const user = useCurrentUser()

  // ========== LIKES ==========

  const userLikes = ref<Map<string, string>>(new Map())

  async function toggleLike(workoutId: string) {
    if (!db || !user.value) return

    const existingLikeId = userLikes.value.get(workoutId)

    if (existingLikeId) {
      await deleteDoc(doc(db, 'likes', existingLikeId))
      await updateDoc(doc(db, 'workouts', workoutId), { likes: increment(-1) })
      userLikes.value.delete(workoutId)
    } else {
      const likeRef = await addDoc(collection(db, 'likes'), {
        workoutId,
        userId: user.value.uid,
        createdAt: Timestamp.now(),
      })
      await updateDoc(doc(db, 'workouts', workoutId), { likes: increment(1) })
      userLikes.value.set(workoutId, likeRef.id)
    }
  }

  async function loadUserLikesForWorkouts(workoutIds: string[]) {
    if (!db || !user.value || workoutIds.length === 0) return

    const chunks: string[][] = []
    for (let i = 0; i < workoutIds.length; i += 30) {
      chunks.push(workoutIds.slice(i, i + 30))
    }

    for (const chunk of chunks) {
      const q = query(
        collection(db, 'likes'),
        where('userId', '==', user.value.uid),
        where('workoutId', 'in', chunk),
      )
      const snapshot = await getDocs(q)
      snapshot.docs.forEach((d) => {
        const data = d.data()
        userLikes.value.set(data.workoutId as string, d.id)
      })
    }
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

    const docRef = await addDoc(collection(db, 'comments'), commentData)
    await updateDoc(doc(db, 'workouts', workoutId), { comments: increment(1) })
    comments.value.push({ id: docRef.id, ...commentData })
  }

  async function deleteComment(commentId: string, workoutId: string) {
    if (!db) return

    await deleteDoc(doc(db, 'comments', commentId))
    await updateDoc(doc(db, 'workouts', workoutId), { comments: increment(-1) })
    comments.value = comments.value.filter((c) => c.id !== commentId)
  }

  // ========== GALLERY ==========

  const galleryWorkouts = ref<Workout[]>([])
  const galleryLoading = ref(false)
  const galleryHasMore = ref(true)
  const lastGalleryDoc = ref<DocumentSnapshot | null>(null)

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

      // 그룹 필터 추가
      if (filters?.groupId) {
        constraints.unshift(where('groupIds', 'array-contains', filters.groupId))
      }

      if (lastGalleryDoc.value) {
        constraints.push(startAfter(lastGalleryDoc.value))
      }

      const q = query(collection(db, 'workouts'), ...constraints)
      const snapshot = await getDocs(q)

      const newWorkouts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as Workout))

      galleryWorkouts.value.push(...newWorkouts)
      lastGalleryDoc.value = snapshot.docs[snapshot.docs.length - 1] ?? null
      galleryHasMore.value = snapshot.docs.length === pageSize

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
  }

  // ========== RANKING ==========

  const rankings = ref<RankedUser[]>([])
  const rankingsLoading = ref(false)

  async function fetchRankings(groupId?: string | null, myGroupIds?: string[]) {
    if (!db) return

    rankingsLoading.value = true
    try {
      // 그룹 필터에 따라 사용자 및 운동 데이터 가져오기
      let usersSnapshot
      let workoutsSnapshot

      if (groupId) {
        // 특정 그룹의 멤버들만 가져오기
        const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'))
        const memberIds = membersSnapshot.docs.map(d => d.id)

        if (memberIds.length === 0) {
          rankings.value = []
          return
        }

        // 멤버 ID들로 사용자 정보 가져오기 (30개씩 청크)
        const userDocs: any[] = []
        const chunks: string[][] = []
        for (let i = 0; i < memberIds.length; i += 30) {
          chunks.push(memberIds.slice(i, i + 30))
        }
        for (const chunk of chunks) {
          const q = query(collection(db, 'users'), where('__name__', 'in', chunk))
          const snapshot = await getDocs(q)
          userDocs.push(...snapshot.docs)
        }
        usersSnapshot = { docs: userDocs }

        // 해당 그룹의 운동만 가져오기
        const workoutsQ = query(
          collection(db, 'workouts'),
          where('groupIds', 'array-contains', groupId),
        )
        workoutsSnapshot = await getDocs(workoutsQ)
      } else if (myGroupIds && myGroupIds.length > 0) {
        // "전체 그룹" 선택 시: 내가 속한 모든 그룹의 멤버들만 표시
        const allMemberIds = new Set<string>()

        // 각 그룹의 멤버 ID 수집
        for (const gid of myGroupIds) {
          const membersSnapshot = await getDocs(collection(db, 'groups', gid, 'members'))
          membersSnapshot.docs.forEach(d => allMemberIds.add(d.id))
        }

        if (allMemberIds.size === 0) {
          rankings.value = []
          return
        }

        const memberIdArray = Array.from(allMemberIds)

        // 멤버 ID들로 사용자 정보 가져오기 (30개씩 청크)
        const userDocs: any[] = []
        const chunks: string[][] = []
        for (let i = 0; i < memberIdArray.length; i += 30) {
          chunks.push(memberIdArray.slice(i, i + 30))
        }
        for (const chunk of chunks) {
          const q = query(collection(db, 'users'), where('__name__', 'in', chunk))
          const snapshot = await getDocs(q)
          userDocs.push(...snapshot.docs)
        }
        usersSnapshot = { docs: userDocs }

        // 전체 운동 데이터 (내 그룹 멤버들 것만 필터링)
        workoutsSnapshot = await getDocs(collection(db, 'workouts'))
      } else {
        // 그룹이 없으면 빈 결과
        rankings.value = []
        return
      }

      // 사용자별 운동 종류 집계 + 최근 운동일
      const userWorkoutMap = new Map<string, { typeCounts: Map<string, number>; lastDate: string | null; totalCount: number }>()

      workoutsSnapshot.docs.forEach((d) => {
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

      rankings.value = usersSnapshot.docs.map((d) => {
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

        // 그룹 필터 시에는 해당 그룹 내 운동 횟수 사용
        const totalWorkouts = groupId
          ? (workoutData?.totalCount ?? 0)
          : (data.stats?.totalWorkouts ?? 0)

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
