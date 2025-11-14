import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BatchCheck } from '@/types'

interface BatchCheckState {
  // State
  batchChecks: BatchCheck[]

  // Actions
  addBatchCheck: (check: BatchCheck) => void
  getBatchChecks: () => BatchCheck[]
  getTodayChecks: () => BatchCheck[]
  deleteBatchCheck: (id: string) => void
  clearAll: () => void
}

export const useBatchCheckStore = create<BatchCheckState>()(
  persist(
    (set, get) => ({
      // Initial state
      batchChecks: [],

      // Add a new batch check
      addBatchCheck: (check: BatchCheck) => {
        set((state) => ({
          batchChecks: [check, ...state.batchChecks],
        }))
      },

      // Get all batch checks
      getBatchChecks: () => {
        return get().batchChecks
      },

      // Get today's batch checks
      getTodayChecks: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().batchChecks.filter((check) => check.date === today)
      },

      // Delete a batch check by ID
      deleteBatchCheck: (id: string) => {
        set((state) => ({
          batchChecks: state.batchChecks.filter((check) => check.id !== id),
        }))
      },

      // Clear all batch checks (for testing/reset)
      clearAll: () => {
        set({ batchChecks: [] })
      },
    }),
    {
      name: 'taquero-batch-checks',
    }
  )
)
