import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BatchCheck } from '@/types'

// Google Sheets webhook URL - will need to be updated with your deployment URL
const GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbxgS84Em_zCCa7xWbGaB0YcBEXbG24zZ2LO6D3H8fhJi0OxSYAqescXD99r2CK5bpSy/exec'

interface BatchCheckState {
  // State
  batchChecks: BatchCheck[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  addBatchCheck: (check: BatchCheck) => void
  addLocalRecord: (check: BatchCheck) => void
  getBatchChecks: () => BatchCheck[]
  getTodayChecks: () => BatchCheck[]
  deleteBatchCheck: (id: string) => void
  clearAll: () => void
  setLoading: (loading: boolean) => void
}

export const useBatchCheckStore = create<BatchCheckState>()(
  persist(
    (set, get) => ({
      // Initial state
      batchChecks: [],
      isLoading: false,
      lastFetchTime: null,
      fetchError: null,

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Fetch data from Google Sheets
      fetchFromGoogleSheets: async () => {
        console.log('🔄 fetchFromGoogleSheets called for batch checks')

        set({ isLoading: true, fetchError: null })

        try {
          const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
            method: 'GET',
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          if (result.success && result.data) {
            // Update state with fetched data
            set({
              batchChecks: result.data,
              lastFetchTime: new Date().toISOString(),
              fetchError: null,
            })
            console.log('✅ Batch checks fetched:', result.data.length)
          } else {
            throw new Error(result.error || 'Failed to fetch data')
          }
        } catch (error) {
          console.error('Error fetching from Google Sheets:', error)
          set({
            fetchError: error instanceof Error ? error.message : 'Unknown error',
          })
          // Keep using cached data from localStorage
        } finally {
          set({ isLoading: false })
        }
      },

      // Add a new batch check (and sync to Google Sheets)
      addBatchCheck: (check: BatchCheck) => {
        // Add locally first for immediate UI update
        set((state) => ({
          batchChecks: [check, ...state.batchChecks],
        }))

        // Note: Actual submission to Google Sheets should be done from the component
        // to handle submission feedback properly
      },

      // Add a record locally (after successful submission)
      addLocalRecord: (check: BatchCheck) => {
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
