<template>
  <UContainer class="py-8">
    <h1 class="text-2xl font-bold mb-6">캘린더</h1>

    <!-- 헤더: 월 네비게이션 + 필터 + 추가 버튼 -->
    <CalendarHeader
      :year="currentYear"
      :month="currentMonth"
      v-model="filterType"
      class="mb-4"
      @prev-month="goToPrevMonth"
      @next-month="goToNextMonth"
      @create="openCreateModal"
    />

    <!-- 로딩 -->
    <div v-if="eventStore.loading" class="text-center py-12">
      <UIcon name="i-lucide-loader-circle" class="text-3xl animate-spin" />
    </div>

    <template v-else>
      <!-- 캘린더 그리드 -->
      <CalendarGrid
        :year="currentYear"
        :month="currentMonth"
        :events="eventStore.events"
        :selected-date="selectedDate"
        :filter-type="filterType"
        class="mb-8"
        @select-date="handleSelectDate"
      />

      <!-- 이벤트 목록 -->
      <CalendarEventList
        :events="filteredEvents"
        :selected-date="selectedDate"
        :current-user-id="user?.uid ?? ''"
        :deleting-id="deletingId"
        @delete="handleDelete"
      />
    </template>

    <!-- 일정 등록 모달 -->
    <CalendarEventFormModal
      v-model:open="showCreateModal"
      :submitting="eventStore.submitting"
      :initial-date="selectedDate ?? undefined"
      @submit="handleCreateEvent"
    />
  </UContainer>
</template>

<script setup lang="ts">
import type { EventFormData, EventTypeValue } from '~/types/event'

definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
const eventStore = useEventStore()

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const selectedDate = ref<string | null>(null)
const filterType = ref<EventTypeValue | null>(null)

const showCreateModal = ref(false)
const deletingId = ref<string | null>(null)

const filteredEvents = computed(() => {
  return eventStore.getFilteredEvents({ type: filterType.value })
})

function goToPrevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  selectedDate.value = null
  fetchEvents()
}

function goToNextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  selectedDate.value = null
  fetchEvents()
}

function handleSelectDate(dateStr: string) {
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}

function openCreateModal() {
  showCreateModal.value = true
}

async function handleCreateEvent(formData: EventFormData) {
  try {
    await eventStore.addEvent(formData)
    showCreateModal.value = false
  } catch (err) {
    console.error('Event creation error:', err)
  }
}

async function handleDelete(eventId: string) {
  deletingId.value = eventId
  try {
    await eventStore.deleteEvent(eventId)
  } finally {
    deletingId.value = null
  }
}

function fetchEvents() {
  eventStore.fetchMonthEvents(currentYear.value, currentMonth.value)
}

onMounted(() => {
  fetchEvents()
})
</script>
