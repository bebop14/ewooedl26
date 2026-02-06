<template>
  <UButton
    :icon="isLiked ? 'i-lucide-heart' : 'i-lucide-heart'"
    :variant="isLiked ? 'soft' : 'ghost'"
    :color="isLiked ? 'error' : 'neutral'"
    :label="String(localCount)"
    :loading="toggling"
    @click.prevent="handleToggle"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  workoutId: string
  likeCount: number
}>()

const emit = defineEmits<{
  toggled: [delta: number]
}>()

const socialStore = useSocialStore()

const toggling = ref(false)
const localCount = ref(props.likeCount)

const isLiked = computed(() => socialStore.userLikes.has(props.workoutId))

watch(() => props.likeCount, (val) => {
  localCount.value = val
})

async function handleToggle() {
  if (toggling.value) return
  toggling.value = true
  try {
    const wasLiked = isLiked.value
    await socialStore.toggleLike(props.workoutId)
    const delta = wasLiked ? -1 : 1
    localCount.value += delta
    emit('toggled', delta)
  } finally {
    toggling.value = false
  }
}
</script>
