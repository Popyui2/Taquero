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

interface StaffTrainingState {
  staffMembers: StaffMember[]
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'trainingRecords'>) => void
  updateStaffMember: (id: string, staff: Partial<Omit<StaffMember, 'id' | 'trainingRecords'>>) => void
  deleteStaffMember: (id: string) => void
  addTrainingRecord: (staffId: string, record: Omit<TrainingRecord, 'id'>) => void
  updateTrainingRecord: (staffId: string, recordId: string, record: Partial<Omit<TrainingRecord, 'id'>>) => void
  deleteTrainingRecord: (staffId: string, recordId: string) => void
  getStaffMember: (id: string) => StaffMember | undefined
}

export const useStaffTrainingStore = create<StaffTrainingState>()(
  persist(
    (set, get) => ({
      staffMembers: [],

      addStaffMember: (staff) => {
        const newStaffMember: StaffMember = {
          ...staff,
          id: generateId(),
          trainingRecords: [],
        }
        set((state) => ({
          staffMembers: [...state.staffMembers, newStaffMember],
        }))
      },

      updateStaffMember: (id, staff) => {
        set((state) => ({
          staffMembers: state.staffMembers.map((member) =>
            member.id === id ? { ...member, name: staff.name, position: staff.position } : member
          ),
        }))
      },

      deleteStaffMember: (id) => {
        set((state) => ({
          staffMembers: state.staffMembers.filter((member) => member.id !== id),
        }))
      },

      addTrainingRecord: (staffId, record) => {
        const newRecord: TrainingRecord = {
          ...record,
          id: generateId(),
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
      },

      updateTrainingRecord: (staffId, recordId, record) => {
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
      },

      deleteTrainingRecord: (staffId, recordId) => {
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
      },

      getStaffMember: (id) => {
        return get().staffMembers.find((member) => member.id === id)
      },
    }),
    {
      name: 'staff-training-storage',
    }
  )
)
