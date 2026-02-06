import { defineStore } from 'pinia'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { updateProfile as updateAuthProfile } from 'firebase/auth'

// nuxt-vuefire가 자동으로 제공하는 composables는 store 내부에서 사용

export interface UserStats {
  totalWorkouts: number
  currentStreak: number
  longestStreak: number
  lastWorkoutDate: string | null
}

export interface UserProfile {
  displayName: string
  email: string
  photoURL: string
  provider: string
  createdAt: string
  stats: UserStats
  groupIds: string[]
}

export const useUserStore = defineStore('user', () => {
  const db = useFirestore()
  const currentUser = useCurrentUser()

  const userProfile = ref<UserProfile | null>(null)
  const loading = ref(false)

  // 사용자 프로필 로드
  const loadUserProfile = async (userId: string) => {
    loading.value = true
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        userProfile.value = userDoc.data() as UserProfile
      } else {
        // 프로필이 없으면 생성
        await createUserProfile(userId)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      loading.value = false
    }
  }

  // 새 사용자 프로필 생성
  const createUserProfile = async (userId: string) => {
    if (!currentUser.value) return

    const newProfile: UserProfile = {
      displayName: currentUser.value.displayName || 'Unknown',
      email: currentUser.value.email || '',
      photoURL: currentUser.value.photoURL || '',
      provider: currentUser.value.providerData[0]?.providerId || 'unknown',
      createdAt: new Date().toISOString(),
      stats: {
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
      },
      groupIds: [],
    }

    await setDoc(doc(db, 'users', userId), newProfile)
    userProfile.value = newProfile
  }

  // 통계 업데이트
  const updateStats = async (userId: string, stats: Partial<UserStats>) => {
    if (!userProfile.value) return

    const updatedStats = {
      ...userProfile.value.stats,
      ...stats,
    }

    await updateDoc(doc(db, 'users', userId), {
      stats: updatedStats,
    })

    userProfile.value.stats = updatedStats
  }

  // 프로필 업데이트 (이름, 사진)
  const updateUserProfile = async (userId: string, data: { displayName?: string; photoURL?: string }) => {
    if (!userProfile.value || !currentUser.value) return

    await updateDoc(doc(db, 'users', userId), data)
    await updateAuthProfile(currentUser.value, data)

    if (data.displayName) userProfile.value.displayName = data.displayName
    if (data.photoURL) userProfile.value.photoURL = data.photoURL
  }

  return {
    userProfile,
    loading,
    loadUserProfile,
    createUserProfile,
    updateStats,
    updateUserProfile,
  }
})
