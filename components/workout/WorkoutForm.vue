<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- 운동 종류 선택 -->
    <div>
      <label class="block text-sm font-medium mb-3">운동 종류 *</label>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="type in WORKOUT_TYPES"
          :key="type.value"
          type="button"
          class="flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors"
          :class="form.workoutType === type.value
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'"
          @click="form.workoutType = type.value"
        >
          <UIcon :name="type.icon" class="text-xl" />
          <span class="text-xs">{{ type.label }}</span>
        </button>
      </div>
      <p v-if="errors.workoutType" class="text-sm text-red-500 mt-1">{{ errors.workoutType }}</p>
    </div>

    <!-- 운동 날짜 -->
    <UFormField label="운동 날짜 *">
      <UInput
        v-model="form.date"
        type="date"
        class="w-full"
      />
      <template #error>
        <span v-if="errors.date">{{ errors.date }}</span>
      </template>
    </UFormField>

    <!-- 인증샷 -->
    <div>
      <label class="block text-sm font-medium mb-2">인증샷 *</label>
      <WorkoutImageUploader v-model="form.imageFile" />
      <p v-if="errors.imageFile" class="text-sm text-red-500 mt-1">{{ errors.imageFile }}</p>
    </div>

    <!-- 메모 -->
    <UFormField label="메모 (선택)">
      <UTextarea
        v-model="form.memo"
        placeholder="오늘의 운동 소감을 남겨보세요"
        :rows="6"
        class="w-full"
      />
    </UFormField>

    <!-- 해시태그 -->
    <div>
      <label class="block text-sm font-medium mb-2">해시태그 (선택)</label>
      <div class="flex flex-wrap gap-2 mb-2">
        <UBadge
          v-for="(tag, idx) in form.hashtags"
          :key="idx"
          color="info"
          variant="subtle"
          class="cursor-pointer"
          @click="removeTag(idx)"
        >
          #{{ tag }} &times;
        </UBadge>
      </div>
      <UInput
        v-model="tagInput"
        placeholder="태그 입력 후 엔터"
        @keydown.enter.prevent="addTag"
      />
    </div>

    <!-- 제출 -->
    <UButton
      type="submit"
      label="운동 기록 완료!"
      icon="i-lucide-check"
      size="lg"
      block
      :loading="submitting"
      :disabled="submitting"
    />
  </form>
</template>

<script setup lang="ts">
import { WORKOUT_TYPES } from '~/types/workout'
import type { WorkoutFormData, WorkoutTypeValue } from '~/types/workout'

defineProps<{
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [data: WorkoutFormData]
}>()

const tagInput = ref('')

const today = new Date().toISOString().split('T')[0]!

const form = reactive({
  workoutType: '' as WorkoutTypeValue | '',
  date: today,
  imageFile: null as File | null,
  memo: '',
  hashtags: [] as string[],
})

const errors = reactive({
  workoutType: '',
  date: '',
  imageFile: '',
})

function addTag() {
  const tag = tagInput.value.trim().replace(/^#/, '')
  if (tag && !form.hashtags.includes(tag)) {
    form.hashtags.push(tag)
  }
  tagInput.value = ''
}

function removeTag(idx: number) {
  form.hashtags.splice(idx, 1)
}

function validate(): boolean {
  errors.workoutType = ''
  errors.date = ''
  errors.imageFile = ''

  if (!form.workoutType) errors.workoutType = '운동 종류를 선택해주세요'
  if (!form.date) errors.date = '운동 날짜를 선택해주세요'
  if (!form.imageFile) errors.imageFile = '인증샷을 첨부해주세요'

  return !errors.workoutType && !errors.date && !errors.imageFile
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    workoutType: form.workoutType as WorkoutTypeValue,
    date: form.date,
    imageFile: form.imageFile,
    memo: form.memo,
    hashtags: form.hashtags,
  })
}
</script>
