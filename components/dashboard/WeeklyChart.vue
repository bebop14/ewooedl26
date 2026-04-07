<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">이번 주 운동</h3>
    </template>
    <div class="h-44 md:h-56" role="img" aria-label="이번 주 운동 차트">
      <Bar v-if="loaded && hasData" :data="chartData" :options="chartOptions" />
      <div v-else-if="!loaded" class="h-full flex items-center justify-center">
        <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin text-muted" />
      </div>
      <div v-else class="h-full flex flex-col items-center justify-center gap-2">
        <p class="text-sm text-muted">이번 주 아직 기록이 없어요</p>
        <UButton label="오늘 운동 기록하기" to="/workouts/new" size="xs" variant="soft" icon="i-lucide-plus" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { WeeklyTypeDataset } from '~/types/workout'

const workoutStore = useWorkoutStore()
const loaded = ref(false)
const hasData = ref(false)

const chartData = ref({
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  datasets: [] as { label: string; data: number[]; backgroundColor: string }[],
})

const { tickColor, gridColor, legendColor } = useChartTheme()

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { boxWidth: 12, padding: 8, font: { size: 11 }, color: legendColor.value },
    },
  },
  scales: {
    x: { stacked: true, ticks: { color: tickColor.value }, grid: { color: gridColor.value } },
    y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, color: tickColor.value }, grid: { color: gridColor.value } },
  },
}))

onMounted(async () => {
  const stats = await workoutStore.fetchWeeklyTypeStats()
  hasData.value = stats.datasets.length > 0
  chartData.value = {
    labels: stats.labels,
    datasets: stats.datasets.map((ds: WeeklyTypeDataset) => ({
      ...ds,
      borderRadius: 4,
    })),
  }
  loaded.value = true
})
</script>
