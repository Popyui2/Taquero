import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TransportTempCheckRecord } from '@/types'

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzijEByks2fbcUU-JsyJmPfmv7AoPz4XtqjZ-IpD92AYHI1iRkFqnFc9WMJitb5TSZT8Q/exec'

/**
 * Save a transport temperature check record to Google Sheets
 */
export async function saveTransportTempCheckToGoogleSheets(
  record: TransportTempCheckRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      checkDate: record.checkDate,
      typeOfFood: record.typeOfFood,
      temperature: record.temperature,
      taskDoneBy: record.taskDoneBy,
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
    console.error('Error saving transport temp check to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a transport temperature check record from Google Sheets (soft delete)
 */
export async function deleteTransportTempCheckFromGoogleSheets(
  record: TransportTempCheckRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Mark as deleted by updating the status field
    const payload = {
      id: record.id,
      checkDate: record.checkDate,
      typeOfFood: record.typeOfFood,
      temperature: record.temperature,
      taskDoneBy: record.taskDoneBy,
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
    console.error('Error deleting transport temp check from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface TransportTempChecksState {
  records: TransportTempCheckRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: TransportTempCheckRecord) => void
  updateRecord: (recordId: string, updates: Partial<TransportTempCheckRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => TransportTempCheckRecord[]
  getRecordById: (recordId: string) => TransportTempCheckRecord | undefined
}

export const useTransportTempChecksStore = create<TransportTempChecksState>()(
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
            throw new Error(result.error || 'Failed to fetch transport temp checks')
          }
        } catch (error) {
          console.error('Error fetching transport temp checks from Google Sheets:', error)
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
        // Sort by check date (newest first)
        return records.sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime())
      },

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    {
      name: 'taquero-transport-temp-checks',
    }
  )
)
