import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CleaningRecord } from '@/types'

const GOOGLE_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwO0Sj8BLlHAORdv-_3HIZ3yc5LKUpMZ9ZmO3HdPygJFGYHRfa03-Giz7OGU4SrwSYJ/exec'

/**
 * Save a cleaning record to Google Sheets
 */
export async function saveCleaningRecordToGoogleSheets(
  record: CleaningRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      cleaningTask: record.cleaningTask,
      dateCompleted: record.dateCompleted,
      cleaningMethod: record.cleaningMethod,
      completedBy: record.completedBy,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      status: record.status,
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
    console.error('Error saving cleaning record to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a cleaning record from Google Sheets (soft delete)
 */
export async function deleteCleaningRecordFromGoogleSheets(
  record: CleaningRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Mark as deleted by updating the status field
    const payload = {
      id: record.id,
      cleaningTask: record.cleaningTask,
      dateCompleted: record.dateCompleted,
      cleaningMethod: record.cleaningMethod,
      completedBy: record.completedBy,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
      status: 'deleted',
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
    console.error('Error deleting cleaning record from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface CleaningClosingState {
  records: CleaningRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: CleaningRecord) => void
  updateRecord: (recordId: string, updates: Partial<CleaningRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => CleaningRecord[]
  getRecordById: (recordId: string) => CleaningRecord | undefined
}

export const useCleaningClosingStore = create<CleaningClosingState>()(
  persist(
    (set, get) => ({
      records: [],
      isLoading: false,
      lastFetchTime: null,
      fetchError: null,

      fetchFromGoogleSheets: async () => {
        if (!GOOGLE_SHEETS_URL) {
          console.warn('⚠️ Google Sheets URL not configured')
          set({ fetchError: 'Google Sheets URL not configured' })
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
            throw new Error(result.error || 'Failed to fetch cleaning records')
          }
        } catch (error) {
          console.error('Error fetching cleaning records from Google Sheets:', error)
          set({
            fetchError: error instanceof Error ? error.message : 'Unknown error',
          })
        } finally {
          set({ isLoading: false })
        }
      },

      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),

      updateRecord: (recordId, updates) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, ...updates, updatedAt: new Date().toISOString() }
              : record
          ),
        })),

      deleteRecord: (recordId) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, status: 'deleted' as const, updatedAt: new Date().toISOString() }
              : record
          ),
        })),

      getRecords: () => {
        const records = get().records.filter((record) => record.status !== 'deleted')
        // Sort by date completed (newest first)
        return records.sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime())
      },

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    {
      name: 'taquero-cleaning-closing',
    }
  )
)
