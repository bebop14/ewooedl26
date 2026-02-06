<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="font-semibold">새 일정 등록</h3>
    </template>

    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- 제목 -->
        <UFormField label="제목 *">
          <UInput v-model="form.title" placeholder="일정 제목" class="w-full" />
          <template #error>
            <span v-if="errors.title">{{ errors.title }}</span>
          </template>
        </UFormField>

        <!-- 유형 -->
        <div>
          <label class="block text-sm font-medium mb-2">유형 *</label>
          <div class="flex gap-2">
            <UButton
              v-for="t in EVENT_TYPES"
              :key="t.value"
              :icon="t.icon"
              :label="t.label"
              :variant="form.type === t.value ? 'solid' : 'outline'"
              :color="t.color"
              size="sm"
              type="button"
              @click="form.type = t.value"
            />
          </div>
          <p v-if="errors.type" class="text-sm text-red-500 mt-1">{{ errors.type }}</p>
        </div>

        <!-- 시작 날짜/시간 -->
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="날짜 *">
            <UInput v-model="form.date" type="date" class="w-full" />
            <template #error>
              <span v-if="errors.date">{{ errors.date }}</span>
            </template>
          </UFormField>
          <UFormField label="시간 *">
            <UInput v-model="form.time" type="time" class="w-full" />
            <template #error>
              <span v-if="errors.time">{{ errors.time }}</span>
            </template>
          </UFormField>
        </div>

        <!-- 종료 날짜/시간 -->
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="종료 날짜">
            <UInput v-model="form.endDate" type="date" class="w-full" />
          </UFormField>
          <UFormField label="종료 시간">
            <UInput v-model="form.endTime" type="time" class="w-full" />
          </UFormField>
        </div>

        <!-- 장소 -->
        <UFormField label="장소 *">
          <UInput v-model="form.location" placeholder="장소" icon="i-lucide-map-pin" class="w-full" />
          <template #error>
            <span v-if="errors.location">{{ errors.location }}</span>
          </template>
        </UFormField>

        <!-- 설명 -->
        <UFormField label="설명">
          <UTextarea
            v-model="form.description"
            placeholder="일정에 대한 상세 설명"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- 등록 버튼 -->
        <UButton
          type="submit"
          label="일정 등록"
          icon="i-lucide-check"
          block
          :loading="submitting"
          :disabled="submitting"
        />
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { EVENT_TYPES } from '~/types/event'
import type { EventFormData, EventTypeValue } from '~/types/event'

const isOpen = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  submitting: boolean
  initialDate?: string
}>()

const emit = defineEmits<{
  submit: [data: EventFormData]
}>()

const today = new Date().toISOString().split('T')[0]!

const form = reactive({
  title: '',
  type: '' as EventTypeValue | '',
  date: props.initialDate || today,
  time: '09:00',
  endDate: '',
  endTime: '',
  location: '',
  description: '',
})

watch(() => props.initialDate, (val) => {
  if (val) form.date = val
})

const errors = reactive({
  title: '',
  type: '',
  date: '',
  time: '',
  location: '',
})

function validate(): boolean {
  errors.title = ''
  errors.type = ''
  errors.date = ''
  errors.time = ''
  errors.location = ''

  if (!form.title.trim()) errors.title = '제목을 입력해주세요'
  if (!form.type) errors.type = '유형을 선택해주세요'
  if (!form.date) errors.date = '날짜를 선택해주세요'
  if (!form.time) errors.time = '시간을 입력해주세요'
  if (!form.location.trim()) errors.location = '장소를 입력해주세요'

  return !errors.title && !errors.type && !errors.date && !errors.time && !errors.location
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    title: form.title.trim(),
    type: form.type as EventTypeValue,
    date: form.date,
    time: form.time,
    endDate: form.endDate,
    endTime: form.endTime,
    location: form.location.trim(),
    description: form.description.trim(),
  })
}

function resetForm() {
  form.title = ''
  form.type = '' as EventTypeValue | ''
  form.date = props.initialDate || today
  form.time = '09:00'
  form.endDate = ''
  form.endTime = ''
  form.location = ''
  form.description = ''
  errors.title = ''
  errors.type = ''
  errors.date = ''
  errors.time = ''
  errors.location = ''
}

watch(isOpen, (val) => {
  if (!val) resetForm()
})
</script>
