<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">순위 차트</h3>
    </template>
    <div class="h-52 md:h-72" role="img" :aria-label="`순위 차트: ${metricLabel[sortBy]}`">
      <Bar v-if="hasData" :data="chartData" :options="chartOptions" />
      <div v-else class="h-full flex items-center justify-center">
        <p class="text-sm text-muted">순위 데이터가 없습니다</p>
      </div>
    </div>
    <table v-if="hasData" class="sr-only">
      <caption>{{ metricLabel[sortBy] }} 순위</caption>
      <thead><tr><th>이름</th><th>{{ metricLabel[sortBy] }}</th></tr></thead>
      <tbody>
        <tr v-for="u in top10" :key="u.userId">
          <td>{{ u.displayName }}</td>
          <td>{{ u[sortBy] ?? 0 }}</td>
        </tr>
      </tbody>
    </table>
  </UCard>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { RankedUser } from '~/types/social'

const props = defineProps<{
  users: RankedUser[]
  sortBy: 'totalWorkouts' | 'currentStreak' | 'longestStreak'
}>()

const metricLabel: Record<string, string> = {
  totalWorkouts: '운동 횟수',
  currentStreak: '연속 운동 (일)',
  longestStreak: '최장 연속 (일)',
}

function getBarColor(index: number): string {
  return rankBarColor(index)
}

const top10 = computed(() => {
  return [...props.users]
    .sort((a, b) => (b[props.sortBy] ?? 0) - (a[props.sortBy] ?? 0))
    .slice(0, 10)
    .reverse()
})

const hasData = computed(() => top10.value.length > 0)

const chartData = computed(() => ({
  labels: top10.value.map((u) => u.displayName),
  datasets: [
    {
      label: metricLabel[props.sortBy] ?? props.sortBy,
      data: top10.value.map((u) => u[props.sortBy] ?? 0),
      backgroundColor: top10.value.map((_, i) => getBarColor(top10.value.length - 1 - i)),
      borderRadius: 4,
    },
  ],
}))

const { tickColor, gridColor, rankBarColor } = useChartTheme()

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 0, color: tickColor.value },
      grid: { color: gridColor.value },
    },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, color: tickColor.value },
      grid: { color: gridColor.value },
    },
  },
}))
</script>
