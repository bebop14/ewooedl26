<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">최근 운동 기록</h3>
    </template>
    <div v-if="workouts.length" class="flex flex-wrap gap-3">
      <NuxtLink
        v-for="w in workouts"
        :key="w.id"
        :to="`/workouts/${w.id}`"
        class="group relative w-28 rounded-lg overflow-hidden flex-shrink-0"
      >
        <img
          :src="w.thumbnailUrl"
          :alt="getTypeLabel(w.workoutType)"
          class="w-full h-24 object-cover group-hover:scale-105 transition-transform"
        />
        <div class="bg-gray-50 dark:bg-gray-800 px-1.5 py-1 space-y-0.5">
          <p class="text-xs font-medium truncate">{{ getTypeLabel(w.workoutType) }}</p>
          <p class="text-[0.6rem] text-gray-400">{{ formatDate(w.date) }}</p>
          <div class="flex items-center gap-2 text-[0.6rem] text-gray-400">
            <span class="flex items-center gap-0.5">
              <UIcon name="i-lucide-heart" class="text-[0.55rem]" />
              {{ w.likes }}
            </span>
            <span class="flex items-center gap-0.5">
              <UIcon name="i-lucide-message-circle" class="text-[0.55rem]" />
              {{ w.comments }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>
    <UEmpty
      v-else
      icon="i-lucide-dumbbell"
      title="아직 운동 기록이 없습니다"
      description="첫 번째 운동을 기록해보세요!"
    />
  </UCard>
</template>

<script setup lang="ts">
import type { Workout } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'
import { Timestamp } from 'firebase/firestore'

defineProps<{
  workouts: Workout[]
}>()

function getTypeLabel(type: string) {
  return WORKOUT_TYPES.find((t) => t.value === type)?.label ?? '기타'
}

function formatDate(date: Timestamp | unknown) {
  const d = date instanceof Timestamp ? date.toDate() : new Date(date as string)
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
</script>
