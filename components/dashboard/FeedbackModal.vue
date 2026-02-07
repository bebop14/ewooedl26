<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="font-semibold">의견 보내기</h3>
    </template>

    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="내용" required>
          <UTextarea
            v-model="content"
            placeholder="개선 사항이나 의견을 자유롭게 작성해주세요"
            :rows="8"
            autoresize
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="보내기"
          icon="i-lucide-send"
          block
          :disabled="!content.trim()"
        />
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  submit: [content: string]
}>()

const content = ref('')

function handleSubmit() {
  if (!content.value.trim()) return
  emit('submit', content.value.trim())
  isOpen.value = false
  content.value = ''
}

watch(isOpen, (val) => {
  if (val) {
    content.value = ''
  }
})
</script>
