import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProvingMethod, ValidationBatch } from '@/types'

// Google Sheets webhook URL - will be updated later
const GOOGLE_SHEETS_WEBHOOK = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'

interface ProvingMethodState {
  // State
  methods: ProvingMethod[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  createMethod: (method: ProvingMethod) => void
  addBatchToMethod: (methodId: string, batch: ValidationBatch) => void
  deleteMethod: (methodId: string) => void
  resetMethod: (methodId: string) => void
  getMethods: () => ProvingMethod[]
  getInProgressMethods: () => ProvingMethod[]
  getProvenMethods: () => ProvingMethod[]
  getMethodById: (methodId: string) => ProvingMethod | undefined
}

export const useProvingMethodStore = create<ProvingMethodState>()(
  persist(
    (set, get) => ({
      // Initial state
      methods: [],
      isLoading: false,
      lastFetchTime: null,
      fetchError: null,

      // Fetch data from Google Sheets
      fetchFromGoogleSheets: async () => {
        console.log('🔄 fetchFromGoogleSheets called for proving methods')

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
            set({
              methods: result.data,
              lastFetchTime: new Date().toISOString(),
              fetchError: null,
            })
            console.log('✅ Proving methods fetched:', result.data.length)
          } else {
            throw new Error(result.error || 'Failed to fetch data')
          }
        } catch (error) {
          console.error('Error fetching from Google Sheets:', error)
          set({
            fetchError: error instanceof Error ? error.message : 'Unknown error',
          })
        } finally {
          set({ isLoading: false })
        }
      },

      // Create a new method
      createMethod: (method: ProvingMethod) => {
        set((state) => ({
          methods: [method, ...state.methods],
        }))
      },

      // Add a batch to an existing method
      addBatchToMethod: (methodId: string, batch: ValidationBatch) => {
        set((state) => ({
          methods: state.methods.map((method) => {
            if (method.id === methodId) {
              const updatedBatches = [...method.batches, batch]
              const isProven = updatedBatches.length === 3

              return {
                ...method,
                batches: updatedBatches,
                status: isProven ? ('proven' as const) : ('in-progress' as const),
                provenAt: isProven ? new Date().toISOString() : method.provenAt,
              }
            }
            return method
          }),
        }))
      },

      // Delete a method (only allowed for in-progress)
      deleteMethod: (methodId: string) => {
        set((state) => ({
          methods: state.methods.filter((method) => method.id !== methodId),
        }))
      },

      // Reset a method back to 0 batches (for failed validation)
      resetMethod: (methodId: string) => {
        set((state) => ({
          methods: state.methods.map((method) => {
            if (method.id === methodId) {
              return {
                ...method,
                batches: [],
                status: 'in-progress' as const,
                provenAt: undefined,
              }
            }
            return method
          }),
        }))
      },

      // Get all methods
      getMethods: () => {
        return get().methods
      },

      // Get only in-progress methods
      getInProgressMethods: () => {
        return get().methods.filter((method) => method.status === 'in-progress')
      },

      // Get only proven methods
      getProvenMethods: () => {
        return get().methods.filter((method) => method.status === 'proven')
      },

      // Get specific method by ID
      getMethodById: (methodId: string) => {
        return get().methods.find((method) => method.id === methodId)
      },
    }),
    {
      name: 'taquero-proving-methods',
    }
  )
)
