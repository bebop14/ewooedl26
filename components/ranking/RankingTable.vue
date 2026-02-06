<template>
  <div v-if="sortedUsers.length === 0" class="text-center py-12 text-gray-500">
    아직 순위 데이터가 없습니다.
  </div>

  <div v-else class="space-y-3">
    <UCard
      v-for="(u, idx) in sortedUsers"
      :key="u.userId"
      :class="u.userId === currentUserId ? 'ring-1 ring-blue-500' : ''"
    >
      <NuxtLink :to="`/profile/${u.userId}`" class="block">
        <!-- 상단: 순위 + 아바타 + 이름 + 정렬기준 값 -->
        <div class="flex items-center gap-3">
          <div class="w-8 text-center font-bold flex-shrink-0">
            <span v-if="idx === 0" class="text-2xl">🥇</span>
            <span v-else-if="idx === 1" class="text-2xl">🥈</span>
            <span v-else-if="idx === 2" class="text-2xl">🥉</span>
            <span v-else class="text-gray-500">{{ idx + 1 }}</span>
          </div>

          <UAvatar :src="u.photoURL || undefined" :alt="u.displayName" size="sm" />

          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ u.displayName }}</p>
            <div class="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <span v-if="u.mainWorkoutType" class="flex items-center gap-1">
                <UIcon :name="u.mainWorkoutType.icon" class="text-sm" />
                {{ u.mainWorkoutType.label }}
              </span>
              <span v-if="u.lastWorkoutDate">
                최근 {{ formatLastDate(u.lastWorkoutDate) }}
              </span>
            </div>
          </div>

          <div class="text-right flex-shrink-0">
            <p class="font-bold text-lg">{{ displayValue(u) }}</p>
            <p class="text-xs text-gray-400">{{ sortBy === 'totalWorkouts' ? '회' : '일' }}</p>
          </div>
        </div>

        <!-- 하단: 운동 종류별 횟수 -->
        <div v-if="u.workoutTypeStats.length > 0" class="flex flex-wrap gap-1.5 mt-3 ml-11">
          <UBadge
            v-for="stat in u.workoutTypeStats"
            :key="stat.type"
            variant="subtle"
            color="neutral"
            size="xs"
          >
            <UIcon :name="stat.icon" class="text-xs mr-0.5" />
            {{ stat.label }} {{ stat.count }}
          </UBadge>
        </div>
      </NuxtLink>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { RankedUser } from '~/types/social'

const props = defineProps<{
  users: RankedUser[]
  sortBy: 'totalWorkouts' | 'currentStreak' | 'longestStreak'
  currentUserId: string
}>()

const sortedUsers = computed(() => {
  return [...props.users].sort((a, b) => {
    return (b[props.sortBy] ?? 0) - (a[props.sortBy] ?? 0)
  })
})

function displayValue(u: RankedUser) {
  return u[props.sortBy] ?? 0
}

function formatLastDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
</script>
