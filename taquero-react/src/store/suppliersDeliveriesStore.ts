import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SupplierDeliveryRecord } from '@/types'

const GOOGLE_SHEETS_URL = import.meta.env.VITE_DELIVERIES_SHEET_URL || 'https://script.google.com/macros/s/AKfycbySJO0jwPwx04IFLE9ZfNQRGKPzNW0X9h64fOZfjnag3SZ9sH2Bh49SDntXrK8ycOaq9Q/exec'

/**
 * Save a supplier delivery record to Google Sheets
 */
export async function saveDeliveryToGoogleSheets(
  record: SupplierDeliveryRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      deliveryDate: record.deliveryDate,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      batchLotId: record.batchLotId,
      typeOfFood: record.typeOfFood,
      quantity: record.quantity,
      unit: record.unit,
      requiresTempCheck: record.requiresTempCheck,
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
    console.error('Error saving delivery to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a supplier delivery record from Google Sheets (soft delete)
 */
export async function deleteDeliveryFromGoogleSheets(
  record: SupplierDeliveryRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Mark as deleted by updating the status field
    const payload = {
      id: record.id,
      deliveryDate: record.deliveryDate,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      batchLotId: record.batchLotId,
      typeOfFood: record.typeOfFood,
      quantity: record.quantity,
      unit: record.unit,
      requiresTempCheck: record.requiresTempCheck,
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
    console.error('Error deleting delivery from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface SuppliersDeliveriesState {
  records: SupplierDeliveryRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: SupplierDeliveryRecord) => void
  updateRecord: (recordId: string, updates: Partial<SupplierDeliveryRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => SupplierDeliveryRecord[]
  getRecordById: (recordId: string) => SupplierDeliveryRecord | undefined
}

export const useSuppliersDeliveriesStore = create<SuppliersDeliveriesState>()(
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
            throw new Error(result.error || 'Failed to fetch deliveries')
          }
        } catch (error) {
          console.error('Error fetching deliveries from Google Sheets:', error)
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
        // Sort by delivery date (newest first)
        return records.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
      },

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    {
      name: 'taquero-supplier-deliveries',
    }
  )
)
