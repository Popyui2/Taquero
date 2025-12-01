import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SicknessRecord } from '@/types'

// Google Sheets webhook URL - update this with your deployed Apps Script URL
const GOOGLE_SHEETS_URL = import.meta.env.VITE_STAFF_SICKNESS_SHEET_URL || 'https://script.google.com/macros/s/AKfycbwKeROQFAY1e7uKNa1iQ5kP9m5r7FpURvC7Wy7CkhWGgyW8f_3wktIMKvivRE3YyolR/exec'

// Helper function to save sickness record to Google Sheets
export async function saveSicknessToGoogleSheets(
  record: SicknessRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      staffName: record.staffName,
      symptoms: record.symptoms || '',
      dateSick: record.dateSick,
      dateReturned: record.dateReturned || '',
      actionTaken: record.actionTaken || '',
      checkedBy: record.checkedBy,
      unixTimestamp: Math.floor(new Date(record.timestamp).getTime() / 1000),
      status: record.status,
    }

    await fetch(`${GOOGLE_SHEETS_URL}?module=staff-sickness`, {
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

interface StaffSicknessState {
  // State
  records: SicknessRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: SicknessRecord) => void
  updateRecordStatus: (recordId: string, dateReturned: string) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => SicknessRecord[]
  getSickRecords: () => SicknessRecord[]
  getReturnedRecords: () => SicknessRecord[]
  getRecordById: (recordId: string) => SicknessRecord | undefined
}

export const useStaffSicknessStore = create<StaffSicknessState>()(
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
          const response = await fetch(`${GOOGLE_SHEETS_URL}?module=staff-sickness`, {
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

      // Add a new sickness record
      addRecord: (record: SicknessRecord) => {
        set((state) => ({
          records: [record, ...state.records],
        }))
      },

      // Update a record when staff returns to work
      updateRecordStatus: (recordId: string, dateReturned: string) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, dateReturned, status: 'returned' as const }
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

      // Get only currently sick staff
      getSickRecords: () => {
        return get().records.filter((record) => record.status === 'sick')
      },

      // Get only returned staff
      getReturnedRecords: () => {
        return get().records.filter((record) => record.status === 'returned')
      },

      // Get specific record by ID
      getRecordById: (recordId: string) => {
        return get().records.find((record) => record.id === recordId)
      },
    }),
    {
      name: 'taquero-staff-sickness',
    }
  )
)
