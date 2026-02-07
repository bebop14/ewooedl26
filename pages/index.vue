<template>
  <UContainer class="py-8">
    <UCard class="mb-6">
      <div class="flex items-center gap-4">
        <UAvatar :src="user?.photoURL || undefined" :alt="user?.displayName || '사용자'" size="lg" />
        <div class="flex-1">
          <h2 class="text-xl md:text-2xl font-semibold truncate">환영합니다, {{ user?.displayName }}님!</h2>
          <p class="text-sm text-muted">오늘도 화이팅!</p>
        </div>
        <UButton label="운동 기록" icon="i-lucide-plus" size="lg" to="/workouts/new" class="shrink-0 md:hidden" />
        <UButton label="오늘의 운동 기록하기" icon="i-lucide-plus" size="lg" to="/workouts/new" class="shrink-0 hidden md:inline-flex" />
      </div>
    </UCard>

    <!-- 통계 카드 -->
    <DashboardStatsCards
      :top-workout="topWorkout"
      :streak="userProfile?.stats.currentStreak ?? 0"
      :total-workouts="userProfile?.stats.totalWorkouts ?? 0"
      class="mb-8"
    />

    <!-- 운동 종류별 누적 기록 -->
    <DashboardWorkoutGaugeBar class="mb-8" />

    <!-- 차트 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <DashboardWeeklyChart />
      <DashboardTypeDistributionChart />
    </div>

    <!-- 다가오는 일정 -->
    <div class="mb-8">
      <DashboardUpcomingEvents :events="eventStore.upcomingEvents" />
    </div>

    <!-- 최근 운동 기록 -->
    <DashboardRecentWorkouts :workouts="recentWorkouts" />
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
const userStore = useUserStore()
const workoutStore = useWorkoutStore()
const eventStore = useEventStore()
const groupStore = useGroupStore()

const { userProfile } = storeToRefs(userStore)
const { workouts: recentWorkouts } = storeToRefs(workoutStore)
const topWorkout = ref<{ label: string; icon: string } | null>(null)

async function loadDashboardData() {
  if (!user.value) return

  const groupId = groupStore.currentGroupId
  const [, , top] = await Promise.all([
    workoutStore.fetchRecentWorkouts(5),
    eventStore.fetchUpcomingEvents(5, groupId),
    workoutStore.fetchTopWorkoutType(),
    workoutStore.fetchMonthlyTypeCounts(),
    workoutStore.fetchMonthlyGoals(),
  ])
  topWorkout.value = top ?? null
}

// 그룹 변경 시 데이터 리로드
watch(() => groupStore.currentGroupId, () => {
  loadDashboardData()
})

onMounted(async () => {
  if (user.value) {
    await userStore.loadUserProfile(user.value.uid)
    await loadDashboardData()
  }
})
</script>
