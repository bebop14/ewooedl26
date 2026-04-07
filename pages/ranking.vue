<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">종합 순위</h1>

    <!-- 전체 현황 -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <!-- 누적 운동 횟수 — 히어로 -->
      <div class="bg-primary rounded-xl p-4 relative overflow-hidden">
        <p class="text-xs font-semibold uppercase tracking-wider text-inverted/60 mb-1">누적 운동</p>
        <div class="flex items-end gap-1">
          <span class="text-5xl font-black text-inverted leading-none tracking-tighter">{{ totalAllWorkouts }}</span>
          <span class="text-base text-inverted/70 mb-0.5">회</span>
        </div>
        <UIcon name="i-lucide-dumbbell" class="absolute right-3 bottom-2 text-inverted/15 text-5xl" aria-hidden="true" />
      </div>

      <!-- 총 회원수 -->
      <div class="bg-elevated rounded-xl p-4">
        <p class="text-xs text-muted mb-1">총 회원</p>
        <div class="flex items-end gap-1">
          <span class="text-5xl font-black text-highlighted leading-none tracking-tighter">{{ totalMembers }}</span>
          <span class="text-base text-muted mb-0.5">명</span>
        </div>
        <UIcon name="i-lucide-users" class="text-muted text-xl mt-2" aria-hidden="true" />
      </div>
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

    <RankingChart
      v-if="!socialStore.rankingsLoading"
      :users="socialStore.rankings"
      :sort-by="activeTab"
      class="mb-6"
    />

    <div v-if="socialStore.rankingsLoading" class="text-center py-12" role="status" aria-label="로딩 중">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" aria-hidden="true" />
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
import type { RankedUser } from '~/types/social'
import type { Group } from '~/types/group'

definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
const socialStore = useSocialStore()
const groupStore = useGroupStore()
const initialized = ref(false)

const tabs = [
  { value: 'totalWorkouts' as const, label: '운동 횟수', icon: 'i-lucide-dumbbell' },
  { value: 'currentStreak' as const, label: '연속 운동', icon: 'i-lucide-flame' },
  { value: 'longestStreak' as const, label: '최장 연속', icon: 'i-lucide-trophy' },
]

const activeTab = ref<'totalWorkouts' | 'currentStreak' | 'longestStreak'>('totalWorkouts')

const totalMembers = computed(() => socialStore.rankings.length)
const totalAllWorkouts = computed(() =>
  socialStore.rankings.reduce((sum: number, u: RankedUser) => sum + u.totalWorkouts, 0),
)

function loadRankings() {
  if (!initialized.value) return
  const myGroupIds = groupStore.myGroups.map((g: Group) => g.id)
  socialStore.fetchRankings(groupStore.currentGroupId, myGroupIds)
}

// 그룹 변경 시 데이터 리로드
watch(() => groupStore.currentGroupId, () => {
  loadRankings()
})

onMounted(async () => {
  if (groupStore.myGroups.length === 0) {
    await groupStore.fetchMyGroups()
    groupStore.restoreSelectedGroup()
    if (!groupStore.currentGroupId && groupStore.myGroups.length > 0) {
      groupStore.selectGroup(groupStore.myGroups[0]!.id)
    }
  }
  initialized.value = true
  loadRankings()
})
</script>
