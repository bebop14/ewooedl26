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
        <!-- 인앱 브라우저(WebView) 감지 시 외부 브라우저 안내 -->
        <template v-if="isInAppBrowser">
          <UAlert
            color="warning"
            icon="i-lucide-external-link"
            title="인앱 브라우저에서는 Google 로그인이 제한됩니다"
            description="아래 버튼을 눌러 외부 브라우저에서 열어주세요."
          />
          <UButton
            block
            color="primary"
            label="외부 브라우저에서 열기"
            icon="i-lucide-external-link"
            @click="openInExternalBrowser"
          />
          <UButton
            block
            variant="outline"
            :label="urlCopied ? '복사 완료!' : 'URL 복사 후 브라우저에 붙여넣기'"
            :icon="urlCopied ? 'i-lucide-check' : 'i-lucide-copy'"
            @click="copyUrl"
          />
          <p class="text-xs text-center text-muted">
            또는 우측 상단 메뉴(⋮)에서 "다른 브라우저로 열기"를 선택해주세요.
          </p>
        </template>

        <template v-else>
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
        </template>

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

// 인앱 브라우저(WebView) 감지
const isInAppBrowser = computed(() => {
  if (!import.meta.client) return false
  const ua = navigator.userAgent || ''
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|Twitter|Snapchat|NAVER|ZumApp|everytimeApp|DaumApps|wv\)/.test(ua)
    || (ua.includes('Android') && ua.includes('Version/') && !ua.includes('Chrome'))
})

// 외부 브라우저로 열기
const openInExternalBrowser = () => {
  const currentUrl = window.location.href
  const ua = navigator.userAgent || ''

  if (/KAKAOTALK/i.test(ua)) {
    // 카카오톡 전용 scheme
    window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(currentUrl)
  } else if (/FBAN|FBAV/i.test(ua)) {
    // 페이스북/인스타그램 - target _blank 시도
    window.open(currentUrl, '_blank')
  } else if (ua.includes('Android')) {
    // Android 기타 인앱 브라우저 - intent scheme
    window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;end`
  } else {
    // iOS 기타 - Safari 열기 시도
    window.location.href = currentUrl
  }

  // fallback: 1초 후에도 페이지가 남아있으면 URL 복사 안내
  setTimeout(() => {
    urlCopied.value = false
  }, 1000)
}

const urlCopied = ref(false)
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    urlCopied.value = true
    setTimeout(() => { urlCopied.value = false }, 2000)
  } catch {
    // clipboard API 미지원 시 fallback
    const input = document.createElement('input')
    input.value = window.location.href
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    urlCopied.value = true
    setTimeout(() => { urlCopied.value = false }, 2000)
  }
}

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
    if (err.code === 'auth/unauthorized-domain') {
      error.value = '승인되지 않은 도메인입니다. Firebase Console에서 도메인을 추가해주세요.'
    } else if (err.code === 'auth/popup-blocked') {
      error.value = '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.'
    } else {
      error.value = err.message || '로그인 중 오류가 발생했습니다.'
    }
  } finally {
    loading.value = false
  }
}
</script>
