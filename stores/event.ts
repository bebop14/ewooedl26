import { defineStore } from 'pinia'
import {
  collection, doc, addDoc, deleteDoc, getDocs,
  query, where, orderBy, Timestamp,
} from 'firebase/firestore'
import type { CalendarEvent, EventFormData, EventFilters } from '~/types/event'

export const useEventStore = defineStore('event', () => {
  const db = useFirestore()
  const user = useCurrentUser()

  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const submitting = ref(false)

  async function fetchMonthEvents(year: number, month: number) {
    if (!db) return

    loading.value = true
    try {
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

      const q = query(
        collection(db, 'events'),
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        where('date', '<=', Timestamp.fromDate(endOfMonth)),
        orderBy('date', 'asc'),
      )

      const snapshot = await getDocs(q)
      events.value = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as CalendarEvent))
    } finally {
      loading.value = false
    }
  }

  async function addEvent(formData: EventFormData) {
    if (!db || !user.value) throw new Error('Not authenticated')

    submitting.value = true
    try {
      const dateTime = new Date(`${formData.date}T${formData.time}:00`)
      let endDateTime: Date | null = null
      if (formData.endDate && formData.endTime) {
        endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`)
      }

      const eventData = {
        title: formData.title,
        type: formData.type,
        date: Timestamp.fromDate(dateTime),
        endDate: endDateTime ? Timestamp.fromDate(endDateTime) : null,
        location: formData.location,
        description: formData.description,
        createdBy: user.value.uid,
        createdByName: user.value.displayName || 'Unknown',
        createdAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, 'events'), eventData)
      events.value.push({ id: docRef.id, ...eventData } as CalendarEvent)
      events.value.sort((a, b) => a.date.toMillis() - b.date.toMillis())
    } finally {
      submitting.value = false
    }
  }

  async function deleteEvent(eventId: string) {
    if (!db) return
    await deleteDoc(doc(db, 'events', eventId))
    events.value = events.value.filter((e) => e.id !== eventId)
  }

  function getEventsForDate(dateStr: string): CalendarEvent[] {
    return events.value.filter((e) => {
      const d = e.date.toDate()
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return key === dateStr
    })
  }

  function getFilteredEvents(filters: EventFilters): CalendarEvent[] {
    if (!filters.type) return events.value
    return events.value.filter((e) => e.type === filters.type)
  }

  return {
    events,
    loading,
    submitting,
    fetchMonthEvents,
    addEvent,
    deleteEvent,
    getEventsForDate,
    getFilteredEvents,
  }
})
