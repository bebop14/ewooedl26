<template>
  <div>
    <h3 class="font-semibold text-lg mb-3">
      {{ selectedDate ? formatSelectedDate(selectedDate) : '이번 달 일정' }}
      <UBadge
        v-if="displayedEvents.length > 0"
        variant="subtle"
        color="neutral"
        size="xs"
        class="ml-1"
      >
        {{ displayedEvents.length }}건
      </UBadge>
    </h3>

    <div v-if="displayedEvents.length === 0" class="text-center py-8 text-muted text-sm">
      {{ selectedDate ? '이 날 일정이 없어요. 위 + 버튼으로 추가해보세요.' : '이번 달 일정이 없어요. 함께할 운동 일정을 잡아볼까요?' }}
    </div>

    <div v-else class="space-y-3">
      <CalendarEventCard
        v-for="event in displayedEvents"
        :key="event.id"
        :event="event"
        :current-user-id="currentUserId"
        :deleting="deletingId === event.id"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from '~/types/event'

const props = defineProps<{
  events: CalendarEvent[]
  selectedDate: string | null
  currentUserId: string
  deletingId: string | null
}>()

defineEmits<{
  delete: [eventId: string]
}>()

const displayedEvents = computed(() => {
  if (!props.selectedDate) return props.events

  return props.events.filter((e) => {
    const d = e.date.toDate()
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return dateStr === props.selectedDate
  })
})

function formatSelectedDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y!, m! - 1, d)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}
</script>
