import { type Auth, type User } from 'firebase/auth'
import { type Firestore } from 'firebase/firestore'
import { type FirebaseStorage } from 'firebase/storage'

export const useFirebaseAuth = (): Auth | null => {
  const { $firebase } = useNuxtApp()
  return $firebase?.auth || null
}

export const useFirestore = (): Firestore | null => {
  const { $firebase } = useNuxtApp()
  return $firebase?.db || null
}

export const useFirebaseStorage = (): FirebaseStorage | null => {
  const { $firebase } = useNuxtApp()
  return $firebase?.storage || null
}

// 미들웨어용: Firebase 초기화 완료를 기다린 후 현재 사용자 반환
export const getCurrentUser = (auth: Auth): Promise<User | null> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser)
      return
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// 컴포넌트용: 반응형 사용자 상태
const globalUser = ref<User | null>(null)
let authInitialized = false

export const useCurrentUser = () => {
  const auth = useFirebaseAuth()

  if (auth && !authInitialized) {
    authInitialized = true
    globalUser.value = auth.currentUser
    auth.onAuthStateChanged((newUser) => {
      globalUser.value = newUser
    })
  }

  return globalUser
}
