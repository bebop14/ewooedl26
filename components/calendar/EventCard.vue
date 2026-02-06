<template>
  <UCard>
    <div class="flex items-start gap-3">
      <!-- 타입 배지 -->
      <div class="flex-shrink-0 mt-0.5">
        <UBadge
          :color="event.type === 'event' ? 'info' : 'success'"
          variant="subtle"
          size="xs"
        >
          <UIcon :name="typeIcon" class="text-xs mr-0.5" />
          {{ typeLabel }}
        </UBadge>
      </div>

      <!-- 내용 -->
      <div class="flex-1 min-w-0">
        <h4 class="font-semibold">{{ event.title }}</h4>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-1">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="text-xs" />
            {{ formattedDate }}
          </span>
          <span v-if="event.location" class="flex items-center gap-1">
            <UIcon name="i-lucide-map-pin" class="text-xs" />
            {{ event.location }}
          </span>
        </div>
        <p v-if="event.description" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ event.description }}
        </p>
        <p class="text-xs text-gray-400 mt-2">{{ event.createdByName }}</p>
      </div>

      <!-- 삭제 버튼 (작성자만) -->
      <UButton
        v-if="isOwner"
        icon="i-lucide-trash-2"
        variant="ghost"
        color="error"
        size="xs"
        :loading="deleting"
        @click="$emit('delete', event.id)"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Timestamp } from 'firebase/firestore'
import type { CalendarEvent } from '~/types/event'
import { EVENT_TYPES } from '~/types/event'

const props = defineProps<{
  event: CalendarEvent
  currentUserId: string
  deleting?: boolean
}>()

defineEmits<{
  delete: [eventId: string]
}>()

const typeInfo = computed(() => EVENT_TYPES.find((t) => t.value === props.event.type))
const typeLabel = computed(() => typeInfo.value?.label ?? '행사')
const typeIcon = computed(() => typeInfo.value?.icon ?? 'i-lucide-calendar-check')
const isOwner = computed(() => props.event.createdBy === props.currentUserId)

const formattedDate = computed(() => {
  const d = props.event.date instanceof Timestamp
    ? props.event.date.toDate()
    : new Date(props.event.date as unknown as string)

  const dateStr = d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  let result = `${dateStr} ${timeStr}`

  if (props.event.endDate) {
    const end = props.event.endDate instanceof Timestamp
      ? props.event.endDate.toDate()
      : new Date(props.event.endDate as unknown as string)
    const endTimeStr = end.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    result += ` ~ ${endTimeStr}`
  }

  return result
})
</script>
