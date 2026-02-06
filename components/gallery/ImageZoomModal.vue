<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="flex items-center justify-center p-2">
        <img :src="imageUrl" class="max-h-[85vh] max-w-full object-contain rounded-lg" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false })

defineProps<{
  imageUrl: string
}>()
</script>
