// IndexedDB Storage for Finance Module
import type {
  ImportedData,
  DashboardMetrics,
  FinanceStore,
  MonthlyFinanceData,
  SalesByDay,
  SalesByHour,
  ProductPerformance,
  CategoryPerformance,
  PeakHours,
} from '@/types/finance'

const DB_NAME = 'taquero-finance'
const DB_VERSION = 1
const STORE_NAME = 'financeData'

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Detect month from sales data
 */
function detectMonthFromData(data: ImportedData): string {
  // Try to parse from salesByDay first date
  if (data.salesByDay.length > 0) {
    const dateStr = data.salesByDay[0].date // e.g., "Thu, 04 Dec"
    const parts = dateStr.split(',')[1]?.trim().split(' ') // ["04", "Dec"]

    if (parts && parts.length >= 2) {
      const monthMap: { [key: string]: string } = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04',
        May: '05', Jun: '06', Jul: '07', Aug: '08',
        Sep: '09', Oct: '10', Nov: '11', Dec: '12',
      }
      const month = monthMap[parts[1]]
      const year = new Date().getFullYear()

      if (month) {
        return `${year}-${month}`
      }
    }
  }

  // Fallback to current month
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Save imported financial data to IndexedDB (appends monthly data)
 */
export async function saveFinanceData(data: ImportedData): Promise<void> {
  const db = await openDatabase()

  // Get existing store or create new
  const existing = await getFinanceData()
  const monthlyData = existing?.monthlyData || []

  // Detect which month this data belongs to
  const detectedMonth = detectMonthFromData(data)

  // Check if we already have data for this month - if so, replace it
  const existingMonthIndex = monthlyData.findIndex(m => m.month === detectedMonth)

  const newMonthlyData: MonthlyFinanceData = {
    month: detectedMonth,
    data,
    uploadedAt: new Date().toISOString(),
  }

  if (existingMonthIndex >= 0) {
    // Replace existing month data
    monthlyData[existingMonthIndex] = newMonthlyData
  } else {
    // Add new month
    monthlyData.push(newMonthlyData)
  }

  // Sort by month descending (newest first)
  monthlyData.sort((a, b) => b.month.localeCompare(a.month))

  const financeStore: FinanceStore = {
    id: 'current',
    monthlyData,
    lastCalculated: new Date().toISOString(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(financeStore)

    request.onsuccess = () => {
      db.close()
      resolve()
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

/**
 * Retrieve stored financial data from IndexedDB
 */
export async function getFinanceData(): Promise<FinanceStore | null> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('current')

    request.onsuccess = () => {
      db.close()
      resolve(request.result || null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

/**
 * Delete all stored financial data
 */
export async function clearFinanceData(): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete('current')

    request.onsuccess = () => {
      db.close()
      resolve()
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

/**
 * Check if financial data exists in storage
 */
export async function hasFinanceData(): Promise<boolean> {
  const data = await getFinanceData()
  return data !== null
}

/**
 * Calculate dashboard metrics from imported data
 */
export function calculateMetrics(data: ImportedData): DashboardMetrics {
  // 1. Gross Sales from POS
  const grossSales = data.salesByDay.reduce((sum, day) => sum + day.total, 0)

  // 2. Calculate Uber Revenue from bank transactions
  const uberRevenue = data.bankTransactions
    .filter((tx) => tx.type === 'income' && tx.payee.toUpperCase().includes('UBER'))
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 2b. Calculate Delivereasy Revenue from bank transactions
  const delivereasyRevenue = data.bankTransactions
    .filter((tx) => tx.type === 'income' && tx.payee.toUpperCase().includes('DELIVEREASY'))
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 3. POS Revenue from bank transactions
  // HOT-MEXICAN account: "HOT LIKE A MEXICAN" (EFTPOS processing)
  // MEXI-CAN account: "MEXICAN QBT"
  const posRevenue = data.bankTransactions
    .filter((tx) =>
      tx.type === 'income' &&
      (tx.payee.toUpperCase().includes('HOT LIKE A MEXICAN') ||
       tx.payee.toUpperCase().includes('MEXICAN QBT'))
    )
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 4. Total Expenses from bank
  const totalExpenses = data.bankTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 5. Net Cash Flow (Income - Expenses)
  const totalIncome = data.bankTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const netCashFlow = totalIncome - totalExpenses

  // 6. Total Orders
  const totalOrders = data.salesByDay.reduce((sum, day) => sum + day.orders, 0)

  // 7. Average Order Value
  const averageOrderValue = totalOrders > 0 ? grossSales / totalOrders : 0

  // 8. Top Products (top 20 by revenue)
  const topProducts: ProductPerformance[] = data.salesByProduct
    .map((product) => ({
      product: product.product,
      quantity: product.quantity,
      revenue: product.total,
      percentOfSales: product.percentOfSale,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)

  // 9. Top Categories
  const topCategories: CategoryPerformance[] = data.salesByCategory
    .map((category) => ({
      category: category.category,
      quantity: category.quantity,
      revenue: category.total,
      percentOfSales: category.percentOfSale,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // 10. Peak Hours (top 10)
  const peakHours: PeakHours[] = data.salesByHour
    .filter((hour) => hour.orders > 0)
    .map((hour) => ({
      hour: hour.time,
      orders: hour.orders,
      revenue: hour.total,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // 11. Orders Per Day with 7-day moving average
  const ordersPerDay = data.salesByDay.map((day, index, arr) => {
    // Calculate 7-day moving average
    const start = Math.max(0, index - 6)
    const window = arr.slice(start, index + 1)
    const movingAverage = window.reduce((sum, d) => sum + d.orders, 0) / window.length

    return {
      date: day.date,
      orders: day.orders,
      movingAverage: parseFloat(movingAverage.toFixed(1)),
    }
  })

  // 12. Weekly Averages
  const daysInPeriod = data.salesByDay.length || 1
  const weeklyAverages = {
    dailyRevenue: grossSales / daysInPeriod,
    dailyOrders: totalOrders / daysInPeriod,
    avgOrderValue: averageOrderValue,
  }

  return {
    grossSales,
    netCashFlow,
    totalOrders,
    averageOrderValue,
    posRevenue,
    uberRevenue,
    delivereasyRevenue,
    totalExpenses,
    topProducts,
    topCategories,
    peakHours,
    ordersPerDay,
    weeklyAverages,
  }
}

/**
 * Filter data by date range
 */
export function filterByDateRange(
  data: ImportedData,
  startDate: Date | null,
  endDate: Date | null
): ImportedData {
  if (!startDate && !endDate) return data

  const isInRange = (dateStr: string): boolean => {
    // Parse date string (e.g., "Thu, 04 Dec" or "01/11/25")
    const date = parseDateString(dateStr)
    if (!date) return true // If can't parse, include it

    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    return true
  }

  return {
    ...data,
    salesByDay: data.salesByDay.filter((day) => isInRange(day.date)),
    salesByHour: data.salesByHour, // Keep all hours (they're aggregated)
    salesByCategory: data.salesByCategory, // Keep all (they're aggregated)
    salesByProduct: data.salesByProduct, // Keep all (they're aggregated)
    bankTransactions: data.bankTransactions.filter((tx) => isInRange(tx.date)),
    supplierPurchases: data.supplierPurchases.filter((purchase) =>
      isInRange(purchase.date)
    ),
  }
}

/**
 * Parse various date string formats
 */
function parseDateString(dateStr: string): Date | null {
  // Handle "Thu, 04 Dec" format
  if (dateStr.includes(',')) {
    const parts = dateStr.split(',')[1].trim().split(' ')
    if (parts.length >= 2) {
      const day = parseInt(parts[0])
      const monthStr = parts[1]
      const year = new Date().getFullYear() // Assume current year
      const monthMap: { [key: string]: number } = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      }
      const month = monthMap[monthStr]
      if (month !== undefined) {
        return new Date(year, month, day)
      }
    }
  }

  // Handle "01/11/25" format (DD/MM/YY)
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1
      const year = 2000 + parseInt(parts[2])
      return new Date(year, month, day)
    }
  }

  // Fallback: try standard Date parsing
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Get summary statistics for a specific date range
 */
export function getDateRangeSummary(
  data: ImportedData,
  startDate: Date | null,
  endDate: Date | null
): {
  dateRange: string
  totalDays: number
  totalRevenue: number
  averageDailyRevenue: number
  totalOrders: number
  averageDailyOrders: number
} {
  const filtered = filterByDateRange(data, startDate, endDate)
  const totalDays = filtered.salesByDay.length
  const totalRevenue = filtered.salesByDay.reduce((sum, day) => sum + day.total, 0)
  const totalOrders = filtered.salesByDay.reduce((sum, day) => sum + day.orders, 0)

  let dateRange = 'All Time'
  if (startDate && endDate) {
    dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
  } else if (startDate) {
    dateRange = `From ${startDate.toLocaleDateString()}`
  } else if (endDate) {
    dateRange = `Until ${endDate.toLocaleDateString()}`
  }

  return {
    dateRange,
    totalDays,
    totalRevenue,
    averageDailyRevenue: totalDays > 0 ? totalRevenue / totalDays : 0,
    totalOrders,
    averageDailyOrders: totalDays > 0 ? totalOrders / totalDays : 0,
  }
}

/**
 * Get combined data for selected months
 */
export function getCombinedDataForMonths(
  monthlyData: MonthlyFinanceData[],
  selectedMonths: string[]
): ImportedData {
  const combined: ImportedData = {
    salesByDay: [],
    salesByHour: [],
    salesByCategory: [],
    salesByProduct: [],
    bankTransactions: [],
    supplierPurchases: [],
    lastUpdated: new Date().toISOString(),
    dateRange: { start: '', end: '' },
  }

  // Filter and combine data from selected months
  const relevantMonths = monthlyData.filter(m => selectedMonths.includes(m.month))

  relevantMonths.forEach(monthData => {
    combined.salesByDay.push(...monthData.data.salesByDay)
    combined.salesByHour.push(...monthData.data.salesByHour)
    combined.salesByCategory.push(...monthData.data.salesByCategory)
    combined.salesByProduct.push(...monthData.data.salesByProduct)
    combined.bankTransactions.push(...monthData.data.bankTransactions)
    combined.supplierPurchases.push(...monthData.data.supplierPurchases)
  })

  // Sort sales by day
  combined.salesByDay.sort((a, b) => {
    const dateA = parseDateForSort(a.date)
    const dateB = parseDateForSort(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Set date range
  if (combined.salesByDay.length > 0) {
    combined.dateRange = {
      start: combined.salesByDay[0].date,
      end: combined.salesByDay[combined.salesByDay.length - 1].date,
    }
  }

  // Aggregate products and categories by summing
  combined.salesByProduct = aggregateProducts(combined.salesByProduct)
  combined.salesByCategory = aggregateCategories(combined.salesByCategory)

  return combined
}

/**
 * Parse date string for sorting
 */
function parseDateForSort(dateStr: string): Date {
  // Handle "Thu, 04 Dec" format
  const parts = dateStr.split(',')[1]?.trim().split(' ')
  if (parts && parts.length >= 2) {
    const day = parseInt(parts[0])
    const monthStr = parts[1]
    const year = new Date().getFullYear()
    const monthMap: { [key: string]: number } = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    }
    const month = monthMap[monthStr]
    if (month !== undefined) {
      return new Date(year, month, day)
    }
  }
  return new Date()
}

/**
 * Aggregate products from multiple months
 */
function aggregateProducts(products: any[]): any[] {
  const aggregated: { [key: string]: any } = {}

  products.forEach(product => {
    if (aggregated[product.product]) {
      aggregated[product.product].quantity += product.quantity
      aggregated[product.product].tax += product.tax
      aggregated[product.product].total += product.total
    } else {
      aggregated[product.product] = { ...product }
    }
  })

  // Recalculate percentages based on total
  const totalRevenue = Object.values(aggregated).reduce((sum: number, p: any) => sum + p.total, 0)
  Object.values(aggregated).forEach((p: any) => {
    p.percentOfSale = totalRevenue > 0 ? (p.total / totalRevenue) * 100 : 0
  })

  return Object.values(aggregated)
}

/**
 * Aggregate categories from multiple months
 */
function aggregateCategories(categories: any[]): any[] {
  const aggregated: { [key: string]: any } = {}

  categories.forEach(category => {
    if (aggregated[category.category]) {
      aggregated[category.category].quantity += category.quantity
      aggregated[category.category].tax += category.tax
      aggregated[category.category].total += category.total
    } else {
      aggregated[category.category] = { ...category }
    }
  })

  // Recalculate percentages based on total
  const totalRevenue = Object.values(aggregated).reduce((sum: number, c: any) => sum + c.total, 0)
  Object.values(aggregated).forEach((c: any) => {
    c.percentOfSale = totalRevenue > 0 ? (c.total / totalRevenue) * 100 : 0
  })

  return Object.values(aggregated)
}

/**
 * Get all available months from stored data
 */
export async function getAvailableMonths(): Promise<string[]> {
  const data = await getFinanceData()
  if (!data || !data.monthlyData) return []
  return data.monthlyData.map(m => m.month).sort((a, b) => b.localeCompare(a))
}

/**
 * Export data as JSON for backup/download
 */
export function exportToJSON(data: ImportedData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Import data from JSON backup
 */
export function importFromJSON(jsonString: string): ImportedData {
  return JSON.parse(jsonString) as ImportedData
}
