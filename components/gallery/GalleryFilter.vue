<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      label="전체"
      :variant="modelValue === null ? 'solid' : 'outline'"
      size="sm"
      @click="$emit('update:modelValue', null)"
    />
    <UButton
      v-for="type in WORKOUT_TYPES"
      :key="type.value"
      :icon="type.icon"
      :label="type.label"
      :variant="modelValue === type.value ? 'solid' : 'outline'"
      size="sm"
      @click="$emit('update:modelValue', type.value)"
    />
  </div>
</template>

<script setup lang="ts">
import { WORKOUT_TYPES } from '~/types/workout'

defineProps<{
  modelValue: string | null
}>()

defineEmits<{
  'update:modelValue': [value: string | null]
}>()
</script>
