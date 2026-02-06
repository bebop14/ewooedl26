<template>
  <div>
    <!-- 요일 헤더 -->
    <div class="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
      <div v-for="day in weekDays" :key="day">{{ day }}</div>
    </div>

    <!-- 캘린더 그리드 -->
    <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
      <button
        v-for="(cell, idx) in calendarCells"
        :key="idx"
        class="bg-white dark:bg-gray-900 p-1 min-h-20 md:min-h-24 flex flex-col items-stretch gap-0.5 transition-colors text-sm"
        :class="cellClasses(cell)"
        :disabled="!cell.isCurrentMonth"
        @click="cell.isCurrentMonth && $emit('selectDate', cell.dateStr)"
      >
        <span
          class="leading-none text-center mb-0.5"
          :class="{
            'font-bold text-blue-600 dark:text-blue-400': cell.isToday,
            'text-gray-300 dark:text-gray-600': !cell.isCurrentMonth,
          }"
        >
          {{ cell.day }}
        </span>
        <!-- 일정 제목 목록 -->
        <div v-if="cell.isCurrentMonth && cell.events.length > 0" class="flex flex-col gap-px overflow-hidden">
          <div
            v-for="(ev, i) in cell.events.slice(0, 2)"
            :key="i"
            class="text-[0.6rem] md:text-xs leading-tight px-1 py-px rounded truncate text-left"
            :class="ev.type === 'event'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'"
          >
            {{ ev.title }}
          </div>
          <span
            v-if="cell.events.length > 2"
            class="text-[0.55rem] text-gray-400 text-center leading-none"
          >
            +{{ cell.events.length - 2 }}건
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent, EventTypeValue } from '~/types/event'

const props = defineProps<{
  year: number
  month: number
  events: CalendarEvent[]
  selectedDate: string | null
  filterType: EventTypeValue | null
}>()

defineEmits<{
  selectDate: [dateStr: string]
}>()

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

interface CellEvent {
  title: string
  type: EventTypeValue
}

interface CalendarCell {
  day: number
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  events: CellEvent[]
}

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const eventsByDate = computed(() => {
  const map = new Map<string, CellEvent[]>()
  const filtered = props.filterType
    ? props.events.filter((e) => e.type === props.filterType)
    : props.events

  for (const ev of filtered) {
    const d = ev.date.toDate()
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({ title: ev.title, type: ev.type })
  }
  return map
})

const calendarCells = computed((): CalendarCell[] => {
  const cells: CalendarCell[] = []
  const firstDay = new Date(props.year, props.month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(props.year, props.month + 1, 0).getDate()
  const daysInPrevMonth = new Date(props.year, props.month, 0).getDate()

  // 이전 달 끝자리
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const prevMonth = props.month === 0 ? 11 : props.month - 1
    const prevYear = props.month === 0 ? props.year - 1 : props.year
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ day, dateStr, isCurrentMonth: false, isToday: false, events: [] })
  }

  // 현재 달
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${props.year}-${String(props.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr.value,
      events: eventsByDate.value.get(dateStr) || [],
    })
  }

  // 다음 달 앞자리 (42셀 채우기)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = props.month === 11 ? 0 : props.month + 1
    const nextYear = props.month === 11 ? props.year + 1 : props.year
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr, isCurrentMonth: false, isToday: false, events: [] })
  }

  return cells
})

function cellClasses(cell: CalendarCell) {
  const classes: string[] = []
  if (cell.isCurrentMonth) {
    classes.push('hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer')
  }
  if (cell.dateStr === props.selectedDate) {
    classes.push('ring-2 ring-inset ring-blue-500')
  }
  return classes
}
</script>
