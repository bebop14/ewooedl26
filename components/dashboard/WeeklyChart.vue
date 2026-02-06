<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">이번 주 운동</h3>
    </template>
    <div class="h-48">
      <Bar v-if="loaded" :data="chartData" :options="chartOptions" />
      <div v-else class="h-full flex items-center justify-center">
        <UIcon name="i-lucide-loader-circle" class="text-2xl animate-spin text-gray-400" />
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
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const workoutStore = useWorkoutStore()
const loaded = ref(false)

const chartData = ref({
  labels: ['월', '화', '수', '목', '금', '토', '일'],
  datasets: [
    {
      label: '운동 횟수',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: '#3B82F6',
      borderRadius: 6,
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
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

onMounted(async () => {
  const stats = await workoutStore.fetchWeeklyStats()
  chartData.value = {
    labels: stats.labels,
    datasets: [
      {
        label: '운동 횟수',
        data: stats.counts,
        backgroundColor: '#3B82F6',
        borderRadius: 6,
      },
    ],
  }
  loaded.value = true
})
</script>
