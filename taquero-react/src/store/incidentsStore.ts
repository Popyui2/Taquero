import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { IncidentRecord } from '@/types'

const GOOGLE_SHEETS_URL = ''

/**
 * Save an incident record to Google Sheets
 */
export async function saveIncidentRecordToGoogleSheets(
  record: IncidentRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    const payload = {
      id: record.id,
      incidentDate: record.incidentDate,
      personResponsible: record.personResponsible,
      staffInvolved: record.staffInvolved,
      category: record.category,
      whatWentWrong: record.whatWentWrong,
      whatDidToFix: record.whatDidToFix,
      preventiveAction: record.preventiveAction,
      severity: record.severity,
      incidentStatus: record.incidentStatus,
      followUpDate: record.followUpDate,
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
    console.error('Error saving incident record to Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete an incident record from Google Sheets (soft delete)
 */
export async function deleteIncidentRecordFromGoogleSheets(
  record: IncidentRecord
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('⚠️ Google Sheets URL not configured')
    return { success: false, error: 'Google Sheets URL not configured' }
  }

  try {
    // Mark as deleted by updating the status field
    const payload = {
      id: record.id,
      incidentDate: record.incidentDate,
      personResponsible: record.personResponsible,
      staffInvolved: record.staffInvolved,
      category: record.category,
      whatWentWrong: record.whatWentWrong,
      whatDidToFix: record.whatDidToFix,
      preventiveAction: record.preventiveAction,
      severity: record.severity,
      incidentStatus: record.incidentStatus,
      followUpDate: record.followUpDate,
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
    console.error('Error deleting incident record from Google Sheets:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

interface IncidentsState {
  records: IncidentRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  fetchFromGoogleSheets: () => Promise<void>
  addRecord: (record: IncidentRecord) => void
  updateRecord: (recordId: string, updates: Partial<IncidentRecord>) => void
  deleteRecord: (recordId: string) => void
  getRecords: () => IncidentRecord[]
  getRecordById: (recordId: string) => IncidentRecord | undefined
}

export const useIncidentsStore = create<IncidentsState>()(
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
            throw new Error(result.error || 'Failed to fetch incident records')
          }
        } catch (error) {
          console.error('Error fetching incident records from Google Sheets:', error)
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
        // Sort by incident date (newest first)
        return records.sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime())
      },

      getRecordById: (recordId) => get().records.find((record) => record.id === recordId),
    }),
    {
      name: 'taquero-incidents',
    }
  )
)
