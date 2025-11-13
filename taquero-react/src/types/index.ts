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

export interface ModuleCard {
  id: string
  title: string
  description: string
  icon: string
  dashboard: DashboardType | 'both'
}

export interface TrainingRecord {
  id: string
  topic: string
  trainerInitials: string
  date: string // ISO format
}

export interface StaffMember {
  id: string
  name: string
  position: string
  trainingRecords: TrainingRecord[]
}
