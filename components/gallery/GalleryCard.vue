<template>
  <NuxtLink :to="`/workouts/${workout.id}`" class="block group">
    <div class="overflow-hidden rounded-lg">
      <img
        :src="workout.thumbnailUrl"
        :alt="typeLabel"
        class="w-full aspect-square object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
    </div>
    <div class="mt-2 flex items-center gap-2">
      <UAvatar :src="workout.userPhoto || undefined" :alt="workout.userName" size="xs" />
      <span class="text-sm truncate">{{ workout.userName }}</span>
      <span class="text-xs text-muted ml-auto flex items-center gap-1">
        <UIcon :name="typeIcon" class="text-sm" />
        {{ typeLabel }}
      </span>
      <span class="text-xs text-muted flex items-center gap-0.5">
        <UIcon name="i-lucide-heart" class="text-sm" />
        {{ workout.likes }}
      </span>
      <span class="text-xs text-muted flex items-center gap-0.5">
        <UIcon name="i-lucide-message-circle" class="text-sm" />
        {{ workout.comments }}
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Workout } from '~/types/workout'
import { WORKOUT_TYPES } from '~/types/workout'

const props = defineProps<{
  workout: Workout
}>()

const typeInfo = computed(() =>
  WORKOUT_TYPES.find((t) => t.value === props.workout.workoutType) ?? WORKOUT_TYPES[WORKOUT_TYPES.length - 1],
)
const typeLabel = computed(() => typeInfo.value?.label ?? '기타')
const typeIcon = computed(() => typeInfo.value?.icon ?? 'i-lucide-activity')
</script>
