<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">운동 통계</h1>

    <!-- 요약 카드 -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">총 운동 수</p>
          <p class="text-3xl font-bold text-emerald-600">{{ userProfile?.stats.totalWorkouts ?? 0 }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">연속 운동일</p>
          <p class="text-3xl font-bold text-emerald-600">{{ userProfile?.stats.currentStreak ?? 0 }}<span class="text-base font-normal text-gray-400">일</span></p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">최장 연속일</p>
          <p class="text-3xl font-bold text-emerald-600">{{ userProfile?.stats.longestStreak ?? 0 }}<span class="text-base font-normal text-gray-400">일</span></p>
        </div>
      </UCard>
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
