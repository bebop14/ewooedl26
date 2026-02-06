<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">이번 주 운동</h3>
    </template>
    <div class="h-48">
      <Bar v-if="loaded && hasData" :data="chartData" :options="chartOptions" />
      <div v-else-if="!loaded" class="h-full flex items-center justify-center">
        <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin text-gray-400" />
      </div>
      <div v-else class="h-full flex items-center justify-center">
        <p class="text-sm text-gray-400">이번 주 운동 기록이 없습니다</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const workoutStore = useWorkoutStore()
const loaded = ref(false)
const hasData = ref(false)

const chartData = ref({
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  datasets: [] as { label: string; data: number[]; backgroundColor: string }[],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { boxWidth: 12, padding: 8, font: { size: 11 } },
    },
  },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

onMounted(async () => {
  const stats = await workoutStore.fetchWeeklyTypeStats()
  hasData.value = stats.datasets.length > 0
  chartData.value = {
    labels: stats.labels,
    datasets: stats.datasets.map((ds) => ({
      ...ds,
      borderRadius: 4,
    })),
  }
  loaded.value = true
})
</script>
