import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CaravanEvent, CaravanEventStatus } from '@/types'

interface CaravanEventsState {
  events: CaravanEvent[]

  // Actions
  addEvent: (event: Omit<CaravanEvent, 'id' | 'createdAt'>) => CaravanEvent
  updateEvent: (id: string, updates: Partial<CaravanEvent>) => void
  deleteEvent: (id: string) => void
  updateStatus: (id: string, status: CaravanEventStatus) => void
  getEvent: (id: string) => CaravanEvent | undefined
  getUpcomingEvents: () => CaravanEvent[]
  getEventsByStatus: (status: CaravanEventStatus) => CaravanEvent[]
  getEventsByYear: (year: number) => CaravanEvent[]
}

// Generate unique ID
const generateId = () => `caravan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useCaravanEventsStore = create<CaravanEventsState>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (eventData) => {
        const newEvent: CaravanEvent = {
          ...eventData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          events: [...state.events, newEvent],
        }))
        return newEvent
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, ...updates, updatedAt: new Date().toISOString() }
              : event
          ),
        }))
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }))
      },

      updateStatus: (id, status) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, status, updatedAt: new Date().toISOString() }
              : event
          ),
        }))
      },

      getEvent: (id) => {
        return get().events.find((event) => event.id === id)
      },

      getUpcomingEvents: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return get().events
          .filter((event) => {
            if (event.dates.length === 0) return false
            const eventDate = new Date(event.dates[0])
            return eventDate >= today &&
                   !['completed', 'denied', 'cancelled_by_us', 'cancelled_by_organizer'].includes(event.status)
          })
          .sort((a, b) => {
            const dateA = a.dates[0] ? new Date(a.dates[0]).getTime() : 0
            const dateB = b.dates[0] ? new Date(b.dates[0]).getTime() : 0
            return dateA - dateB
          })
      },

      getEventsByStatus: (status) => {
        return get().events.filter((event) => event.status === status)
      },

      getEventsByYear: (year) => {
        return get().events.filter((event) => event.year === year)
      },
    }),
    {
      name: 'taquero-caravan-events',
    }
  )
)

// Status display helpers
export const STATUS_LABELS: Record<CaravanEventStatus, string> = {
  discovered: 'Discovered',
  interested: 'Interested',
  applied: 'Applied',
  accepted: 'Accepted',
  paid: 'Paid',
  confirmed: 'Confirmed',
  active: 'Active',
  completed: 'Completed',
  denied: 'Denied',
  cancelled_by_us: 'Cancelled (Us)',
  cancelled_by_organizer: 'Cancelled (Organizer)',
  postponed: 'Postponed',
}

export const STATUS_COLORS: Record<CaravanEventStatus, string> = {
  discovered: 'bg-gray-500',
  interested: 'bg-blue-400',
  applied: 'bg-yellow-500',
  accepted: 'bg-lime-500',
  paid: 'bg-emerald-500',
  confirmed: 'bg-green-600',
  active: 'bg-purple-500',
  completed: 'bg-green-700',
  denied: 'bg-red-500',
  cancelled_by_us: 'bg-red-400',
  cancelled_by_organizer: 'bg-red-600',
  postponed: 'bg-amber-500',
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  festival: 'Festival',
  recurrent: 'Recurrent Event',
  private: 'Private Event',
}

export const EVENT_TYPE_EMOJIS: Record<string, string> = {
  festival: '🎉',
  recurrent: '🔄',
  private: '🎊',
}
