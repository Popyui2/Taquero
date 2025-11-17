import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CoolingMethod, CoolingBatch } from '@/types'

// Google Sheets webhook URL - update this with your deployed Apps Script URL
const GOOGLE_SHEETS_URL = ''

// Helper function to save batch to Google Sheets
export async function saveCoolingBatchToGoogleSheets(
  method: CoolingMethod,
  batch: CoolingBatch
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      methodId: method.id,
      foodItem: method.foodItem,
      coolingMethod: method.coolingMethod,
      batchNumber: batch.batchNumber,
      date: batch.date,
      startTime: batch.startTime,
      startTemp: batch.startTemp,
      secondTimeCheck: batch.secondTimeCheck,
      secondTempCheck: batch.secondTempCheck,
      thirdTimeCheck: batch.thirdTimeCheck,
      thirdTempCheck: batch.thirdTempCheck,
      completedBy: batch.completedBy,
      unixTimestamp: Math.floor(new Date(batch.timestamp).getTime() / 1000),
      status: batch.batchNumber === 3 ? 'proven' : method.status,
      createdBy: method.createdBy,
      createdAt: method.createdAt,
    }

    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors' as RequestMode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return { success: true }
  } catch (error) {
    console.error('❌ Error saving to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface CoolingMethodState {
  // State
  methods: CoolingMethod[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  createMethod: (method: CoolingMethod) => void
  addBatchToMethod: (methodId: string, batch: CoolingBatch) => void
  deleteMethod: (methodId: string) => void
  resetMethod: (methodId: string) => void
  getMethods: () => CoolingMethod[]
  getInProgressMethods: () => CoolingMethod[]
  getProvenMethods: () => CoolingMethod[]
  getMethodById: (methodId: string) => CoolingMethod | undefined
}

export const useCoolingMethodStore = create<CoolingMethodState>()(
  persist(
    (set, get) => ({
      // Initial state
      methods: [],
      isLoading: false,
      lastFetchTime: null,
      fetchError: null,

      // Fetch data from Google Sheets
      fetchFromGoogleSheets: async () => {
        if (!GOOGLE_SHEETS_URL) {
          console.warn('⚠️ Google Sheets URL not configured - skipping fetch')
          return
        }

        console.log('🔄 fetchFromGoogleSheets called for cooling methods')

        set({ isLoading: true, fetchError: null })

        try {
          const response = await fetch(GOOGLE_SHEETS_URL, {
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
            console.log('✅ Cooling methods fetched:', result.data.length)
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
      createMethod: (method: CoolingMethod) => {
        set((state) => ({
          methods: [method, ...state.methods],
        }))
      },

      // Add a batch to an existing method
      addBatchToMethod: (methodId: string, batch: CoolingBatch) => {
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
      name: 'taquero-proving-cooling',
    }
  )
)
