import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CoolingBatchCheckRecord } from '@/types'

// Google Sheets webhook URL - update this with your deployed Apps Script URL
const GOOGLE_SHEETS_URL = ''

// Helper function to save batch check record to Google Sheets
export async function saveBatchCheckToGoogleSheets(
  record: CoolingBatchCheckRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      foodType: record.foodType,
      dateCooked: record.dateCooked,
      startTime: record.startTime,
      startTemp: record.startTemp,
      secondTimeCheck: record.secondTimeCheck,
      secondTempCheck: record.secondTempCheck,
      thirdTimeCheck: record.thirdTimeCheck,
      thirdTempCheck: record.thirdTempCheck,
      coolingMethod: record.coolingMethod,
      completedBy: record.completedBy,
      unixTimestamp: Math.floor(new Date(record.timestamp).getTime() / 1000),
    }

    await fetch(`${GOOGLE_SHEETS_URL}?module=cooling-batch-checks`, {
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

interface CoolingBatchCheckState {
  // State
  records: CoolingBatchCheckRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: CoolingBatchCheckRecord) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => CoolingBatchCheckRecord[]
}

export const useCoolingBatchCheckStore = create<CoolingBatchCheckState>()(
  persist(
    (set, get) => ({
      // Initial state
      records: [],
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
          const response = await fetch(`${GOOGLE_SHEETS_URL}?module=cooling-batch-checks`, {
            method: 'GET',
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          if (result.success && result.data) {
            set({
              records: result.data,
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

      // Add a new batch check record
      addRecord: (record: CoolingBatchCheckRecord) => {
        set((state) => ({
          records: [record, ...state.records],
        }))
      },

      // Delete a record
      deleteRecord: (recordId: string) => {
        set((state) => ({
          records: state.records.filter((record) => record.id !== recordId),
        }))
      },

      // Get all records
      getRecords: () => {
        return get().records
      },
    }),
    {
      name: 'taquero-cooling-batch-checks',
    }
  )
)
