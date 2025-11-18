import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DeliveryRecord } from '@/types'

// IMPORTANT: Replace with your deployed Google Apps Script URL
// See SUPPLIER_DELIVERIES_GOOGLE_SCRIPT.js for deployment instructions
const GOOGLE_SHEETS_URL = ''

/**
 * Save delivery record to Google Sheets
 */
export async function saveDeliveryToGoogleSheets(
  record: DeliveryRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      deliveryDate: record.deliveryDate,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      batchLotId: record.batchLotId || '',
      typeOfFood: record.typeOfFood,
      quantity: record.quantity,
      unit: record.unit,
      requiresTempCheck: record.requiresTempCheck,
      temperature: record.temperature,
      taskDoneBy: record.taskDoneBy,
      notes: record.notes || '',
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt || '',
      status: record.status,
      unixTimestamp: Math.floor(new Date(record.deliveryDate).getTime() / 1000),
    }

    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors' as RequestMode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Soft delete delivery record from Google Sheets
 */
export async function deleteDeliveryFromGoogleSheets(
  record: DeliveryRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      deliveryDate: record.deliveryDate,
      supplierName: record.supplierName,
      supplierContact: record.supplierContact,
      batchLotId: record.batchLotId || '',
      typeOfFood: record.typeOfFood,
      quantity: record.quantity,
      unit: record.unit,
      requiresTempCheck: record.requiresTempCheck,
      temperature: record.temperature,
      taskDoneBy: record.taskDoneBy,
      notes: record.notes || '',
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
      status: 'deleted',
      unixTimestamp: Math.floor(new Date(record.deliveryDate).getTime() / 1000),
    }

    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors' as RequestMode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface DeliveriesState {
  records: DeliveryRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addDelivery: (record: DeliveryRecord) => void
  updateDelivery: (recordId: string, updates: Partial<DeliveryRecord>) => void
  deleteDelivery: (recordId: string) => void
  getDeliveries: () => DeliveryRecord[]
  getDeliveryById: (recordId: string) => DeliveryRecord | undefined
}

export const useDeliveriesStore = create<DeliveriesState>()(
  persist(
    (set, get) => ({
      records: [],
      isLoading: false,
      lastFetchTime: null,
      fetchError: null,

      fetchFromGoogleSheets: async () => {
        if (!GOOGLE_SHEETS_URL) {
          set({ fetchError: 'Google Sheets URL not configured' })
          return
        }

        set({ isLoading: true, fetchError: null })
        try {
          const response = await fetch(GOOGLE_SHEETS_URL, { method: 'GET' })
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
          set({
            fetchError: error instanceof Error ? error.message : 'Unknown error',
          })
        } finally {
          set({ isLoading: false })
        }
      },

      addDelivery: (record) =>
        set((state) => ({ records: [record, ...state.records] })),

      updateDelivery: (recordId, updates) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, ...updates, updatedAt: new Date().toISOString() }
              : record
          ),
        })),

      deleteDelivery: (recordId) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  status: 'deleted' as const,
                  updatedAt: new Date().toISOString(),
                }
              : record
          ),
        })),

      getDeliveries: () =>
        get().records.filter((record) => record.status !== 'deleted'),

      getDeliveryById: (recordId) =>
        get().records.find((record) => record.id === recordId),
    }),
    { name: 'taquero-deliveries' }
  )
)
