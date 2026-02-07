import { defineStore } from 'pinia'
import {
  collection, doc, addDoc, getDoc, getDocs, deleteDoc, setDoc, query,
  where, orderBy, limit, Timestamp,
} from 'firebase/firestore'
import type { Workout, WorkoutFormData, WeeklyStats, WeeklyTypeStats, TypeDistribution } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'

function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getYesterdayDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getLocalDateString(d)
}

export const useWorkoutStore = defineStore('workout', () => {
  const db = useFirestore()
  const user = useCurrentUser()
  const userStore = useUserStore()

  const workouts = ref<Workout[]>([])
  const todayWorkouts = ref<Workout[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const monthlyTypeCounts = ref<Record<string, number>>({})
  const monthlyGoals = ref<Record<string, number>>({})

  async function addWorkout(formData: WorkoutFormData, imageUrls: { imageUrl: string; thumbnailUrl: string }) {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      const workoutDate = Timestamp.fromDate(new Date(formData.date + 'T00:00:00'))

      // 사용자의 모든 그룹 ID 가져오기
      const userDoc = await getDoc(doc(db, 'users', user.value.uid))
      const userGroupIds = userDoc.data()?.groupIds ?? []

      const workoutData: Record<string, any> = {
        userId: user.value.uid,
        userName: user.value.displayName || 'Unknown',
        userPhoto: user.value.photoURL || '',
        workoutType: formData.workoutType,
        date: workoutDate,
        imageUrl: imageUrls.imageUrl,
        thumbnailUrl: imageUrls.thumbnailUrl,
        memo: formData.memo,
        likes: 0,
        comments: 0,
        hashtags: formData.hashtags,
        groupIds: userGroupIds,
      }

      const docRef = await addDoc(collection(db, 'workouts'), workoutData)

      await updateUserStatsAfterWorkout(formData.date)

      return docRef.id
    } finally {
      submitting.value = false
    }
  }

  async function fetchTodayWorkouts() {
    if (!db || !user.value) return

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.value.uid),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      orderBy('date', 'desc'),
    )

    const snapshot = await getDocs(q)
    todayWorkouts.value = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Workout))
  }

  async function fetchRecentWorkouts(count = 10) {
    if (!db || !user.value) return

    loading.value = true
    try {
      const q = query(
        collection(db, 'workouts'),
        where('userId', '==', user.value.uid),
        orderBy('date', 'desc'),
        limit(count),
      )

      const snapshot = await getDocs(q)
      workouts.value = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as Workout))
    } finally {
      loading.value = false
    }
  }

  async function fetchWorkoutById(workoutId: string): Promise<Workout | null> {
    if (!db) return null
    const docSnap = await getDoc(doc(db, 'workouts', workoutId))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Workout
  }

  async function fetchWeeklyStats(): Promise<WeeklyStats> {
    const empty = { labels: ['월', '화', '수', '목', '금', '토', '일'], counts: Array(7).fill(0) }
    if (!db || !user.value) return empty

    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.value.uid),
      where('date', '>=', Timestamp.fromDate(monday)),
      orderBy('date', 'asc'),
    )

    const snapshot = await getDocs(q)
    const counts = Array(7).fill(0)

    snapshot.docs.forEach((d) => {
      const data = d.data()
      const workoutDate = (data.date as Timestamp).toDate()
      let idx = workoutDate.getDay() - 1
      if (idx < 0) idx = 6
      counts[idx] += 1
    })

    return { labels: ['월', '화', '수', '목', '금', '토', '일'], counts }
  }

  const CHART_COLORS: string[] = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#A855F7',
    '#64748B', '#84CC16', '#6B7280',
  ]

  async function fetchWeeklyTypeStats(): Promise<WeeklyTypeStats> {
    const labels = ['월', '화', '수', '목', '금', '토', '일']
    if (!db || !user.value) return { labels, datasets: [] }

    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.value.uid),
      where('date', '>=', Timestamp.fromDate(monday)),
      orderBy('date', 'asc'),
    )

    const snapshot = await getDocs(q)

    // 요일별 운동 종류 카운트
    const typeByDay = new Map<string, number[]>()

    snapshot.docs.forEach((d) => {
      const data = d.data()
      const workoutDate = (data.date as Timestamp).toDate()
      const workoutType = data.workoutType as string
      let idx = workoutDate.getDay() - 1
      if (idx < 0) idx = 6

      if (!typeByDay.has(workoutType)) {
        typeByDay.set(workoutType, Array(7).fill(0))
      }
      typeByDay.get(workoutType)![idx] += 1
    })

    const datasets = WORKOUT_TYPES
      .filter((t) => typeByDay.has(t.value))
      .map((t) => ({
        label: t.label,
        data: typeByDay.get(t.value)!,
        backgroundColor: CHART_COLORS[WORKOUT_TYPES.indexOf(t) % CHART_COLORS.length]!,
      }))

    return { labels, datasets }
  }

  async function fetchTypeDistribution(): Promise<TypeDistribution> {
    if (!db || !user.value) return { labels: [], counts: [], colors: [] }

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.value.uid),
    )

    const snapshot = await getDocs(q)
    const countMap = new Map<string, number>()

    snapshot.docs.forEach((d) => {
      const type = d.data().workoutType as string
      countMap.set(type, (countMap.get(type) || 0) + 1)
    })

    const labels: string[] = []
    const counts: number[] = []
    const colors: string[] = []

    WORKOUT_TYPES.forEach((type, idx) => {
      const count = countMap.get(type.value) || 0
      if (count > 0) {
        labels.push(type.label)
        counts.push(count)
        colors.push(CHART_COLORS[idx % CHART_COLORS.length]!)
      }
    })

    return { labels, counts, colors }
  }

  async function updateUserStatsAfterWorkout(workoutDateStr: string) {
    await recalculateUserStats()
  }

  async function fetchTopWorkoutType(): Promise<{ label: string; icon: string } | null> {
    if (!db || !user.value) return null

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.value.uid),
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const countMap = new Map<string, number>()
    snapshot.docs.forEach((d) => {
      const type = d.data().workoutType as string
      countMap.set(type, (countMap.get(type) || 0) + 1)
    })

    let topType = ''
    let topCount = 0
    countMap.forEach((count, type) => {
      if (count > topCount) {
        topType = type
        topCount = count
      }
    })

    const info = WORKOUT_TYPES.find((t) => t.value === topType)
    return info ? { label: info.label, icon: info.icon } : null
  }

  async function recalculateUserStats() {
    if (!db || !user.value) return

    if (!userStore.userProfile) {
      await userStore.loadUserProfile(user.value.uid)
    }
    if (!userStore.userProfile) return

    // 모든 운동 기록 조회 (날짜 내림차순)
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.value.uid),
      orderBy('date', 'desc'),
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // 운동 기록이 없으면 통계 초기화
      await userStore.updateStats(user.value.uid, {
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: userStore.userProfile?.stats.longestStreak || 0,
        lastWorkoutDate: '',
      })
      return
    }

    const totalWorkouts = snapshot.size

    // 날짜별로 운동 기록 그룹핑 (중복 날짜 제거)
    const workoutDates = new Set<string>()
    snapshot.docs.forEach((d) => {
      const data = d.data()
      const workoutDate = (data.date as Timestamp).toDate()
      workoutDates.add(getLocalDateString(workoutDate))
    })

    // 날짜를 정렬 (최신순)
    const sortedDates = Array.from(workoutDates).sort().reverse()
    const lastWorkoutDate = sortedDates[0] || ''

    // 연속 운동일 계산
    let currentStreak = 0
    const today = getLocalDateString()
    const yesterday = getYesterdayDateString()

    // 오늘 또는 어제부터 시작해서 연속일 계산
    let checkDate = sortedDates.includes(today) ? today : (sortedDates.includes(yesterday) ? yesterday : '')

    if (checkDate) {
      for (const dateStr of sortedDates) {
        if (dateStr === checkDate) {
          currentStreak++
          // 다음 확인할 날짜 (하루 전)
          const d = new Date(checkDate + 'T00:00:00')
          d.setDate(d.getDate() - 1)
          checkDate = getLocalDateString(d)
        } else if (dateStr < checkDate) {
          // 연속이 끊김
          break
        }
      }
    }

    const longestStreak = Math.max(
      userStore.userProfile?.stats.longestStreak || 0,
      currentStreak,
    )

    await userStore.updateStats(user.value.uid, {
      totalWorkouts,
      currentStreak,
      longestStreak,
      lastWorkoutDate,
    })
  }

  async function deleteWorkout(workoutId: string) {
    if (!db || !user.value) throw new Error('Not authenticated')

    // 운동 기록 가져와서 본인 것인지 확인
    const workoutDoc = await getDoc(doc(db, 'workouts', workoutId))
    if (!workoutDoc.exists()) throw new Error('Workout not found')

    const workoutData = workoutDoc.data()
    if (workoutData.userId !== user.value.uid) {
      throw new Error('Not authorized to delete this workout')
    }

    // 관련 댓글 삭제
    const commentsQuery = query(
      collection(db, 'comments'),
      where('workoutId', '==', workoutId),
    )
    const commentsSnapshot = await getDocs(commentsQuery)
    const commentDeletePromises = commentsSnapshot.docs.map(d => deleteDoc(d.ref))

    // 관련 좋아요 삭제
    const likesQuery = query(
      collection(db, 'likes'),
      where('workoutId', '==', workoutId),
    )
    const likesSnapshot = await getDocs(likesQuery)
    const likeDeletePromises = likesSnapshot.docs.map(d => deleteDoc(d.ref))

    // 모든 삭제 작업 병렬 실행
    await Promise.all([
      ...commentDeletePromises,
      ...likeDeletePromises,
      deleteDoc(doc(db, 'workouts', workoutId)),
    ])

    // 사용자 통계 업데이트 - 남은 운동 기록 기반으로 재계산
    await recalculateUserStats()

    // 로컬 상태에서도 제거
    workouts.value = workouts.value.filter(w => w.id !== workoutId)
    todayWorkouts.value = todayWorkouts.value.filter(w => w.id !== workoutId)
  }

  async function fetchMonthlyTypeCounts(): Promise<Record<string, number>> {
    if (!db || !user.value) return {}

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.value.uid),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth)),
    )

    const snapshot = await getDocs(q)
    const countMap: Record<string, number> = {}

    snapshot.docs.forEach((d) => {
      const type = d.data().workoutType as string
      countMap[type] = (countMap[type] || 0) + 1
    })

    monthlyTypeCounts.value = countMap
    return countMap
  }

  async function fetchMonthlyGoals(): Promise<Record<string, number>> {
    if (!db || !user.value) return {}

    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const docSnap = await getDoc(doc(db, 'users', user.value.uid, 'monthlyGoals', monthKey))

    if (docSnap.exists()) {
      monthlyGoals.value = docSnap.data().goals ?? {}
    } else {
      monthlyGoals.value = {}
    }
    return monthlyGoals.value
  }

  async function saveMonthlyGoals(goals: Record<string, number>) {
    if (!db || !user.value) return

    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    await setDoc(doc(db, 'users', user.value.uid, 'monthlyGoals', monthKey), { goals })
    monthlyGoals.value = goals
  }

  return {
    workouts,
    todayWorkouts,
    loading,
    submitting,
    monthlyTypeCounts,
    monthlyGoals,
    addWorkout,
    deleteWorkout,
    recalculateUserStats,
    fetchTodayWorkouts,
    fetchRecentWorkouts,
    fetchWorkoutById,
    fetchWeeklyStats,
    fetchWeeklyTypeStats,
    fetchTypeDistribution,
    fetchTopWorkoutType,
    fetchMonthlyTypeCounts,
    fetchMonthlyGoals,
    saveMonthlyGoals,
  }
})
