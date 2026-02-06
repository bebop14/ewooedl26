import type { Timestamp } from 'firebase/firestore'

export const WORKOUT_TYPES = [
  { value: 'soccer', label: '축구', icon: 'i-lucide-target' },
  { value: 'weight', label: '웨이트 트레이닝', icon: 'i-lucide-dumbbell' },
  { value: 'running', label: '러닝', icon: 'i-lucide-zap' },
  { value: 'walking', label: '걷기', icon: 'i-lucide-footprints' },
  { value: 'cycling', label: '자전거', icon: 'i-lucide-bike' },
  { value: 'yoga', label: '요가', icon: 'i-lucide-flower-2' },
  { value: 'swimming', label: '수영', icon: 'i-lucide-waves' },
  { value: 'hiking', label: '등산', icon: 'i-lucide-mountain' },
  { value: 'tennis', label: '테니스', icon: 'i-lucide-circle-dot' },
  { value: 'stairs', label: '계단오르기', icon: 'i-lucide-trending-up' },
  { value: 'crossfit', label: '크로스핏', icon: 'i-lucide-flame' },
  { value: 'home', label: '홈트레이닝', icon: 'i-lucide-house' },
  { value: 'other', label: '기타', icon: 'i-lucide-activity' },
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

export interface TypeDistribution {
  labels: string[]
  counts: number[]
  colors: string[]
}
