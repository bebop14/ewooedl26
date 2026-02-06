import type { Timestamp } from 'firebase/firestore'

export interface LikeDoc {
  workoutId: string
  userId: string
  createdAt: Timestamp
}

export interface Like extends LikeDoc {
  id: string
}

export interface CommentDoc {
  workoutId: string
  userId: string
  userName: string
  userPhoto: string
  content: string
  createdAt: Timestamp
}

export interface Comment extends CommentDoc {
  id: string
}

export interface WorkoutTypeStat {
  type: string
  label: string
  icon: string
  count: number
}

export interface RankedUser {
  userId: string
  displayName: string
  photoURL: string
  totalWorkouts: number
  currentStreak: number
  longestStreak: number
  mainWorkoutType: WorkoutTypeStat | null
  workoutTypeStats: WorkoutTypeStat[]
  lastWorkoutDate: string | null
}

export interface GalleryFilters {
  workoutType: string | null
}
