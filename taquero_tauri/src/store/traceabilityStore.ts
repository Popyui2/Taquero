import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TraceabilityRecord } from '@/types'

const GOOGLE_SHEETS_URL =
  import.meta.env.VITE_TRACEABILITY_SHEET_URL || 'https://script.google.com/macros/s/AKfycbxp2QQhGeF1dgQgqBsOkC5b01iLP6YPrfhaSX7yvJ6CGC2aevDL9Aa_7mnD4Nf0wOrfBg/exec'

/**
 * Save a traceability record to Google Sheets
 */
export async function saveTraceabilityRecordToGoogleSheets(
  record: TraceabilityRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      traceDate: record.traceDate,
      productType: record.productType,
      brand: record.brand,
      batchLotInfo: record.batchLotInfo,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      manufacturerName: record.manufacturerName,
      manufacturerContact: record.manufacturerContact,
      dateReceived: record.dateReceived,
      performedBy: record.performedBy,
      otherInfo: record.otherInfo,
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
    console.error('Error saving traceability record to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a traceability record from Google Sheets (soft delete)
 */
export async function deleteTraceabilityRecordFromGoogleSheets(
  record: TraceabilityRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Mark as deleted by updating the status field
    const payload = {
      id: record.id,
      traceDate: record.traceDate,
      productType: record.productType,
      brand: record.brand,
      batchLotInfo: record.batchLotInfo,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      manufacturerName: record.manufacturerName,
      manufacturerContact: record.manufacturerContact,
      dateReceived: record.dateReceived,
      performedBy: record.performedBy,
      otherInfo: record.otherInfo,
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
    console.error('Error deleting traceability record from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface TraceabilityState {
  records: TraceabilityRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: TraceabilityRecord) => void
  updateRecord: (recordId: string, updates: Partial<TraceabilityRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => TraceabilityRecord[]
  getRecordById: (recordId: string) => TraceabilityRecord | undefined
}

export const useTraceabilityStore = create<TraceabilityState>()(
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
            throw new Error(result.error || 'Failed to fetch traceability records')
          }
        } catch (error) {
          console.error('Error fetching traceability records from Google Sheets:', error)
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
        // Sort by trace date (newest first)
        return records.sort((a, b) => new Date(b.traceDate).getTime() - new Date(a.traceDate).getTime())
      },

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    {
      name: 'taquero-traceability',
    }
  )
)
