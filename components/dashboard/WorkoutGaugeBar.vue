<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-bar-chart-3" class="text-lg text-primary" />
        <h3 class="text-lg font-semibold">운동 종류별 누적 기록</h3>
        <div class="flex-1" />
        <UButton
          icon="i-lucide-settings"
          variant="ghost"
          size="xs"
          @click="goalModalOpen = true"
        />
      </div>
    </template>

    <div class="space-y-4">
      <div v-for="item in gaugeItems" :key="item.value" class="flex items-center gap-3">
        <UIcon :name="item.icon" class="text-xl shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm font-medium">{{ item.label }}</span>
            <span class="text-sm text-muted">
              {{ item.goal ? `${item.count} / ${item.goal}회` : `${item.count}회` }}
            </span>
          </div>
          <div class="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: item.percent + '%', backgroundColor: item.color }"
            />
          </div>
        </div>
      </div>
    </div>

    <DashboardWorkoutGoalModal
      v-model:open="goalModalOpen"
      :current-goals="goals"
      @save="handleSaveGoals"
    />
  </UCard>
</template>

<script setup lang="ts">
import { WORKOUT_TYPES } from '~/types/workout'

const workoutStore = useWorkoutStore()

const COLORS: Record<string, string> = {
  soccer: '#22c55e',
  weight: '#3b82f6',
  running: '#f59e0b',
  walking: '#8b5cf6',
  cycling: '#ef4444',
  yoga: '#ec4899',
  swimming: '#06b6d4',
  hiking: '#84cc16',
  tennis: '#f97316',
  stairs: '#14b8a6',
  crossfit: '#e11d48',
  home: '#6366f1',
  other: '#6b7280',
}

const goals = computed(() => workoutStore.monthlyGoals)
const goalModalOpen = ref(false)

async function handleSaveGoals(newGoals: Record<string, number>) {
  await workoutStore.saveMonthlyGoals(newGoals)
}

onMounted(async () => {
  await Promise.all([
    workoutStore.fetchMonthlyTypeCounts(),
    workoutStore.fetchMonthlyGoals(),
  ])
})

const hasGoals = computed(() => Object.keys(goals.value).length > 0)

const maxCount = computed(() => Math.max(...Object.values(workoutStore.monthlyTypeCounts), 1))

const gaugeItems = computed(() => {
  return WORKOUT_TYPES
    .filter((type) => {
      const count = workoutStore.monthlyTypeCounts[type.value] ?? 0
      const goal = goals.value[type.value]

      if (hasGoals.value) {
        if (goal && goal > 0) return true
        if (count > 0) return true
        return false
      }
      return count > 0
    })
    .map((type) => {
      const count = workoutStore.monthlyTypeCounts[type.value] ?? 0
      const goal = goals.value[type.value]
      let percent: number

      if (goal && goal > 0) {
        percent = Math.min(Math.round((count / goal) * 100), 100)
      }
      else {
        percent = Math.round((count / maxCount.value) * 100)
      }

      return {
        value: type.value,
        label: type.label,
        icon: type.icon,
        count,
        goal: goal && goal > 0 ? goal : null,
        percent,
        color: COLORS[type.value] ?? '#6b7280',
      }
    })
    .sort((a, b) => b.count - a.count)
})
</script>
