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

// Allergen Record Types
export interface AllergenRecord {
  id: string
  dishName: string // Name of the dish
  ingredients: string // Comma-separated or free text list of ingredients
  allergens: string[] // Array of allergen names selected from the required list
  createdBy: string // Staff name who created the record
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// Trusted Supplier Record Types
export interface SupplierRecord {
  id: string
  businessName: string // Name of the supplier business
  siteRegistrationNumber?: string // MPI registration number (e.g., MPI000010) - optional
  contactPerson: string // Name of contact person
  phone?: string // Contact phone number - optional
  email?: string // Contact email address - optional
  address: string // Full address of supplier
  orderDays: string[] // Days to place orders (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  deliveryDays: string[] // Days to receive delivery (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  customArrangement?: string // Custom arrangement for ordering/delivery (alternative to day selection)
  goodsSupplied: string // List of products/goods supplied
  comments?: string // Optional additional notes
  createdBy: string // Staff name who created the record
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// Supplier Delivery Record Types
export type DeliveryUnit = 'kg' | 'L' | 'units' | 'boxes' | 'trays'

export interface SupplierDeliveryRecord {
  id: string
  deliveryDate: string // ISO format date (user can edit, defaults to today)
  supplierName: string // Manually entered supplier name
  supplierContact: string // Manually entered supplier contact details
  batchLotId?: string // Batch/Lot ID from invoice/label (optional but recommended)
  typeOfFood: string // Type of food delivered (text input)
  quantity: number // Amount delivered
  unit: DeliveryUnit // Unit of measurement
  requiresTempCheck: boolean // Whether this food requires temperature control
  temperature?: number // Temperature in °C (required if requiresTempCheck = true)
  taskDoneBy: string // Staff name who received the delivery
  notes?: string // Optional additional notes
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// Transported Food Temperature Check Types
export interface TransportTempCheckRecord {
  id: string
  checkDate: string // ISO format date (user can edit, defaults to today)
  typeOfFood: string // Type of food being transported
  temperature: number // Temperature in °C (taken after >4 hours out of temp control)
  taskDoneBy: string // Staff name who performed the check
  notes?: string // Optional additional notes
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// B2B Sales Record Types (Selling Food to Other Businesses)
export type B2BUnit = 'units' | 'kg' | 'L' | 'boxes' | 'trays' | 'dozen'

export interface B2BSaleRecord {
  id: string
  businessName: string // Name of the business customer
  contactDetails: string // Contact information (address, phone, email)
  productSupplied: string // Product/food item supplied
  quantity: number // Amount supplied
  unit: B2BUnit // Unit of measurement
  dateSupplied: string // ISO format date (user can edit, defaults to today)
  taskDoneBy: string // Staff name who completed the sale
  notes?: string // Optional additional notes
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// Cleaning & Closing Record Types
export interface CleaningRecord {
  id: string
  cleaningTask: string // Items and areas cleaned (e.g., "Preparation benches")
  dateCompleted: string // ISO format date (user can edit, defaults to today)
  cleaningMethod: string // How it was cleaned (detailed method/procedure)
  completedBy: string // Staff name who completed the cleaning
  notes?: string // Optional additional notes
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// Equipment Maintenance Record Types
export interface MaintenanceRecord {
  id: string
  equipmentName: string // Equipment/facility requiring maintenance (e.g., "Grease Trap", "Fridge #1")
  dateCompleted: string // ISO format date when check/repair was done
  performedBy: string // Who performed the maintenance (service provider or staff name)
  maintenanceDescription: string // Description of what was done
  checkingFrequency?: string // Optional: How often this should be done (e.g., "6 monthly", "Monthly")
  notes?: string // Optional additional notes
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// When Something Goes Wrong - Incident Record Types
export type IncidentCategory =
  | 'equipment-failure'
  | 'temperature-issue'
  | 'contamination'
  | 'supplier-problem'
  | 'staff-error'
  | 'facility-issue'
  | 'other'

export type IncidentSeverity = 'minor' | 'moderate' | 'major'

export type IncidentStatus = 'open' | 'resolved'

export interface IncidentRecord {
  id: string
  incidentDate: string // ISO format date when incident occurred
  personResponsible: string // Who noticed/reported the incident
  staffInvolved: string // Comma-separated list of staff involved
  category: IncidentCategory // Type of incident
  whatWentWrong: string // Description of the incident
  whatDidToFix: string // Immediate corrective action taken
  preventiveAction: string // What will be done to prevent recurrence
  foodSafetyAction?: string // Optional: How food safety was maintained
  severity: IncidentSeverity // Impact level
  incidentStatus: IncidentStatus // Open or resolved
  followUpDate?: string // Optional date to verify corrective action
  notes?: string // Optional additional notes
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated (for edit tracking)
  status: 'active' | 'deleted' // Status of the record (active or soft deleted)
}

// ============================================================================
// Traceability Record Types
// ============================================================================

/**
 * Represents a traceability exercise log
 * Documents product tracing from supplier to customer
 * Required by MPI to prove traceability system works
 */
export interface TraceabilityRecord {
  id: string
  traceDate: string // Date when trace exercise was performed
  productType: string // Type of product traced (e.g., "Beef mince", "Dumpling wrapper")
  brand: string // Brand name
  batchLotInfo: string // Batch or lot number information
  supplierName: string // Name of supplier
  supplierContact: string // Supplier contact details (phone, email, address)
  manufacturerName: string // Manufacturer name (can be same as supplier)
  manufacturerContact: string // Manufacturer contact details
  dateReceived?: string // Optional: Date product was received
  performedBy: string // Person who performed the trace
  otherInfo?: string // Optional: Additional information (certificates, registration, transportation, specs)
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated
  status: 'active' | 'deleted' // Status of the record
}

// ============================================================================
// Customer Complaint Record Types
// ============================================================================

/**
 * Complaint types for categorization
 */
export type ComplaintType =
  | 'Illness/Sickness'
  | 'Foreign Object'
  | 'Quality Issue'
  | 'Temperature Issue'
  | 'Allergen Issue'
  | 'Other'

/**
 * Complaint resolution status
 */
export type ComplaintStatus =
  | 'Under Investigation'
  | 'Resolved - Our Fault'
  | 'Resolved - Not Our Fault'
  | 'Resolved - Inconclusive'
  | 'Ongoing'

/**
 * Represents a customer complaint record
 * Tracks complaints, investigations, and resolutions
 * Required by MPI to show complaints are taken seriously
 */
export interface ComplaintRecord {
  id: string
  customerName: string // Customer name
  customerContact: string // Phone or email
  purchaseDate: string // Date of purchase
  purchaseTime: string // Time of purchase (approximate)
  foodItem: string // Food item purchased
  batchLotNumber?: string // Optional batch/lot number
  complaintDescription: string // What is the complaint?
  complaintType?: ComplaintType // Optional complaint categorization
  causeInvestigation: string // Cause investigation and findings
  actionTakenImmediate: string // Immediate action taken
  actionTakenPreventive: string // Action to prevent recurrence
  resolvedBy: string // Staff member who resolved
  resolutionDate: string // Date resolved
  complaintStatus: ComplaintStatus // Current status
  linkedIncidentId?: string // Optional link to "When Something Goes Wrong" record
  notes?: string // Optional additional notes
  createdAt: string // ISO timestamp when record was created
  updatedAt?: string // ISO timestamp when record was last updated
  status: 'active' | 'deleted' // Status of the record
}
