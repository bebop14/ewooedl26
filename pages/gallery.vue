<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">인증샷</h1>

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
const groupStore = useGroupStore()
const selectedType = ref<string | null>(null)
const initialized = ref(false)

function getFilters() {
  return {
    workoutType: selectedType.value,
    groupId: groupStore.currentGroupId,
  }
}

function reloadGallery() {
  if (!initialized.value) return
  socialStore.resetGallery()
  socialStore.fetchGalleryPage(12, getFilters())
}

watch(selectedType, reloadGallery)

// 그룹 변경 시 데이터 리로드
watch(() => groupStore.currentGroupId, reloadGallery)

async function loadMore() {
  if (socialStore.galleryHasMore && !socialStore.galleryLoading) {
    // fetchGalleryPage 내부에서 새 워크아웃의 좋아요 데이터까지 로드함
    await socialStore.fetchGalleryPage(12, getFilters())
  }
}

onMounted(async () => {
  // 그룹 데이터가 로드될 때까지 대기 후 갤러리 fetch
  if (groupStore.myGroups.length === 0) {
    await groupStore.fetchMyGroups()
    groupStore.restoreSelectedGroup()
    if (!groupStore.currentGroupId && groupStore.myGroups.length > 0) {
      groupStore.selectGroup(groupStore.myGroups[0]!.id)
    }
  }
  socialStore.resetGallery()
  // fetchGalleryPage 내부에서 좋아요 데이터까지 로드함
  await socialStore.fetchGalleryPage(12, getFilters())
  initialized.value = true
})
</script>
