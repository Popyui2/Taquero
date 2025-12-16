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
  CompanyDataset,
  UploadedFileInfo,
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
 * Calculate business health score (0-10)
 * Uses ONLY bank statement data to avoid issues with incomplete POS data
 */
function calculateHealthScore(params: {
  netCashFlow: number
  totalRevenue: number
  dailyRevenue: number
}): {
  score: number
  status: string
  emoji: string
  color: string
  insights: string[]
  breakdown: { metric: string; score: number; weight: number }[]
} {
  const { netCashFlow, totalRevenue, dailyRevenue } = params

  // 1. Profit Margin Score (40% weight) - Most critical
  // Based on actual NZ restaurant industry benchmarks
  const profitMargin = totalRevenue > 0 ? (netCashFlow / totalRevenue) * 100 : 0
  let profitScore = 0

  if (profitMargin < 0) {
    profitScore = 0 // Failed - negative margin
  } else if (profitMargin >= 12) {
    // 12%+: Excellent - well above industry (9-10 pts)
    profitScore = 9 + Math.min(1, (profitMargin - 12) / 8) // Reaches 10 at 20%+
  } else if (profitMargin >= 8) {
    // 8-12%: Good - industry standard (7-9 pts)
    profitScore = 7 + ((profitMargin - 8) / 4) * 2
  } else if (profitMargin >= 5) {
    // 5-8%: Fair - below average but viable (5-7 pts)
    profitScore = 5 + ((profitMargin - 5) / 3) * 2
  } else if (profitMargin >= 3) {
    // 3-5%: Concerning - struggling (3-5 pts)
    profitScore = 3 + ((profitMargin - 3) / 2) * 2
  } else {
    // 0-3%: Critical - barely surviving (0-3 pts)
    profitScore = (profitMargin / 3) * 3
  }

  // 2. Revenue Strength Score (35% weight)
  // Based on Hot Like A Mexican's actual performance targets (NZD)
  // More lenient scoring with $4,000+ as the ceiling for excellent days
  let revenueScore = 0
  if (dailyRevenue >= 4000) {
    revenueScore = 10 // Excellent/Legendary days! ($5,000+ are rare legendary days but same grade)
  } else if (dailyRevenue >= 3500) {
    // 3500-4000: Amazing (9-10 pts)
    revenueScore = 9 + ((dailyRevenue - 3500) / 500)
  } else if (dailyRevenue >= 3000) {
    // 3000-3500: Very Good (8-9 pts)
    revenueScore = 8 + ((dailyRevenue - 3000) / 500)
  } else if (dailyRevenue >= 2500) {
    // 2500-3000: Good (7-8 pts)
    revenueScore = 7 + ((dailyRevenue - 2500) / 500)
  } else if (dailyRevenue >= 2000) {
    // 2000-2500: Average (6-7 pts)
    revenueScore = 6 + ((dailyRevenue - 2000) / 500)
  } else if (dailyRevenue >= 1500) {
    // 1500-2000: Below Average (5-6 pts)
    revenueScore = 5 + ((dailyRevenue - 1500) / 500)
  } else if (dailyRevenue >= 1000) {
    // 1000-1500: Low (4-5 pts)
    revenueScore = 4 + ((dailyRevenue - 1000) / 500)
  } else if (dailyRevenue >= 600) {
    // 600-1000: Bad (3-4 pts)
    revenueScore = 3 + ((dailyRevenue - 600) / 400)
  } else {
    // 0-600: Failed (0-3 pts, scaled)
    revenueScore = (dailyRevenue / 600) * 3
  }

  // 3. Cash Flow Health Score (25% weight)
  // More granular scoring based on cash flow strength
  let cashFlowScore = 0
  const cashFlowRatio = totalRevenue > 0 ? (netCashFlow / totalRevenue) * 100 : 0

  if (netCashFlow > 0) {
    cashFlowScore = 6 // Base score for positive cash flow

    if (cashFlowRatio >= 15) {
      cashFlowScore += 4 // 10 pts total - Excellent
    } else if (cashFlowRatio >= 10) {
      cashFlowScore += 3 // 9 pts total - Great
    } else if (cashFlowRatio >= 8) {
      cashFlowScore += 2 // 8 pts total - Good
    } else if (cashFlowRatio >= 5) {
      cashFlowScore += 1 // 7 pts total - Satisfactory
    } else if (cashFlowRatio >= 2) {
      cashFlowScore += 0 // 6 pts total - Pass
    } else {
      cashFlowScore -= 1 // 5 pts total - Failed (barely positive, 0-2%)
    }
  } else {
    cashFlowScore = 0 // Negative cash flow is critical
  }

  // Calculate weighted final score (3 components only, using bank data)
  const finalScore =
    profitScore * 0.40 +
    revenueScore * 0.35 +
    cashFlowScore * 0.25

  // Map score (0-10) to emoji, status, and color (Mexican grading system)
  // 0-5 = Failed (eggplant to neutral), 6-10 = Passing (gradually happier)
  const scoreMapping = [
    { emoji: '🍆', status: 'Failed', color: 'text-red-700' },        // 0 - Eggplant
    { emoji: '😡', status: 'Failed', color: 'text-red-600' },        // 1 - Very angry
    { emoji: '😤', status: 'Failed', color: 'text-red-600' },        // 2 - Angry
    { emoji: '😠', status: 'Failed', color: 'text-red-500' },        // 3 - Angry
    { emoji: '😒', status: 'Failed', color: 'text-orange-600' },     // 4 - Unamused
    { emoji: '😑', status: 'Failed', color: 'text-orange-500' },     // 5 - Expressionless
    { emoji: '😐', status: 'Pass', color: 'text-yellow-600' },       // 6 - Neutral (barely passing)
    { emoji: '🙂', status: 'Satisfactory', color: 'text-yellow-500' }, // 7 - Slight smile
    { emoji: '😊', status: 'Good', color: 'text-lime-500' },         // 8 - Smiling (good)
    { emoji: '😄', status: 'Great', color: 'text-green-500' },       // 9 - Happy (great)
    { emoji: '🤩', status: 'Excellent', color: 'text-green-600' },   // 10 - Star-struck (excellent)
  ]

  // Round score and clamp to 0-10
  const roundedScore = Math.round(finalScore)
  const clampedScore = Math.max(0, Math.min(10, roundedScore))

  const { emoji, status, color } = scoreMapping[clampedScore]

  // Generate insights based on scores
  const insights: string[] = []

  if (profitScore >= 7) {
    insights.push(`✅ Strong profit margin (${profitMargin.toFixed(1)}%)`)
  } else if (profitScore >= 4) {
    insights.push(`⚠️ Profit margin needs improvement (${profitMargin.toFixed(1)}%)`)
  } else {
    insights.push(`🚨 Critical profit margin (${profitMargin.toFixed(1)}%)`)
  }

  if (netCashFlow > 0) {
    insights.push('✅ Positive cash flow')
  } else {
    insights.push('🚨 Negative cash flow')
  }

  if (revenueScore >= 7) {
    insights.push(`✅ Strong daily revenue ($${dailyRevenue.toFixed(0)}/day)`)
  } else if (revenueScore >= 4) {
    insights.push(`⚠️ Revenue below target ($${dailyRevenue.toFixed(0)}/day)`)
  } else {
    insights.push(`🚨 Low daily revenue ($${dailyRevenue.toFixed(0)}/day)`)
  }

  // Helper function to get emoji for a score
  const getEmojiForScore = (score: number): string => {
    const roundedScore = Math.round(score)
    const clampedScore = Math.max(0, Math.min(10, roundedScore))
    return scoreMapping[clampedScore].emoji
  }

  return {
    score: finalScore,
    status,
    emoji,
    color,
    insights: insights.slice(0, 3), // Max 3 insights
    breakdown: [
      {
        metric: 'Profit Margin',
        score: profitScore,
        weight: 40,
        actualValue: `${profitMargin >= 0 ? '' : '-'}${Math.abs(profitMargin).toFixed(1)}%`,
        emoji: getEmojiForScore(profitScore)
      },
      {
        metric: 'Revenue Strength',
        score: revenueScore,
        weight: 35,
        actualValue: `$${dailyRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/day`,
        emoji: getEmojiForScore(revenueScore)
      },
      {
        metric: 'Cash Flow Health',
        score: cashFlowScore,
        weight: 25,
        actualValue: `${netCashFlow >= 0 ? '+' : '-'}$${Math.abs(netCashFlow).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} (${cashFlowRatio >= 0 ? '' : '-'}${Math.abs(cashFlowRatio).toFixed(1)}%)`,
        emoji: getEmojiForScore(cashFlowScore)
      },
    ],
  }
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
  const posDaysInPeriod = data.salesByDay.length || 1
  const weeklyAverages = {
    dailyRevenue: grossSales / posDaysInPeriod,
    dailyOrders: totalOrders / posDaysInPeriod,
    avgOrderValue: averageOrderValue,
  }

  // 13. Business Health Score (using only bank statement data)
  const totalRevenue = posRevenue + uberRevenue + delivereasyRevenue

  // Calculate actual days in period from bank transaction dates
  let bankDaysInPeriod = 1
  if (data.bankTransactions.length > 0) {
    const dates = data.bankTransactions.map((tx) => {
      // Parse date format "DD/MM/YY" (e.g., "01/11/25")
      const [day, month, year] = tx.date.split('/')
      const fullYear = parseInt(year) >= 50 ? 1900 + parseInt(year) : 2000 + parseInt(year)
      return new Date(fullYear, parseInt(month) - 1, parseInt(day))
    })
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    bankDaysInPeriod = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }

  const bankDailyRevenue = totalRevenue / bankDaysInPeriod
  const healthScore = calculateHealthScore({
    netCashFlow,
    totalRevenue,
    dailyRevenue: bankDailyRevenue,
  })

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
    healthScore,
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

/**
 * Save company dataset (replaces existing dataset)
 */
export async function saveCompanyDataset(
  data: ImportedData,
  files: UploadedFileInfo[]
): Promise<void> {
  const db = await openDatabase()
  const existing = await getFinanceData()

  // Calculate stats
  const totalTransactions = data.salesByDay.length + data.bankTransactions.length
  const totalRevenue = data.salesByDay.reduce((sum, day) => sum + day.total, 0)
  const datesCovered = data.salesByDay.length

  const newDataset: CompanyDataset = {
    id: crypto.randomUUID(),
    data,
    uploadedAt: new Date().toISOString(),
    files,
    stats: {
      totalTransactions,
      totalRevenue,
      datesCovered,
    },
  }

  const financeStore: FinanceStore = {
    id: 'current',
    monthlyData: existing?.monthlyData || [],
    currentDataset: newDataset,
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
 * Get current company dataset
 */
export async function getCompanyDataset(): Promise<CompanyDataset | null> {
  const data = await getFinanceData()
  return data?.currentDataset || null
}

/**
 * Delete company dataset
 */
export async function deleteCompanyDataset(): Promise<void> {
  const db = await openDatabase()
  const existing = await getFinanceData()

  if (!existing) return

  const financeStore: FinanceStore = {
    id: 'current',
    monthlyData: existing.monthlyData || [],
    currentDataset: undefined,
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
 * Get company data (alias for compatibility)
 */
export async function getCombinedBusinessData(): Promise<ImportedData | null> {
  const dataset = await getCompanyDataset()
  return dataset?.data || null
}
