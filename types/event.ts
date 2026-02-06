import type { Timestamp } from 'firebase/firestore'

export const EVENT_TYPES = [
  { value: 'event', label: '행사', icon: 'i-lucide-calendar-check', color: 'info' },
  { value: 'practice', label: '단체 연습', icon: 'i-lucide-users', color: 'success' },
] as const

export type EventTypeValue = typeof EVENT_TYPES[number]['value']

export interface EventDoc {
  title: string
  type: EventTypeValue
  date: Timestamp
  endDate: Timestamp | null
  location: string
  description: string
  createdBy: string
  createdByName: string
  createdAt: Timestamp
}

export interface CalendarEvent extends EventDoc {
  id: string
}

export interface EventFormData {
  title: string
  type: EventTypeValue
  date: string
  time: string
  endDate: string
  endTime: string
  location: string
  description: string
}

export interface EventFilters {
  type: EventTypeValue | null
}
