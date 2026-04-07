<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">최근 6개월 운동 추이</h3>
    </template>
    <div class="h-52 md:h-72" role="img" aria-label="최근 6개월 운동 추이 차트">
      <Line v-if="loaded && hasData" :data="chartData" :options="chartOptions" />
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
import { Line } from 'vue-chartjs'

const workoutStore = useWorkoutStore()
const loaded = ref(false)
const hasData = ref(false)

const { tickColor, gridColor, primaryColor, primaryFill, pointBorderColor } = useChartTheme()

const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: '운동 횟수',
      data: [] as number[],
      borderColor: primaryColor.value,
      backgroundColor: primaryFill.value,
      fill: true,
      tension: 0.3,
      pointBackgroundColor: primaryColor.value,
      pointBorderColor: pointBorderColor.value,
      pointBorderWidth: 2,
      pointRadius: 5,
    },
  ],
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
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
  const trend = await workoutStore.fetchMonthlyTrend(6)
  hasData.value = trend.counts.some(c => c > 0)
  chartData.value = {
    labels: trend.labels,
    datasets: [
      {
        ...chartData.value.datasets[0]!,
        data: trend.counts,
      },
    ],
  }
  loaded.value = true
})

watch([primaryColor, primaryFill, pointBorderColor], ([primary, fill, border]) => {
  const ds = chartData.value.datasets[0]
  if (!ds) return
  ds.borderColor = primary
  ds.backgroundColor = fill
  ds.pointBackgroundColor = primary
  ds.pointBorderColor = border
})
</script>
