export interface User {
  name: string
  loginTime: string
}

export type DashboardType = 'restaurant' | 'manufacturing'

export interface TemperatureReading {
  unit: string
  temperature: number
}

export interface TemperatureData {
  date: string
  timestamp: string
  user: string
  chillers: TemperatureReading[]
  freezer: TemperatureReading | null
}

export interface TemperatureRecord extends TemperatureData {
  id?: string
}

export interface ModuleCard {
  id: string
  title: string
  description: string
  icon: string
  dashboard: DashboardType | 'both'
}

export interface TrainingRecord {
  id: string
  staffId?: string // Reference to staff member
  topic: string
  trainerInitials: string
  date: string // ISO format
}

export interface StaffMember {
  id: string
  name: string
  initials: string // 2-letter staff initials (e.g., "HV")
  position: string
  email?: string // Optional
  phone?: string // Optional
  createdAt: string // ISO format
  trainingRecords: TrainingRecord[]
}

export type FoodType = 'Chicken' | 'Beef' | 'Pork' | 'Other'
export type CheckType = 'initial' | 'weekly' | 'confirm' | 'doner'

export interface BatchCheck {
  id: string
  date: string // ISO format date
  time: string // HH:MM format
  foodType: FoodType
  customFood?: string // Only if foodType is 'Other'
  checkType: CheckType
  temperature: number // in Celsius
  timeAtTemperature: string
  completedBy: string // Staff name
  timestamp: string // ISO timestamp when saved
  isSafe: boolean // Whether temperature was >= 65°C
}
