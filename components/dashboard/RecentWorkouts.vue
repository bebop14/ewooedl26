<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">최근 운동 기록</h3>
    </template>
    <div v-if="workouts.length" class="space-y-3">
      <WorkoutCard v-for="w in workouts" :key="w.id" :workout="w" />
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

defineProps<{
  workouts: Workout[]
}>()
</script>
