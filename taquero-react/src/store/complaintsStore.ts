import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ComplaintRecord } from '@/types'

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzzGSSfovn3OofuDeeVNVdmJnvjT6vcMkBSiG1Lg1rLJBpZxhRP2CQawD-xzIsup7qc/exec'

/**
 * Save a complaint record to Google Sheets
 */
export async function saveComplaintRecordToGoogleSheets(
  record: ComplaintRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      unixTimestamp: Math.floor(new Date(record.createdAt).getTime() / 1000),
      id: record.id,
      customerName: record.customerName,
      customerContact: record.customerContact,
      purchaseDate: record.purchaseDate,
      purchaseTime: record.purchaseTime,
      foodItem: record.foodItem,
      batchLotNumber: record.batchLotNumber,
      complaintDescription: record.complaintDescription,
      complaintType: record.complaintType,
      causeInvestigation: record.causeInvestigation,
      actionTakenImmediate: record.actionTakenImmediate,
      actionTakenPreventive: record.actionTakenPreventive,
      resolvedBy: record.resolvedBy,
      resolutionDate: record.resolutionDate,
      complaintStatus: record.complaintStatus,
      linkedIncidentId: record.linkedIncidentId,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      status: record.status,
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
    console.error('Error saving complaint record to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete a complaint record from Google Sheets (soft delete)
 */
export async function deleteComplaintRecordFromGoogleSheets(
  record: ComplaintRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Mark as deleted by updating the status field
    const payload = {
      unixTimestamp: Math.floor(new Date(record.createdAt).getTime() / 1000),
      id: record.id,
      customerName: record.customerName,
      customerContact: record.customerContact,
      purchaseDate: record.purchaseDate,
      purchaseTime: record.purchaseTime,
      foodItem: record.foodItem,
      batchLotNumber: record.batchLotNumber,
      complaintDescription: record.complaintDescription,
      complaintType: record.complaintType,
      causeInvestigation: record.causeInvestigation,
      actionTakenImmediate: record.actionTakenImmediate,
      actionTakenPreventive: record.actionTakenPreventive,
      resolvedBy: record.resolvedBy,
      resolutionDate: record.resolutionDate,
      complaintStatus: record.complaintStatus,
      linkedIncidentId: record.linkedIncidentId,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
      status: 'deleted',
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
    console.error('Error deleting complaint record from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface ComplaintsState {
  records: ComplaintRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: ComplaintRecord) => void
  updateRecord: (recordId: string, updates: Partial<ComplaintRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => ComplaintRecord[]
  getRecordById: (recordId: string) => ComplaintRecord | undefined
}

export const useComplaintsStore = create<ComplaintsState>()(
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
            throw new Error(result.error || 'Failed to fetch complaint records')
          }
        } catch (error) {
          console.error('Error fetching complaint records from Google Sheets:', error)
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
        // Sort by purchase date (newest first)
        return records.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      },

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    {
      name: 'taquero-complaints',
    }
  )
)
