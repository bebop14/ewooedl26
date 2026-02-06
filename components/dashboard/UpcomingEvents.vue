<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-calendar" class="text-lg" />
          다가오는 일정
        </h3>
        <UButton label="전체 보기" variant="link" size="xs" to="/calendar" />
      </div>
    </template>

    <div v-if="events.length === 0" class="text-center py-4 text-gray-500 text-sm">
      예정된 일정이 없습니다.
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="event in events"
        :key="event.id"
        to="/calendar"
        class="flex items-start gap-3 group"
      >
        <!-- 날짜 박스 -->
        <div
          class="flex-shrink-0 w-11 text-center rounded-lg py-1"
          :class="event.type === 'event'
            ? 'bg-blue-100 dark:bg-blue-900'
            : 'bg-green-100 dark:bg-green-900'"
        >
          <p class="text-[0.65rem] font-medium text-gray-500">{{ formatMonth(event) }}</p>
          <p class="text-lg font-bold leading-tight">{{ formatDay(event) }}</p>
        </div>

        <!-- 내용 -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm group-hover:text-blue-500 transition-colors truncate">
            {{ event.title }}
          </p>
          <div class="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span class="flex items-center gap-0.5">
              <UIcon name="i-lucide-clock" class="text-[0.65rem]" />
              {{ formatTime(event) }}
            </span>
            <span v-if="event.location" class="flex items-center gap-0.5 truncate">
              <UIcon name="i-lucide-map-pin" class="text-[0.65rem]" />
              {{ event.location }}
            </span>
          </div>
        </div>

        <!-- 타입 배지 -->
        <UBadge
          :color="event.type === 'event' ? 'info' : 'success'"
          variant="subtle"
          size="xs"
          class="flex-shrink-0"
        >
          {{ event.type === 'event' ? '행사' : '연습' }}
        </UBadge>
      </NuxtLink>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Timestamp } from 'firebase/firestore'
import type { CalendarEvent } from '~/types/event'

defineProps<{
  events: CalendarEvent[]
}>()

function toDate(event: CalendarEvent): Date {
  return event.date instanceof Timestamp ? event.date.toDate() : new Date(event.date as unknown as string)
}

function formatMonth(event: CalendarEvent): string {
  return toDate(event).toLocaleDateString('ko-KR', { month: 'short' })
}

function formatDay(event: CalendarEvent): string {
  return String(toDate(event).getDate())
}

function formatTime(event: CalendarEvent): string {
  return toDate(event).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}
</script>
