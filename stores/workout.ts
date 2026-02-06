import { defineStore } from 'pinia'
import {
  collection, doc, addDoc, getDoc, getDocs, query,
  where, orderBy, limit, Timestamp,
} from 'firebase/firestore'
import type { Workout, WorkoutFormData, WeeklyStats, TypeDistribution } from '~/types/workout'
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

  async function addWorkout(formData: WorkoutFormData, imageUrls: { imageUrl: string; thumbnailUrl: string }) {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      const workoutDate = Timestamp.fromDate(new Date(formData.date + 'T00:00:00'))

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

    const CHART_COLORS: string[] = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#A855F7',
      '#64748B', '#84CC16', '#6B7280',
    ]
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
    if (!user.value) return

    if (!userStore.userProfile) {
      await userStore.loadUserProfile(user.value.uid)
    }
    if (!userStore.userProfile) return

    const currentStats = userStore.userProfile.stats
    const today = getLocalDateString()

    let newStreak = currentStats.currentStreak
    const lastDate = currentStats.lastWorkoutDate

    // streak은 운동 날짜가 아닌 실제 기록일(오늘) 기준으로 계산
    if (lastDate === today) {
      // 오늘 이미 운동함 - streak 유지
    } else if (lastDate === getYesterdayDateString()) {
      newStreak += 1
    } else {
      newStreak = 1
    }

    const newLongest = Math.max(currentStats.longestStreak, newStreak)

    await userStore.updateStats(user.value.uid, {
      totalWorkouts: currentStats.totalWorkouts + 1,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastWorkoutDate: today,
    })
  }

  return {
    workouts,
    todayWorkouts,
    loading,
    submitting,
    addWorkout,
    fetchTodayWorkouts,
    fetchRecentWorkouts,
    fetchWorkoutById,
    fetchWeeklyStats,
    fetchTypeDistribution,
  }
})
