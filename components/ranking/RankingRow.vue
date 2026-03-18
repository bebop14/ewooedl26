<template>
  <NuxtLink
    :to="`/profile/${user.userId}`"
    class="flex items-center gap-2 py-2 px-3"
    :class="isMe ? 'bg-primary/10 border-l-2 border-primary rounded-lg' : ''"
  >
    <div class="w-8 text-center font-bold flex-shrink-0">
      <span v-if="rank === 1" class="text-lg">🥇</span>
      <span v-else-if="rank === 2" class="text-lg">🥈</span>
      <span v-else-if="rank === 3" class="text-lg">🥉</span>
      <span v-else class="text-gray-500">{{ rank }}</span>
    </div>

    <UAvatar :src="user.photoURL || undefined" :alt="user.displayName" size="sm" />

    <div class="flex-1 min-w-0">
      <p class="font-medium truncate">{{ user.displayName }}</p>
      <div class="flex items-center gap-2 text-xs text-muted mt-0.5">
        <span v-if="user.mainWorkoutType" class="flex items-center gap-1">
          <UIcon :name="user.mainWorkoutType.icon" class="text-sm" />
          {{ user.mainWorkoutType.label }}
        </span>
        <span v-if="user.lastWorkoutDate">
          최근 {{ formatLastDate(user.lastWorkoutDate) }}
        </span>
      </div>
    </div>

    <div class="text-right flex-shrink-0">
      <p class="font-bold text-lg">{{ user[sortBy] ?? 0 }}</p>
      <p class="text-xs text-muted">{{ sortBy === 'totalWorkouts' ? '회' : '일' }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { RankedUser } from '~/types/social'

defineProps<{
  user: RankedUser
  rank: number
  sortBy: 'totalWorkouts' | 'currentStreak' | 'longestStreak'
  isMe: boolean
}>()

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
