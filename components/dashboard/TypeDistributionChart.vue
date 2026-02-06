<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">운동 종류 분포</h3>
    </template>
    <div class="h-48">
      <Doughnut v-if="loaded && hasData" :data="chartData" :options="chartOptions" />
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
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const workoutStore = useWorkoutStore()
const loaded = ref(false)
const hasData = ref(false)

const chartData = ref({
  labels: [] as string[],
  datasets: [
    {
      data: [] as number[],
      backgroundColor: [] as string[],
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: { boxWidth: 12, padding: 12 },
    },
  },
}

onMounted(async () => {
  const dist = await workoutStore.fetchTypeDistribution()
  hasData.value = dist.counts.length > 0
  chartData.value = {
    labels: dist.labels,
    datasets: [
      {
        data: dist.counts,
        backgroundColor: dist.colors,
      },
    ],
  }
  loaded.value = true
})
</script>
