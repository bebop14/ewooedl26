<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">갤러리</h1>

    <GalleryFilter v-model="selectedType" class="mb-6" />

    <UEmpty
      v-if="!socialStore.galleryLoading && socialStore.galleryWorkouts.length === 0"
      icon="i-lucide-image"
      title="아직 게시물이 없습니다"
      description="첫 번째 운동을 기록해보세요!"
    />

    <GalleryGrid
      v-else
      :workouts="socialStore.galleryWorkouts"
      :loading="socialStore.galleryLoading"
      :has-more="socialStore.galleryHasMore"
      @load-more="loadMore"
    />
  </UContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const socialStore = useSocialStore()
const selectedType = ref<string | null>(null)

watch(selectedType, () => {
  socialStore.resetGallery()
  socialStore.fetchGalleryPage(12, { workoutType: selectedType.value })
})

function loadMore() {
  if (socialStore.galleryHasMore && !socialStore.galleryLoading) {
    socialStore.fetchGalleryPage(12, { workoutType: selectedType.value })
  }
}

onMounted(() => {
  socialStore.resetGallery()
  socialStore.fetchGalleryPage(12)
})
</script>
