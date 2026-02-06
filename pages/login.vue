<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-3xl font-bold">EDL 이우애용 2026 오운완</h1>
          <p class="text-sm text-muted mt-1">오늘도 운동 완료! 당신의 운동 여정을 확인해보세요</p>
        </div>
      </template>

      <div class="space-y-4">
        <UButton
          block
          variant="outline"
          :loading="loading"
          label="Google로 시작하기"
          @click="signInWithGoogle"
        >
          <template #leading>
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
          </template>
        </UButton>

      </div>

      <UAlert
        v-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        :title="error"
        class="mt-4"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

definePageMeta({ middleware: 'guest' })

const router = useRouter()
const auth = useFirebaseAuth()!

const loading = ref(false)
const error = ref('')

const user = useCurrentUser()

// 이미 로그인되어 있으면 홈으로 이동
watch(user, (newUser) => {
  if (newUser) {
    router.push('/')
  }
}, { immediate: true })

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''

  try {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    router.push('/')
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || '로그인 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
</script>
