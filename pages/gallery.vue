<template>
  <UContainer class="py-8">
    <UEmpty
      icon="i-lucide-image"
      title="갤러리"
      description="모든 사용자의 오운완 인증샷을 확인하세요. 개발 예정입니다."
    />
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
// Phase 4에서 구현
</script>
