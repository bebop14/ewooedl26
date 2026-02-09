import type { Timestamp } from 'firebase/firestore'

export const WORKOUT_TYPES = [
  { value: 'soccer', label: '축구', icon: 'i-mdi-soccer' },
  { value: 'weight', label: '웨이트 트레이닝', icon: 'i-mdi-dumbbell' },
  { value: 'running', label: '러닝', icon: 'i-mdi-run-fast' },
  { value: 'walking', label: '걷기', icon: 'i-mdi-walk' },
  { value: 'cycling', label: '자전거', icon: 'i-mdi-bike' },
  { value: 'yoga', label: '요가', icon: 'i-mdi-yoga' },
  { value: 'swimming', label: '수영', icon: 'i-mdi-swim' },
  { value: 'hiking', label: '등산', icon: 'i-mdi-hiking' },
  { value: 'tennis', label: '테니스', icon: 'i-mdi-tennis' },
  { value: 'stairs', label: '계단오르기', icon: 'i-mdi-stairs-up' },
  { value: 'crossfit', label: '크로스핏', icon: 'i-mdi-fire' },
  { value: 'home', label: '홈트레이닝', icon: 'i-mdi-home' },
  { value: 'other', label: '기타', icon: 'i-mdi-dots-horizontal' },
] as const

export type WorkoutTypeValue = typeof WORKOUT_TYPES[number]['value']

export interface WorkoutDoc {
  userId: string
  userName: string
  userPhoto: string
  workoutType: WorkoutTypeValue
  date: Timestamp
  imageUrl: string
  thumbnailUrl: string
  memo: string
  likes: number
  comments: number
  hashtags: string[]
  groupIds: string[]
}

export interface WorkoutFormData {
  workoutType: WorkoutTypeValue
  date: string
  imageFile: File | null
  memo: string
  hashtags: string[]
}

export interface Workout extends WorkoutDoc {
  id: string
}

export interface WeeklyStats {
  labels: string[]
  counts: number[]
}

export interface WeeklyTypeDataset {
  label: string
  data: number[]
  backgroundColor: string
}

export interface WeeklyTypeStats {
  labels: string[]
  datasets: WeeklyTypeDataset[]
}

export interface TypeDistribution {
  labels: string[]
  counts: number[]
  colors: string[]
}

export interface MonthlyTrend {
  labels: string[]
  counts: number[]
}

export interface WeeklyComparison {
  labels: string[]
  thisWeek: number[]
  lastWeek: number[]
}
