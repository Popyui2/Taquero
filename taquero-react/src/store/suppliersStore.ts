import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SupplierRecord } from '@/types'

// Google Sheets webhook URL - update this with your deployed Apps Script URL
const GOOGLE_SHEETS_URL = import.meta.env.VITE_SUPPLIERS_SHEET_URL || 'https://script.google.com/macros/s/AKfycbxBp8M_cohQeaUNZP5R5nQrJ00XcQUfUCSF92_dAFj9ppPGkBE769DuAo-cMMNiGGcY/exec'

// Helper function to save record to Google Sheets
export async function saveSupplierToGoogleSheets(
  record: SupplierRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      businessName: record.businessName,
      siteRegistrationNumber: record.siteRegistrationNumber,
      contactPerson: record.contactPerson,
      phone: record.phone,
      email: record.email,
      address: record.address,
      orderDays: record.orderDays,
      deliveryDays: record.deliveryDays,
      customArrangement: record.customArrangement,
      goodsSupplied: record.goodsSupplied,
      comments: record.comments,
      createdBy: record.createdBy,
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
    console.error('❌ Error saving to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper function to soft delete record from Google Sheets (mark as deleted)
export async function deleteSupplierFromGoogleSheets(
  record: SupplierRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Mark as deleted by updating the status field
    const payload = {
      id: record.id,
      businessName: record.businessName,
      siteRegistrationNumber: record.siteRegistrationNumber,
      contactPerson: record.contactPerson,
      phone: record.phone,
      email: record.email,
      address: record.address,
      orderDays: record.orderDays,
      deliveryDays: record.deliveryDays,
      customArrangement: record.customArrangement,
      goodsSupplied: record.goodsSupplied,
      comments: record.comments,
      createdBy: record.createdBy,
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
    console.error('❌ Error deleting from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface SuppliersState {
  // State
  records: SupplierRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: SupplierRecord) => void
  updateRecord: (recordId: string, updates: Partial<SupplierRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => SupplierRecord[]
  getRecordById: (recordId: string) => SupplierRecord | undefined
}

export const useSuppliersStore = create<SuppliersState>()(
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

      // Add a new supplier record
      addRecord: (record: SupplierRecord) => {
        set((state) => ({
          records: [record, ...state.records],
        }))
      },

      // Update an existing record
      updateRecord: (recordId: string, updates: Partial<SupplierRecord>) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, ...updates, updatedAt: new Date().toISOString() }
              : record
          ),
        }))
      },

      // Delete a record (soft delete - mark as deleted)
      deleteRecord: (recordId: string) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? { ...record, status: 'deleted' as const, updatedAt: new Date().toISOString() }
              : record
          ),
        }))
      },

      // Get all records (filter out deleted)
      getRecords: () => {
        return get().records.filter((record) => record.status !== 'deleted')
      },

      // Get record by ID
      getRecordById: (recordId: string) => {
        return get().records.find((record) => record.id === recordId)
      },
    }),
    {
      name: 'taquero-suppliers',
    }
  )
)
