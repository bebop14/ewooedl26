<template>
  <UContainer class="py-8">
    <UCard class="mb-6">
      <div class="flex items-center gap-4">
        <UAvatar :src="user?.photoURL || undefined" :alt="user?.displayName || '사용자'" size="lg" />
        <div>
          <h2 class="text-2xl font-semibold">환영합니다, {{ user?.displayName }}님!</h2>
          <p class="text-sm text-muted">오늘도 화이팅!</p>
        </div>
      </div>
    </UCard>

    <!-- 오늘의 운동 통계 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <UCard>
        <div class="text-center">
          <UIcon name="i-lucide-flame" class="text-2xl text-blue-500 mb-2" />
          <p class="text-sm text-muted mb-1">오늘의 운동</p>
          <p class="text-3xl font-bold text-blue-600">0회</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <UIcon name="i-lucide-zap" class="text-2xl text-green-500 mb-2" />
          <p class="text-sm text-muted mb-1">연속 운동</p>
          <p class="text-3xl font-bold text-green-600">0일</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <UIcon name="i-lucide-clock" class="text-2xl text-purple-500 mb-2" />
          <p class="text-sm text-muted mb-1">총 운동 시간</p>
          <p class="text-3xl font-bold text-purple-600">0분</p>
        </div>
      </UCard>
    </div>

    <!-- 액션 버튼 -->
    <div class="text-center">
      <UButton label="오늘의 운동 기록하기" icon="i-lucide-plus" size="lg" />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
</script>
