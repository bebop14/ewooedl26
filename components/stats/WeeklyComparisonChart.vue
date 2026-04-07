<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">이번 주 vs 지난 주</h3>
    </template>
    <div class="h-52 md:h-64" role="img" aria-label="이번 주 vs 지난 주 운동 비교 차트">
      <Bar v-if="loaded && hasData" :data="chartData" :options="chartOptions" />
      <div v-else-if="!loaded" class="h-full flex items-center justify-center">
        <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin text-muted" />
      </div>
      <div v-else class="h-full flex items-center justify-center">
        <p class="text-sm text-muted">운동 기록이 없습니다</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'

const workoutStore = useWorkoutStore()
const loaded = ref(false)
const hasData = ref(false)

const chartData = ref({
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  datasets: [
    {
      label: '이번 주',
      data: [] as number[],
      backgroundColor: '',
      borderRadius: 4,
    },
    {
      label: '지난 주',
      data: [] as number[],
      backgroundColor: '',
      borderRadius: 4,
    },
  ],
})

const { tickColor, gridColor, legendColor, primaryColor, mutedBarColor } = useChartTheme()

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
    x: {
      ticks: { color: tickColor.value },
      grid: { color: gridColor.value },
    },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, color: tickColor.value },
      grid: { color: gridColor.value },
    },
  },
}))

onMounted(async () => {
  const comparison = await workoutStore.fetchWeeklyComparison()
  hasData.value = comparison.thisWeek.some(c => c > 0) || comparison.lastWeek.some(c => c > 0)
  chartData.value = {
    labels: comparison.labels,
    datasets: [
      {
        label: '이번 주',
        data: comparison.thisWeek,
        backgroundColor: primaryColor.value,
        borderRadius: 4,
      },
      {
        label: '지난 주',
        data: comparison.lastWeek,
        backgroundColor: mutedBarColor.value,
        borderRadius: 4,
      },
    ],
  }
  loaded.value = true
})

watch([primaryColor, mutedBarColor], ([primary, muted]) => {
  if (!chartData.value.datasets[0] || !chartData.value.datasets[1]) return
  chartData.value.datasets[0].backgroundColor = primary
  chartData.value.datasets[1].backgroundColor = muted
})
</script>
