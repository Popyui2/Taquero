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
  isSafe?: boolean // Legacy field - no longer used
}

// Proving Method Types
export interface ValidationBatch {
  batchNumber: 1 | 2 | 3
  date: string // ISO format date
  temperature: number // in Celsius at thickest part
  timeAtTemp: string // e.g., "1 minute", "30 seconds"
  completedBy: string // Staff name
  timestamp: string // ISO timestamp when recorded
}

export interface ProvingMethod {
  id: string
  itemDescription: string // e.g., "2kg chicken roast x4"
  cookingMethod: string // Full method description
  status: 'in-progress' | 'proven' // in-progress = 0-2 batches, proven = 3 batches
  batches: ValidationBatch[] // Array of 0-3 batches
  createdAt: string // ISO timestamp when method was created
  provenAt?: string // ISO timestamp when 3rd batch completed (only if status = proven)
  createdBy: string // Staff name who created the method
}

// Staff Sickness Types
export interface SicknessRecord {
  id: string
  staffName: string // Name of staff member who was sick
  symptoms?: string // Optional - what symptoms they had
  dateSick: string // ISO format date when they became sick
  dateReturned?: string // ISO format date when returned to work (undefined if still sick)
  actionTaken?: string // Optional - what action was taken
  checkedBy: string // Who recorded/checked this entry
  timestamp: string // ISO timestamp when record was created
  status: 'sick' | 'returned' // Current status
}

// Proving Cooling Method Types
export interface CoolingBatch {
  batchNumber: 1 | 2 | 3
  date: string // ISO format date
  startTime: string // HH:MM format when food reaches 60°C
  startTemp: number // Should be around 60°C
  secondTimeCheck: string // HH:MM format
  secondTempCheck: number // Should be ≤21°C (60°C to 21°C in 2 hours or less)
  thirdTimeCheck: string // HH:MM format
  thirdTempCheck: number // Should be ≤5°C (21°C to 5°C in 4 hours or less)
  completedBy: string // Staff name
  timestamp: string // ISO timestamp when recorded
}

export interface CoolingMethod {
  id: string
  foodItem: string // e.g., "1 litre of butter chicken curry"
  coolingMethod: string // Full method description
  status: 'in-progress' | 'proven' // in-progress = 0-2 batches, proven = 3 batches
  batches: CoolingBatch[] // Array of 0-3 batches
  createdAt: string // ISO timestamp when method was created
  provenAt?: string // ISO timestamp when 3rd batch completed (only if status = proven)
  createdBy: string // Staff name who created the method
}

// Cooling Batch Check Types (Weekly checks AFTER proving a cooling method)
export interface CoolingBatchCheckRecord {
  id: string
  foodType: string // Type of food being cooled
  dateCooked: string // ISO format date when food was cooked
  startTime: string // HH:MM format when food reaches 60°C
  startTemp: number // Should be around 60°C
  secondTimeCheck: string // HH:MM format
  secondTempCheck: number // Should be ≤21°C (60°C to 21°C in 2 hours or less)
  thirdTimeCheck: string // HH:MM format
  thirdTempCheck: number // Should be ≤5°C (21°C to 5°C in 4 hours or less)
  coolingMethod: string // Description of cooling method used
  completedBy: string // Staff name who did the check
  timestamp: string // ISO timestamp when recorded
}

// Proving Reheating Method Types
export interface ReheatingBatch {
  batchNumber: 1 | 2 | 3
  date: string // ISO format date
  internalTemp: number // Must be ≥75°C at coolest part (liquid) or middle (solid)
  completedBy: string // Staff name
  timestamp: string // ISO timestamp when recorded
}

export interface ReheatingMethod {
  id: string
  itemDescription: string // e.g., "5 litres vegetable soup"
  reheatingMethod: string // Full method description
  status: 'in-progress' | 'proven' // in-progress = 0-2 batches, proven = 3 batches
  batches: ReheatingBatch[] // Array of 0-3 batches
  createdAt: string // ISO timestamp when method was created
  provenAt?: string // ISO timestamp when 3rd batch completed (only if status = proven)
  createdBy: string // Staff name who created the method
}
