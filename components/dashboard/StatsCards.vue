<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <UCard>
      <div class="text-center">
        <UIcon name="i-lucide-flame" class="text-2xl text-blue-500 mb-2" />
        <p class="text-sm text-muted mb-1">오늘의 운동</p>
        <p class="text-3xl font-bold text-blue-600">{{ todayCount }}회</p>
      </div>
    </UCard>
    <UCard>
      <div class="text-center">
        <UIcon name="i-lucide-zap" class="text-2xl text-green-500 mb-2" />
        <p class="text-sm text-muted mb-1">연속 운동</p>
        <p class="text-3xl font-bold text-green-600">{{ streak }}일</p>
      </div>
    </UCard>
    <UCard>
      <div class="text-center">
        <UIcon name="i-lucide-trophy" class="text-2xl text-purple-500 mb-2" />
        <p class="text-sm text-muted mb-1">총 운동 횟수</p>
        <p class="text-3xl font-bold text-purple-600">{{ totalWorkouts }}회</p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  todayCount: number
  streak: number
  totalWorkouts: number
}>()
</script>
