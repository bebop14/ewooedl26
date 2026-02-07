<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="font-semibold">월별 운동 목표 설정 ({{ yearMonth }})</h3>
    </template>

    <template #body>
      <form class="space-y-3" @submit.prevent="handleSave">
        <div v-for="type in WORKOUT_TYPES" :key="type.value" class="flex items-center gap-3">
          <UIcon :name="type.icon" class="text-xl shrink-0" />
          <span class="text-sm font-medium w-32 truncate">{{ type.label }}</span>
          <UInput
            v-model.number="form[type.value]"
            type="number"
            :min="0"
            placeholder="0"
            class="w-24"
          />
          <span class="text-sm text-muted">회</span>
        </div>

        <UButton
          type="submit"
          label="저장"
          icon="i-lucide-check"
          block
        />
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { WORKOUT_TYPES } from '~/types/workout'
import type { WorkoutTypeValue } from '~/types/workout'

const isOpen = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  currentGoals: Record<string, number>
}>()

const emit = defineEmits<{
  save: [goals: Record<string, number>]
}>()

const now = new Date()
const yearMonth = `${now.getFullYear()}년 ${now.getMonth() + 1}월`

const form = reactive<Record<WorkoutTypeValue, number | undefined>>(
  {} as Record<WorkoutTypeValue, number | undefined>,
)

function initForm() {
  for (const type of WORKOUT_TYPES) {
    form[type.value] = props.currentGoals[type.value] || undefined
  }
}

function handleSave() {
  const goals: Record<string, number> = {}
  for (const type of WORKOUT_TYPES) {
    const val = form[type.value]
    if (val && val > 0) {
      goals[type.value] = val
    }
  }
  emit('save', goals)
  isOpen.value = false
}

watch(isOpen, (val) => {
  if (val) {
    initForm()
  }
})
</script>
