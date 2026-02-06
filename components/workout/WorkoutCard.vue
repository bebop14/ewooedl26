<template>
  <NuxtLink :to="`/workouts/${workout.id}`" class="block">
    <UCard class="hover:shadow-md transition-shadow">
      <div class="flex gap-4">
        <img
          :src="workout.thumbnailUrl"
          :alt="typeLabel"
          class="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <UIcon :name="typeIcon" class="text-lg text-blue-500" />
            <span class="font-medium">{{ typeLabel }}</span>
          </div>
          <p v-if="workout.memo" class="text-sm text-gray-600 dark:text-gray-400 truncate">
            {{ workout.memo }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-gray-400">{{ relativeTime }}</span>
            <div v-if="workout.hashtags.length" class="flex gap-1">
              <UBadge
                v-for="tag in workout.hashtags.slice(0, 3)"
                :key="tag"
                variant="subtle"
                color="info"
                size="xs"
              >
                #{{ tag }}
              </UBadge>
            </div>
            <div class="flex items-center gap-3 ml-auto text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-heart" class="text-sm" />
                {{ workout.likes }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-message-circle" class="text-sm" />
                {{ workout.comments }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Workout } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'
import { Timestamp } from 'firebase/firestore'

const props = defineProps<{
  workout: Workout
}>()

const typeInfo = computed(() =>
  WORKOUT_TYPES.find((t) => t.value === props.workout.workoutType) ?? WORKOUT_TYPES[WORKOUT_TYPES.length - 1],
)

const typeLabel = computed(() => typeInfo.value?.label ?? '기타')
const typeIcon = computed(() => typeInfo.value?.icon ?? 'i-lucide-activity')

const relativeTime = computed(() => {
  const date = props.workout.date instanceof Timestamp
    ? props.workout.date.toDate()
    : new Date(props.workout.date)

  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  return `${days}일 전`
})
</script>
