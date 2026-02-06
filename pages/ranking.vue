<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">종합 순위</h1>

    <!-- 전체 회원 운동 현황 -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <UCard>
        <div class="text-center">
          <UIcon name="i-lucide-users" class="text-2xl text-blue-500 mb-1" />
          <p class="text-2xl font-bold">{{ totalMembers }}</p>
          <p class="text-sm text-gray-500">총 회원수</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <UIcon name="i-lucide-dumbbell" class="text-2xl text-green-500 mb-1" />
          <p class="text-2xl font-bold">{{ totalAllWorkouts }}</p>
          <p class="text-sm text-gray-500">총 운동 횟수</p>
        </div>
      </UCard>
    </div>

    <div class="flex gap-2 mb-6">
      <UButton
        v-for="tab in tabs"
        :key="tab.value"
        :label="tab.label"
        :icon="tab.icon"
        :variant="activeTab === tab.value ? 'solid' : 'outline'"
        @click="activeTab = tab.value"
      />
    </div>

    <div v-if="socialStore.rankingsLoading" class="text-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
    </div>

    <RankingTable
      v-else
      :users="socialStore.rankings"
      :sort-by="activeTab"
      :current-user-id="user?.uid ?? ''"
    />
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
const socialStore = useSocialStore()
const groupStore = useGroupStore()

const tabs = [
  { value: 'totalWorkouts' as const, label: '운동 횟수', icon: 'i-lucide-dumbbell' },
  { value: 'currentStreak' as const, label: '연속 운동', icon: 'i-lucide-flame' },
  { value: 'longestStreak' as const, label: '최장 연속', icon: 'i-lucide-trophy' },
]

const activeTab = ref<'totalWorkouts' | 'currentStreak' | 'longestStreak'>('totalWorkouts')

const totalMembers = computed(() => socialStore.rankings.length)
const totalAllWorkouts = computed(() =>
  socialStore.rankings.reduce((sum, u) => sum + u.totalWorkouts, 0),
)

function loadRankings() {
  const myGroupIds = groupStore.myGroups.map(g => g.id)
  socialStore.fetchRankings(groupStore.currentGroupId, myGroupIds)
}

// 그룹 변경 시 데이터 리로드
watch(() => groupStore.currentGroupId, () => {
  loadRankings()
})

onMounted(async () => {
  await groupStore.fetchMyGroups()
  loadRankings()
})
</script>
