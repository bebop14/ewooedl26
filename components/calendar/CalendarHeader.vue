<template>
  <div class="flex flex-col gap-4">
    <!-- 월 네비게이션 -->
    <div class="flex items-center justify-between">
      <UButton
        icon="i-lucide-chevron-left"
        variant="ghost"
        @click="$emit('prevMonth')"
      />
      <h2 class="text-xl font-bold">
        {{ year }}년 {{ month + 1 }}월
      </h2>
      <UButton
        icon="i-lucide-chevron-right"
        variant="ghost"
        @click="$emit('nextMonth')"
      />
    </div>

    <!-- 필터 + 추가 버튼 -->
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <UButton
          label="전체"
          :variant="modelValue === null ? 'solid' : 'outline'"
          size="sm"
          @click="$emit('update:modelValue', null)"
        />
        <UButton
          v-for="t in EVENT_TYPES"
          :key="t.value"
          :label="t.label"
          :icon="t.icon"
          :variant="modelValue === t.value ? 'solid' : 'outline'"
          :color="t.color"
          size="sm"
          @click="$emit('update:modelValue', t.value)"
        />
      </div>
      <UButton
        label="일정 추가"
        icon="i-lucide-plus"
        size="sm"
        @click="$emit('create')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EventTypeValue } from '~/types/event'
import { EVENT_TYPES } from '~/types/event'

defineProps<{
  year: number
  month: number
  modelValue: EventTypeValue | null
}>()

defineEmits<{
  prevMonth: []
  nextMonth: []
  create: []
  'update:modelValue': [value: EventTypeValue | null]
}>()
</script>
