import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { B2BSaleRecord } from '@/types'

const GOOGLE_SHEETS_URL =
  import.meta.env.VITE_B2B_SALES_SHEET_URL || 'https://script.google.com/macros/s/AKfycbwFXF0DwiXO2zziIBv3EQQoOC8Drhjht4N-1EVHizPORaIZL26JFsx6JfVehnrnRrpC/exec'

/**
 * Save a B2B sale record to Google Sheets
 */
export async function saveB2BSaleToGoogleSheets(
  record: B2BSaleRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Send as array to preserve column order
    const rowData = [
      Math.floor(new Date(record.createdAt).getTime() / 1000), // Unix Timestamp
      record.id,                           // ID
      record.businessName,                 // Business Name
      record.contactDetails,               // Contact Details
      record.productSupplied,              // Product Supplied
      record.quantity,                     // Quantity
      record.unit,                         // Units
      record.dateSupplied,                 // Date Supplied
      record.taskDoneBy,                   // Task Done By
      record.notes || '',                  // Notes
      record.createdAt,                    // Created At
      record.updatedAt || '',              // Updated At
      record.status,                       // Status
    ]

    const payload = {
      action: 'addRecord',
      data: rowData
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
    console.error('Error saving B2B sale to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a B2B sale record from Google Sheets (soft delete)
 */
export async function deleteB2BSaleFromGoogleSheets(
  record: B2BSaleRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Send as array to preserve column order
    const rowData = [
      Math.floor(new Date(record.createdAt).getTime() / 1000), // Unix Timestamp
      record.id,                           // ID
      record.businessName,                 // Business Name
      record.contactDetails,               // Contact Details
      record.productSupplied,              // Product Supplied
      record.quantity,                     // Quantity
      record.unit,                         // Units
      record.dateSupplied,                 // Date Supplied
      record.taskDoneBy,                   // Task Done By
      record.notes || '',                  // Notes
      record.createdAt,                    // Created At
      new Date().toISOString(),            // Updated At
      'deleted',                           // Status
    ]

    const payload = {
      action: 'updateRecord',
      data: rowData
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
    console.error('Error deleting B2B sale from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface B2BSalesState {
  records: B2BSaleRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: B2BSaleRecord) => void
  updateRecord: (recordId: string, updates: Partial<B2BSaleRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => B2BSaleRecord[]
  getRecordById: (recordId: string) => B2BSaleRecord | undefined
}

export const useB2BSalesStore = create<B2BSalesState>()(
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
            throw new Error(result.error || 'Failed to fetch B2B sales')
          }
        } catch (error) {
          console.error('Error fetching B2B sales from Google Sheets:', error)
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
        // Sort by date supplied (newest first)
        return records.sort((a, b) => new Date(b.dateSupplied).getTime() - new Date(a.dateSupplied).getTime())
      },

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    {
      name: 'taquero-b2b-sales',
    }
  )
)
