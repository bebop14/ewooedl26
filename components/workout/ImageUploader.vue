<template>
  <div
    class="relative border-2 border-dashed rounded-lg transition-colors cursor-pointer"
    :class="isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-600'"
    @click="openFileDialog"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <!-- 미리보기 -->
    <div v-if="previewUrl" class="relative">
      <img :src="previewUrl" alt="미리보기" class="w-full h-64 object-cover rounded-lg" />
      <UButton
        icon="i-lucide-x"
        color="error"
        variant="solid"
        size="xs"
        class="absolute top-2 right-2"
        @click.stop="handleRemove"
      />
    </div>

    <!-- 빈 상태 -->
    <div v-else class="flex flex-col items-center justify-center py-12 px-4">
      <UIcon name="i-lucide-image-plus" class="text-4xl text-gray-400 mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">이미지를 드래그하거나 클릭하세요</p>
      <p class="text-xs text-gray-400 mt-1">JPG, PNG (최대 10MB)</p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'update:modelValue': [file: File | null]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const previewUrl = ref<string | null>(null)

function openFileDialog() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

function processFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    alert('이미지 크기는 10MB 이하여야 합니다.')
    return
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  emit('update:modelValue', file)
}

function handleRemove() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  if (fileInput.value) fileInput.value.value = ''
  emit('update:modelValue', null)
}
</script>
