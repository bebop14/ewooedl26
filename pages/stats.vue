<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">운동 통계</h1>

    <!-- 요약 -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
      <!-- 연속 운동일 — 히어로 -->
      <div class="col-span-2 md:col-span-1 bg-primary rounded-xl p-4 relative overflow-hidden">
        <p class="text-xs font-semibold uppercase tracking-wider text-inverted/60 mb-1">연속 운동</p>
        <div class="flex items-end gap-1">
          <span class="text-5xl font-black text-inverted leading-none tracking-tighter">{{ userProfile?.stats.currentStreak ?? 0 }}</span>
          <span class="text-base text-inverted/70 mb-0.5">일</span>
        </div>
        <UIcon name="i-lucide-zap" class="absolute right-3 bottom-2 text-inverted/15 text-5xl" aria-hidden="true" />
      </div>

      <!-- 총 운동 수 -->
      <div class="bg-elevated rounded-xl p-4">
        <p class="text-xs text-muted mb-1">총 운동</p>
        <div class="flex items-end gap-1">
          <span class="text-4xl font-black text-highlighted leading-none tracking-tighter">{{ userProfile?.stats.totalWorkouts ?? 0 }}</span>
          <span class="text-sm text-muted mb-0.5">회</span>
        </div>
      </div>

      <!-- 최장 연속일 -->
      <div class="bg-elevated rounded-xl p-4">
        <p class="text-xs text-muted mb-1">최장 연속</p>
        <div class="flex items-end gap-1">
          <span class="text-4xl font-black text-highlighted leading-none tracking-tighter">{{ userProfile?.stats.longestStreak ?? 0 }}</span>
          <span class="text-sm text-muted mb-0.5">일</span>
        </div>
      </div>
    </div>

    <!-- 차트 영역 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StatsMonthlyTrendChart class="md:col-span-2" />
      <StatsWeeklyComparisonChart />
      <DashboardTypeDistributionChart />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
const userStore = useUserStore()
const { userProfile } = storeToRefs(userStore)

onMounted(async () => {
  if (user.value) {
    await userStore.loadUserProfile(user.value.uid)
  }
})
</script>
