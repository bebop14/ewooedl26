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

    <!-- 피드백 -->
    <div class="text-center mt-8 pb-4">
      <UButton
        label="의견 보내기"
        icon="i-lucide-message-square-plus"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="feedbackOpen = true"
      />
    </div>

    <DashboardFeedbackModal v-model:open="feedbackOpen" @submit="handleFeedbackSubmit" />
  </UContainer>
</template>

<script setup lang="ts">
import { collection, addDoc, Timestamp } from 'firebase/firestore'

definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
const db = useFirestore()
const toast = useToast()
const userStore = useUserStore()
const workoutStore = useWorkoutStore()
const eventStore = useEventStore()
const groupStore = useGroupStore()

const { userProfile } = storeToRefs(userStore)
const { workouts: recentWorkouts } = storeToRefs(workoutStore)
const topWorkout = ref<{ label: string; icon: string } | null>(null)
const feedbackOpen = ref(false)

async function loadDashboardData() {
  if (!user.value) return

  const groupId = groupStore.currentGroupId
  const [, , top] = await Promise.all([
    workoutStore.fetchRecentWorkouts(5),
    eventStore.fetchUpcomingEvents(5, groupId),
    workoutStore.fetchTopWorkoutType(),
    workoutStore.fetchMonthlyTypeCounts(),
    workoutStore.fetchMonthlyGoals(),
    workoutStore.recalculateUserStats(),
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

async function handleFeedbackSubmit(content: string) {
  if (!user.value || !db) return
  try {
    await addDoc(collection(db, 'feedback'), {
      userId: user.value.uid,
      userName: user.value.displayName || '',
      content,
      createdAt: Timestamp.now(),
    })
    toast.add({
      title: '의견이 전송되었습니다',
      description: '소중한 의견 감사합니다!',
      color: 'success',
    })
  } catch {
    toast.add({
      title: '전송 실패',
      description: '잠시 후 다시 시도해주세요',
      color: 'error',
    })
  }
}
</script>
