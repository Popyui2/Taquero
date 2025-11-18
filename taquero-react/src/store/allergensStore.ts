import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AllergenRecord } from '@/types'

// Google Sheets webhook URL - update this with your deployed Apps Script URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwmSfN7KKDheU7KVXD3EyYkCApSN_Git6XgnG6yHaX7QENXlHlrvngCzHO582yVE68gHA/exec'

// Helper function to save record to Google Sheets
export async function saveAllergenToGoogleSheets(
  record: AllergenRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      dishName: record.dishName,
      ingredients: record.ingredients,
      allergens: record.allergens,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      unixTimestamp: Math.floor(new Date(record.createdAt).getTime() / 1000),
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

// Helper function to delete record from Google Sheets
export async function deleteAllergenFromGoogleSheets(
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors' as RequestMode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        id: recordId,
      }),
    })

    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface AllergensState {
  // State
  records: AllergenRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: AllergenRecord) => void
  updateRecord: (recordId: string, updates: Partial<AllergenRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => AllergenRecord[]
  getRecordById: (recordId: string) => AllergenRecord | undefined
}

export const useAllergensStore = create<AllergensState>()(
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
          const response = await fetch(GOOGLE_SHEETS_URL, {
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

      // Add a new allergen record
      addRecord: (record: AllergenRecord) => {
        set((state) => ({
          records: [record, ...state.records],
        }))
      },

      // Update an existing record
      updateRecord: (recordId: string, updates: Partial<AllergenRecord>) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, ...updates, updatedAt: new Date().toISOString() }
              : record
          ),
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

      // Get record by ID
      getRecordById: (recordId: string) => {
        return get().records.find((record) => record.id === recordId)
      },
    }),
    {
      name: 'taquero-allergens',
    }
  )
)
