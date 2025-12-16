// Transaction category definitions and classification logic

export const EXPENSE_CATEGORIES = {
  // Income
  REVENUE: 'Revenue',

  // Operating Expenses
  FOOD_SUPPLIES: 'Food Supplies',
  LABOR_PAYROLL: 'Labor/Payroll',
  RENT_LEASE: 'Rent/Lease',
  UTILITIES: 'Utilities',
  EQUIPMENT_RENTAL: 'Equipment Rental',
  INSURANCE: 'Insurance',
  MARKETING_TECH: 'Marketing/Tech',
  DELIVERY_PLATFORM_FEES: 'Delivery Platform Fees',
  BANKING_FEES: 'Banking Fees',
  LICENSES_COMPLIANCE: 'Licenses/Compliance',
  PROFESSIONAL_SERVICES: 'Professional Services',
  REPAIRS_MAINTENANCE: 'Repairs/Maintenance',
  SUPPLIES: 'Supplies',
  PARKING_TRANSPORT: 'Parking/Transport',

  // Special
  INTERNAL_TRANSFER: 'Internal Transfer',
  PERSONAL: 'Personal',
  TAX: 'Tax',
  OTHER: 'Other',
  UNKNOWN: 'Unknown',
} as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES]

export interface PayeeClassification {
  payee: string
  category: ExpenseCategory
  userCorrection?: ExpenseCategory
  confidence: 'High' | 'Medium' | 'Low'
}

// Payee classification mapping from CSV
// This will be populated from the CSV data
export const PAYEE_CLASSIFICATIONS: Record<string, PayeeClassification> = {}

/**
 * Load payee classifications from CSV data
 */
export function loadPayeeClassifications(csvData: string) {
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',')

  // Clear existing
  Object.keys(PAYEE_CLASSIFICATIONS).forEach(key => delete PAYEE_CLASSIFICATIONS[key])

  // Parse CSV (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Simple CSV parsing (handles quoted fields)
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    fields.push(current.trim())

    const payee = fields[0]
    const category = fields[1] as ExpenseCategory
    const userCorrection = fields[2] ? fields[2] as ExpenseCategory : undefined
    const confidence = fields[3] as 'High' | 'Medium' | 'Low'

    if (payee && category) {
      PAYEE_CLASSIFICATIONS[payee] = {
        payee,
        category,
        userCorrection,
        confidence
      }
    }
  }

  console.log(`✅ Loaded ${Object.keys(PAYEE_CLASSIFICATIONS).length} payee classifications`)
}

/**
 * Get category for a payee (uses user correction if available)
 */
export function getPayeeCategory(payee: string): ExpenseCategory | null {
  const classification = PAYEE_CLASSIFICATIONS[payee]
  if (!classification) return null

  // User correction takes precedence
  return classification.userCorrection || classification.category
}

/**
 * Check if category is an expense (not revenue, transfer, or personal)
 */
export function isExpenseCategory(category: ExpenseCategory): boolean {
  return category !== EXPENSE_CATEGORIES.REVENUE &&
         category !== EXPENSE_CATEGORIES.INTERNAL_TRANSFER &&
         category !== EXPENSE_CATEGORIES.PERSONAL
}

/**
 * Check if category is revenue
 */
export function isRevenueCategory(category: ExpenseCategory): boolean {
  return category === EXPENSE_CATEGORIES.REVENUE
}

/**
 * Get color for category (for charts)
 */
export function getCategoryColor(category: ExpenseCategory): string {
  const colors: Record<string, string> = {
    [EXPENSE_CATEGORIES.REVENUE]: '#10b981', // green
    [EXPENSE_CATEGORIES.FOOD_SUPPLIES]: '#f59e0b', // amber
    [EXPENSE_CATEGORIES.LABOR_PAYROLL]: '#ef4444', // red
    [EXPENSE_CATEGORIES.RENT_LEASE]: '#3b82f6', // blue
    [EXPENSE_CATEGORIES.UTILITIES]: '#06b6d4', // cyan
    [EXPENSE_CATEGORIES.EQUIPMENT_RENTAL]: '#6366f1', // indigo
    [EXPENSE_CATEGORIES.INSURANCE]: '#ec4899', // pink
    [EXPENSE_CATEGORIES.MARKETING_TECH]: '#14b8a6', // teal
    [EXPENSE_CATEGORIES.DELIVERY_PLATFORM_FEES]: '#f97316', // orange
    [EXPENSE_CATEGORIES.BANKING_FEES]: '#84cc16', // lime
    [EXPENSE_CATEGORIES.LICENSES_COMPLIANCE]: '#a855f7', // violet
    [EXPENSE_CATEGORIES.PROFESSIONAL_SERVICES]: '#0ea5e9', // sky
    [EXPENSE_CATEGORIES.REPAIRS_MAINTENANCE]: '#f43f5e', // rose
    [EXPENSE_CATEGORIES.SUPPLIES]: '#eab308', // yellow
    [EXPENSE_CATEGORIES.PARKING_TRANSPORT]: '#22c55e', // green
  }

  return colors[category] || '#64748b' // slate default
}

/**
 * Get emoji for category
 */
export function getCategoryEmoji(category: ExpenseCategory): string {
  const emojis: Record<string, string> = {
    [EXPENSE_CATEGORIES.REVENUE]: '💰',
    [EXPENSE_CATEGORIES.FOOD_SUPPLIES]: '🍖',
    [EXPENSE_CATEGORIES.LABOR_PAYROLL]: '👥',
    [EXPENSE_CATEGORIES.RENT_LEASE]: '🏢',
    [EXPENSE_CATEGORIES.UTILITIES]: '⚡',
    [EXPENSE_CATEGORIES.EQUIPMENT_RENTAL]: '🔧',
    [EXPENSE_CATEGORIES.INSURANCE]: '🛡️',
    [EXPENSE_CATEGORIES.MARKETING_TECH]: '📱',
    [EXPENSE_CATEGORIES.DELIVERY_PLATFORM_FEES]: '🚗',
    [EXPENSE_CATEGORIES.BANKING_FEES]: '🏦',
    [EXPENSE_CATEGORIES.LICENSES_COMPLIANCE]: '📜',
    [EXPENSE_CATEGORIES.PROFESSIONAL_SERVICES]: '💼',
    [EXPENSE_CATEGORIES.REPAIRS_MAINTENANCE]: '🔨',
    [EXPENSE_CATEGORIES.SUPPLIES]: '📦',
    [EXPENSE_CATEGORIES.PARKING_TRANSPORT]: '🅿️',
  }

  return emojis[category] || '❓'
}
