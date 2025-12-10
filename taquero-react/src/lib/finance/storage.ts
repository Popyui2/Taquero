// IndexedDB Storage for Finance Module
import type {
  ImportedData,
  DashboardMetrics,
  FinanceStore,
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
 * Save imported financial data to IndexedDB
 */
export async function saveFinanceData(data: ImportedData): Promise<void> {
  const db = await openDatabase()
  const metrics = calculateMetrics(data)

  const financeStore: FinanceStore = {
    id: 'current',
    data,
    metrics,
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
  // Calculate total revenue from sales by day
  const totalRevenue = data.salesByDay.reduce((sum, day) => sum + day.total, 0)

  // Calculate total COGS from supplier purchases
  const totalCOGS = data.supplierPurchases.reduce(
    (sum, purchase) => sum + purchase.amount,
    0
  )

  // Calculate gross profit and margin
  const grossProfit = totalRevenue - totalCOGS
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  // Calculate total orders
  const totalOrders = data.salesByDay.reduce((sum, day) => sum + day.orders, 0)

  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get top products (top 10 by revenue)
  const topProducts: ProductPerformance[] = data.salesByProduct
    .map((product) => ({
      product: product.product,
      quantity: product.quantity,
      revenue: product.total,
      percentOfSales: product.percentOfSale,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Get top categories (top 5 by revenue)
  const topCategories: CategoryPerformance[] = data.salesByCategory
    .map((category) => ({
      category: category.category,
      quantity: category.quantity,
      revenue: category.total,
      percentOfSales: category.percentOfSale,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Get peak hours (hours with orders, sorted by revenue)
  const peakHours: PeakHours[] = data.salesByHour
    .filter((hour) => hour.orders > 0)
    .map((hour) => ({
      hour: hour.time,
      orders: hour.orders,
      revenue: hour.total,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // Revenue by day for chart
  const revenueByDay = data.salesByDay.map((day) => ({
    date: day.date,
    revenue: day.total,
  }))

  return {
    totalRevenue,
    totalCOGS,
    grossProfit,
    grossMargin,
    totalOrders,
    averageOrderValue,
    topProducts,
    topCategories,
    peakHours,
    revenueByDay,
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
