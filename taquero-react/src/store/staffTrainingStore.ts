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

// Google Sheets webhook URL (you'll need to set this up)
const GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'

interface StaffTrainingState {
  staffMembers: StaffMember[]
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'trainingRecords' | 'createdAt'>) => Promise<void>
  updateStaffMember: (id: string, staff: Partial<Omit<StaffMember, 'id' | 'trainingRecords' | 'createdAt'>>) => Promise<void>
  deleteStaffMember: (id: string) => Promise<void>
  addTrainingRecord: (staffId: string, record: Omit<TrainingRecord, 'id' | 'staffId'>) => Promise<void>
  updateTrainingRecord: (staffId: string, recordId: string, record: Partial<Omit<TrainingRecord, 'id' | 'staffId'>>) => Promise<void>
  deleteTrainingRecord: (staffId: string, recordId: string) => Promise<void>
  getStaffMember: (id: string) => StaffMember | undefined
  syncToGoogleSheets: (action: string, data: any) => Promise<void>
}

export const useStaffTrainingStore = create<StaffTrainingState>()(
  persist(
    (set, get) => ({
      staffMembers: [],

      syncToGoogleSheets: async (action, data) => {
        try {
          const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              data,
              timestamp: new Date().toISOString(),
            }),
          })

          if (!response.ok) {
            console.warn('Google Sheets sync failed, data saved locally')
          }
        } catch (error) {
          console.warn('Google Sheets sync error:', error, '- data saved locally')
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
