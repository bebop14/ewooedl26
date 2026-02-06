<template>
  <UContainer class="py-8">
    <div v-if="loading" class="flex justify-center py-24">
      <UIcon name="i-lucide-loader-circle" class="text-4xl animate-spin text-muted" />
    </div>

    <div v-else-if="profile">
      <!-- 프로필 헤더 -->
      <UCard class="mb-6">
        <div class="flex items-center gap-6">
          <UAvatar :src="profile.photoURL || undefined" :alt="profile.displayName" size="xl" />
          <div>
            <h1 class="text-2xl font-bold">{{ profile.displayName }}</h1>
            <p class="text-sm text-muted">{{ profile.email }}</p>
            <UBadge :label="providerLabel" variant="subtle" class="mt-2" />
            <p class="text-xs text-muted mt-1">
              가입일: {{ formattedDate }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- 운동 통계 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <div class="text-center">
            <UIcon name="i-lucide-flame" class="text-2xl text-blue-500 mb-2" />
            <p class="text-xs text-muted">총 운동</p>
            <p class="text-2xl font-bold">{{ profile.stats.totalWorkouts }}회</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <UIcon name="i-lucide-zap" class="text-2xl text-green-500 mb-2" />
            <p class="text-xs text-muted">연속 운동</p>
            <p class="text-2xl font-bold">{{ profile.stats.currentStreak }}일</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <UIcon name="i-lucide-trophy" class="text-2xl text-amber-500 mb-2" />
            <p class="text-xs text-muted">최장 연속</p>
            <p class="text-2xl font-bold">{{ profile.stats.longestStreak }}일</p>
          </div>
        </UCard>
      </div>
    </div>

    <div v-else>
      <UEmpty
        icon="i-lucide-user-x"
        title="프로필을 찾을 수 없습니다"
        description="존재하지 않는 사용자입니다."
        :actions="[{ label: '홈으로 돌아가기', to: '/' }]"
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const userStore = useUserStore()
const { userProfile: profile, loading } = storeToRefs(userStore)

const userId = route.params.id as string

const providerLabel = computed(() => {
  const providers: Record<string, string> = {
    'google.com': 'Google',
    'naver.com': '네이버',
    'kakao.com': '카카오',
  }
  return providers[profile.value?.provider || ''] || profile.value?.provider || ''
})

const formattedDate = computed(() => {
  if (!profile.value?.createdAt) return ''
  return new Date(profile.value.createdAt).toLocaleDateString('ko-KR')
})

onMounted(() => {
  userStore.loadUserProfile(userId)
})
</script>
