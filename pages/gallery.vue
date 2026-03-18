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
    const prevCount = socialStore.galleryWorkouts.length
    await socialStore.fetchGalleryPage(12, getFilters())
    // 새로 로드된 워크아웃의 좋아요 데이터 로드
    const newWorkouts = socialStore.galleryWorkouts.slice(prevCount)
    if (newWorkouts.length > 0) {
      await socialStore.loadUserLikesForWorkouts(newWorkouts.map(w => w.id))
    }
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
  await socialStore.fetchGalleryPage(12, getFilters())
  // 갤러리 카드 인라인 좋아요를 위해 사용자 좋아요 데이터 로드
  if (socialStore.galleryWorkouts.length > 0) {
    await socialStore.loadUserLikesForWorkouts(socialStore.galleryWorkouts.map(w => w.id))
  }
  initialized.value = true
})
</script>
