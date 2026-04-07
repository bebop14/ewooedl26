<template>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
    <!-- 연속 운동일 — 히어로 -->
    <div class="col-span-2 md:col-span-1 bg-primary rounded-xl p-5 relative overflow-hidden">
      <p class="text-xs font-semibold uppercase tracking-wider text-inverted/60 mb-2">연속 운동일</p>
      <div class="flex items-end gap-1.5">
        <span class="text-6xl font-black text-inverted leading-none tracking-tighter">{{ streak }}</span>
        <span class="text-xl font-semibold text-inverted/70 mb-1">일</span>
      </div>
      <UIcon name="i-lucide-zap" class="absolute right-4 bottom-3 text-inverted/20 text-6xl" aria-hidden="true" />
    </div>

    <!-- 총 운동 횟수 -->
    <div class="bg-elevated rounded-xl p-4">
      <p class="text-xs text-muted mb-2">총 운동</p>
      <div class="flex items-end gap-1">
        <span class="text-4xl font-black text-highlighted leading-none tracking-tighter">{{ totalWorkouts }}</span>
        <span class="text-sm text-muted mb-0.5">회</span>
      </div>
      <UIcon name="i-lucide-trophy" class="text-muted text-xl mt-3" aria-hidden="true" />
    </div>

    <!-- 주력 운동 -->
    <div class="bg-elevated rounded-xl p-4">
      <p class="text-xs text-muted mb-2">주력 운동</p>
      <p class="text-2xl font-black text-highlighted leading-tight">{{ topWorkoutLabel }}</p>
      <UIcon :name="topWorkoutIcon" class="text-primary text-2xl mt-3" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  topWorkout: { label: string; icon: string } | null
  streak: number
  totalWorkouts: number
}>()

const topWorkoutLabel = computed(() => props.topWorkout?.label ?? '-')
const topWorkoutIcon = computed(() => props.topWorkout?.icon ?? 'i-lucide-activity')
</script>
