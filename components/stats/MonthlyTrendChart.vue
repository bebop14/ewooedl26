<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">최근 6개월 운동 추이</h3>
    </template>
    <div class="h-64">
      <Line v-if="loaded && hasData" :data="chartData" :options="chartOptions" />
      <div v-else-if="!loaded" class="h-full flex items-center justify-center">
        <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin text-gray-400" />
      </div>
      <div v-else class="h-full flex items-center justify-center">
        <p class="text-sm text-gray-400">운동 기록이 없습니다</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const workoutStore = useWorkoutStore()
const loaded = ref(false)
const hasData = ref(false)

const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      label: '운동 횟수',
      data: [] as number[],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 },
    },
  },
}

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
</script>
