<template>
  <div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <GalleryCard v-for="w in workouts" :key="w.id" :workout="w" />
    </div>

    <div ref="sentinel" class="h-10 flex items-center justify-center mt-6">
      <UIcon v-if="loading" name="i-lucide-loader-circle" class="text-xl animate-spin" />
      <p v-else-if="!hasMore && workouts.length > 0" class="text-sm text-gray-400">
        모든 게시물을 불러왔습니다
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Workout } from '~/types/workout'

defineProps<{
  workouts: Workout[]
  loading: boolean
  hasMore: boolean
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const sentinel = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!sentinel.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        emit('loadMore')
      }
    },
    { rootMargin: '200px' },
  )

  observer.observe(sentinel.value)

  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>
