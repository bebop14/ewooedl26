<template>
  <div v-if="sortedUsers.length === 0" class="text-center py-12 text-gray-500">
    아직 순위 데이터가 없습니다.
  </div>

  <div v-else class="divide-y divide-gray-800">
    <RankingRow
      v-for="{ user: u, rank } in paginatedUsers"
      :key="u.userId"
      :user="u"
      :rank="rank"
      :sort-by="sortBy"
      :is-me="u.userId === currentUserId"
    />

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4">
      <UButton
        icon="i-lucide-chevron-left"
        size="xs"
        variant="outline"
        :disabled="page === 1"
        @click="page--"
      />
      <span class="text-sm text-gray-400">{{ page }} / {{ totalPages }}</span>
      <UButton
        icon="i-lucide-chevron-right"
        size="xs"
        variant="outline"
        :disabled="page === totalPages"
        @click="page++"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RankedUser } from '~/types/social'

const PAGE_SIZE = 20

const props = defineProps<{
  users: RankedUser[]
  sortBy: 'totalWorkouts' | 'currentStreak' | 'longestStreak'
  currentUserId: string
}>()

const page = ref(1)

// 정렬 기준 변경 시 페이지 초기화
watch(() => props.sortBy, () => { page.value = 1 })

const sortedUsers = computed(() => {
  return [...props.users].sort((a, b) => {
    return (b[props.sortBy] ?? 0) - (a[props.sortBy] ?? 0)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedUsers.value.length / PAGE_SIZE)))

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return sortedUsers.value.slice(start, start + PAGE_SIZE).map((u, i) => ({
    user: u,
    rank: start + i + 1,
  }))
})

</script>
