import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StaffMember, TrainingRecord } from '@/types'

// Fallback UUID generator for browsers that don't support crypto.randomUUID()
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: generate a simple unique ID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Google Sheets webhook URL
const GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbzUX1FIp1LkGstKP0j2sVs-VUPpDRoJ2D9lnwwT8-bP9MuSNfwPBuocJ5ob0Xym5QTz/exec'

interface StaffTrainingState {
  // State
  staffMembers: StaffMember[]
  isLoading: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  syncError: string | null

  // Actions
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'trainingRecords' | 'createdAt'>) => Promise<void>
  updateStaffMember: (id: string, staff: Partial<Omit<StaffMember, 'id' | 'trainingRecords' | 'createdAt'>>) => Promise<void>
  deleteStaffMember: (id: string) => Promise<void>
  addTrainingRecord: (staffId: string, record: Omit<TrainingRecord, 'id' | 'staffId'>) => Promise<void>
  updateTrainingRecord: (staffId: string, recordId: string, record: Partial<Omit<TrainingRecord, 'id' | 'staffId'>>) => Promise<void>
  deleteTrainingRecord: (staffId: string, recordId: string) => Promise<void>
  getStaffMember: (id: string) => StaffMember | undefined

  // Sync functions
  fetchFromGoogleSheets: () => Promise<void>
  syncToGoogleSheets: (action: string, data: any) => Promise<void>
  setLoading: (loading: boolean) => void
  setSyncing: (syncing: boolean) => void
}

export const useStaffTrainingStore = create<StaffTrainingState>()(
  persist(
    (set, get) => ({
      // Initial state
      staffMembers: [],
      isLoading: false,
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Set syncing state
      setSyncing: (syncing: boolean) => {
        set({ isSyncing: syncing })
      },

      // Fetch data from Google Sheets
      fetchFromGoogleSheets: async () => {
        console.log('🔄 fetchFromGoogleSheets called')

        // Don't fetch if no webhook URL configured
        if (GOOGLE_SHEETS_WEBHOOK.includes('YOUR_DEPLOYMENT_ID')) {
          console.warn('Google Sheets webhook not configured yet')
          return
        }

        console.log('📡 Fetching from:', GOOGLE_SHEETS_WEBHOOK)
        set({ isLoading: true, syncError: null })

        try {
          // Don't send Content-Type header to avoid CORS preflight
          const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
            method: 'GET',
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          if (result.success && result.data) {
            // Update state with fetched data
            set({
              staffMembers: result.data,
              lastSyncTime: new Date().toISOString(),
              syncError: null,
            })
          } else {
            throw new Error(result.error || 'Failed to fetch data')
          }
        } catch (error) {
          console.error('Error fetching from Google Sheets:', error)
          set({
            syncError: error instanceof Error ? error.message : 'Unknown error',
          })
          // Keep using cached data from localStorage
        } finally {
          set({ isLoading: false })
        }
      },

      // Sync data to Google Sheets
      syncToGoogleSheets: async (action, data) => {
        // Don't sync if no webhook URL configured
        if (GOOGLE_SHEETS_WEBHOOK.includes('YOUR_DEPLOYMENT_ID')) {
          console.warn('Google Sheets webhook not configured yet')
          return
        }

        set({ isSyncing: true })

        try {
          // Use URLSearchParams to avoid CORS preflight triggered by Content-Type: application/json
          const params = new URLSearchParams()
          params.append('action', action)
          params.append('data', JSON.stringify(data))
          params.append('timestamp', new Date().toISOString())

          const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
            method: 'POST',
            body: params,
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          if (result.success) {
            set({
              lastSyncTime: new Date().toISOString(),
              syncError: null,
            })
          } else {
            throw new Error(result.error || 'Sync failed')
          }
        } catch (error) {
          console.error('Google Sheets sync error:', error)
          set({
            syncError: error instanceof Error ? error.message : 'Sync failed',
          })
          // Data is still saved locally, so we don't throw
        } finally {
          set({ isSyncing: false })
        }
      },

      addStaffMember: async (staff) => {
        const newStaffMember: StaffMember = {
          ...staff,
          id: generateId(),
          createdAt: new Date().toISOString(),
          trainingRecords: [],
        }
        set((state) => ({
          staffMembers: [...state.staffMembers, newStaffMember],
        }))

        // Sync to Google Sheets
        await get().syncToGoogleSheets('addStaff', newStaffMember)
      },

      updateStaffMember: async (id, staff) => {
        set((state) => ({
          staffMembers: state.staffMembers.map((member) =>
            member.id === id ? { ...member, ...staff } : member
          ),
        }))

        // Sync to Google Sheets
        const updatedStaff = get().staffMembers.find((m) => m.id === id)
        if (updatedStaff) {
          await get().syncToGoogleSheets('updateStaff', updatedStaff)
        }
      },

      deleteStaffMember: async (id) => {
        const staffToDelete = get().staffMembers.find((m) => m.id === id)

        set((state) => ({
          staffMembers: state.staffMembers.filter((member) => member.id !== id),
        }))

        // Sync to Google Sheets
        if (staffToDelete) {
          await get().syncToGoogleSheets('deleteStaff', { id })
        }
      },

      addTrainingRecord: async (staffId, record) => {
        const newRecord: TrainingRecord = {
          ...record,
          id: generateId(),
          staffId,
        }
        set((state) => ({
          staffMembers: state.staffMembers.map((member) =>
            member.id === staffId
              ? {
                  ...member,
                  trainingRecords: [newRecord, ...member.trainingRecords], // newest first
                }
              : member
          ),
        }))

        // Sync to Google Sheets
        await get().syncToGoogleSheets('addTraining', newRecord)
      },

      updateTrainingRecord: async (staffId, recordId, record) => {
        set((state) => ({
          staffMembers: state.staffMembers.map((member) =>
            member.id === staffId
              ? {
                  ...member,
                  trainingRecords: member.trainingRecords.map((r) =>
                    r.id === recordId ? { ...r, ...record } : r
                  ),
                }
              : member
          ),
        }))

        // Sync to Google Sheets
        const staff = get().staffMembers.find((m) => m.id === staffId)
        const updatedRecord = staff?.trainingRecords.find((r) => r.id === recordId)
        if (updatedRecord) {
          await get().syncToGoogleSheets('updateTraining', updatedRecord)
        }
      },

      deleteTrainingRecord: async (staffId, recordId) => {
        set((state) => ({
          staffMembers: state.staffMembers.map((member) =>
            member.id === staffId
              ? {
                  ...member,
                  trainingRecords: member.trainingRecords.filter((r) => r.id !== recordId),
                }
              : member
          ),
        }))

        // Sync to Google Sheets
        await get().syncToGoogleSheets('deleteTraining', { id: recordId, staffId })
      },

      getStaffMember: (id) => {
        return get().staffMembers.find((member) => member.id === id)
      },
    }),
    {
      name: 'taquero-staff-training',
    }
  )
)
