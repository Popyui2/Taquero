import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ReheatingMethod, ReheatingBatch } from '@/types'

// Google Sheets webhook URL - update this with your deployed Apps Script URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxDT8PJzuo1sPDVldlHDH-rkYJp5O6wleomkSFsKBBlu8GKLJmhjC2mlL54WQ1p41onJQ/exec'

// Helper function to save batch to Google Sheets
export async function saveReheatingBatchToGoogleSheets(
  method: ReheatingMethod,
  batch: ReheatingBatch
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      methodId: method.id,
      itemDescription: method.itemDescription,
      reheatingMethod: method.reheatingMethod,
      batchNumber: batch.batchNumber,
      date: batch.date,
      internalTemp: batch.internalTemp,
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

interface ProvingReheatingState {
  // State
  methods: ReheatingMethod[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  createMethod: (method: ReheatingMethod) => void
  addBatchToMethod: (methodId: string, batch: ReheatingBatch) => void
  getMethods: () => ReheatingMethod[]
  getMethodById: (methodId: string) => ReheatingMethod | undefined
}

export const useProvingReheatingStore = create<ProvingReheatingState>()(
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

      // Create a new method with first batch
      createMethod: (method: ReheatingMethod) => {
        set((state) => ({
          methods: [method, ...state.methods],
        }))
      },

      // Add a batch to an existing method
      addBatchToMethod: (methodId: string, batch: ReheatingBatch) => {
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

      // Get all methods
      getMethods: () => {
        return get().methods
      },

      // Get method by ID
      getMethodById: (methodId: string) => {
        return get().methods.find((method) => method.id === methodId)
      },
    }),
    {
      name: 'taquero-proving-reheating',
    }
  )
)
