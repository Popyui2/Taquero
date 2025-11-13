import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTodayString } from '@/lib/utils'

interface CompletionState {
  taskCompletions: Record<string, string[]>
  userSubmissions: Record<string, Record<string, string[]>>
  markTaskCompleted: (taskId: string) => void
  getWhoSubmittedToday: (taskId: string) => string | null
  recordUserSubmission: (taskId: string, userName: string) => void
  isTaskCompletedToday: (taskId: string) => boolean
}

export const useAppStore = create<CompletionState>()(
  persist(
    (set, get) => ({
      taskCompletions: {},
      userSubmissions: {},

      markTaskCompleted: (taskId: string) => {
        const today = getTodayString()
        set((state) => {
          const newCompletions = { ...state.taskCompletions }
          if (!newCompletions[today]) {
            newCompletions[today] = []
          }
          if (!newCompletions[today].includes(taskId)) {
            newCompletions[today].push(taskId)
          }
          return { taskCompletions: newCompletions }
        })
      },

      getWhoSubmittedToday: (taskId: string) => {
        const today = getTodayString()
        const { userSubmissions } = get()

        if (userSubmissions[taskId]?.[today]) {
          const submitters = userSubmissions[taskId][today]
          return submitters.length > 0 ? submitters.join(', ') : null
        }
        return null
      },

      recordUserSubmission: (taskId: string, userName: string) => {
        const today = getTodayString()
        set((state) => {
          const newSubmissions = { ...state.userSubmissions }
          if (!newSubmissions[taskId]) {
            newSubmissions[taskId] = {}
          }
          if (!newSubmissions[taskId][today]) {
            newSubmissions[taskId][today] = []
          }
          if (!newSubmissions[taskId][today].includes(userName)) {
            newSubmissions[taskId][today].push(userName)
          }
          return { userSubmissions: newSubmissions }
        })
      },

      isTaskCompletedToday: (taskId: string) => {
        const today = getTodayString()
        const { taskCompletions } = get()
        return taskCompletions[today]?.includes(taskId) ?? false
      },
    }),
    {
      name: 'taquero-app',
    }
  )
)
