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
  BankTransaction,
} from '@/types/finance'
import {
  loadPayeeClassifications,
  getPayeeCategory,
  isExcludedCategory,
  isBusinessExpense,
  isCOGSCategory,
  getCategoryEmoji,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from './categories'
import payeeClassificationsCSV from './payee_classifications.csv?raw'

// Initialize classifications from embedded CSV
let classificationsLoaded = false

function ensureClassificationsLoaded() {
  if (!classificationsLoaded) {
    loadPayeeClassifications(payeeClassificationsCSV)
    classificationsLoaded = true
  }
}

/**
 * Apply category classifications to bank transactions
 */
export function applyClassifications(transactions: BankTransaction[]): BankTransaction[] {
  ensureClassificationsLoaded()

  return transactions.map(tx => {
    const category = getPayeeCategory(tx.payee)
    return {
      ...tx,
      category: category || EXPENSE_CATEGORIES.OTHER,
    }
  })
}

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
 * NEW ALGORITHM: Profit Gate + Bonus System
 * - If losing money (netCashFlow < 0): Max score is 5 (Failed)
 * - If profitable: Start at 6 (Pass) and add bonuses for margin, efficiency, revenue
 */
function calculateHealthScore(params: {
  netCashFlow: number
  totalRevenue: number
  dailyRevenue: number
  primeCost: number
}): {
  score: number
  status: string
  emoji: string
  color: string
  insights: string[]
  breakdown: { metric: string; score: number; weight: number; actualValue: string; emoji: string; bonusPoints?: number }[]
} {
  const { netCashFlow, totalRevenue, dailyRevenue, primeCost } = params

  // Score mapping (0-10)
  const scoreMapping = [
    { emoji: '🍆', status: 'Critical', color: 'text-red-700' },      // 0
    { emoji: '😡', status: 'Critical', color: 'text-red-600' },      // 1
    { emoji: '😤', status: 'Severe', color: 'text-red-600' },        // 2
    { emoji: '😠', status: 'Bad', color: 'text-red-500' },           // 3
    { emoji: '😒', status: 'Poor', color: 'text-orange-600' },       // 4
    { emoji: '😑', status: 'Barely Failed', color: 'text-orange-500' }, // 5
    { emoji: '😐', status: 'Pass', color: 'text-yellow-600' },       // 6
    { emoji: '🙂', status: 'Satisfactory', color: 'text-yellow-500' }, // 7
    { emoji: '😊', status: 'Good', color: 'text-lime-500' },         // 8
    { emoji: '😄', status: 'Great', color: 'text-green-500' },       // 9
    { emoji: '🤩', status: 'Excellent', color: 'text-green-600' },   // 10
  ]

  // Helper function to get emoji for a score
  const getEmojiForScore = (score: number): string => {
    const clampedScore = Math.max(0, Math.min(10, Math.round(score)))
    return scoreMapping[clampedScore].emoji
  }

  // Avoid division by zero
  if (totalRevenue <= 0) {
    return {
      score: 0,
      status: 'No Data',
      emoji: '🍆',
      color: 'text-red-700',
      insights: ['🚨 No revenue data'],
      breakdown: []
    }
  }

  // Calculate key metrics
  const profitMargin = (netCashFlow / totalRevenue) * 100
  const primeCostPercent = (primeCost / totalRevenue) * 100
  const lossRatio = netCashFlow < 0 ? Math.abs(netCashFlow) / totalRevenue : 0

  // ========== PROFIT GATE: NEGATIVE = MAX 5 (Failed) ==========
  if (netCashFlow < 0) {
    let finalScore: number
    let gateStatus: string

    if (lossRatio > 0.20) {
      finalScore = 0
      gateStatus = 'Critical'
    } else if (lossRatio > 0.15) {
      finalScore = 1
      gateStatus = 'Critical'
    } else if (lossRatio > 0.10) {
      finalScore = 2
      gateStatus = 'Severe'
    } else if (lossRatio > 0.05) {
      finalScore = 3
      gateStatus = 'Bad'
    } else if (lossRatio > 0.02) {
      finalScore = 4
      gateStatus = 'Poor'
    } else {
      finalScore = 5
      gateStatus = 'Barely Failed'
    }

    const { emoji, color } = scoreMapping[finalScore]

    // Insights for loss months
    const insights: string[] = [
      `🚨 Lost ${(lossRatio * 100).toFixed(1)}% of revenue`,
      `🚨 Net loss: -$${Math.abs(netCashFlow).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    ]
    if (primeCostPercent > 80) {
      insights.push(`⚠️ High operational costs (${primeCostPercent.toFixed(1)}%)`)
    }

    return {
      score: finalScore,
      status: gateStatus,
      emoji,
      color,
      insights: insights.slice(0, 3),
      breakdown: [
        {
          metric: 'Profit/Loss',
          score: finalScore,
          weight: 100,
          actualValue: `-${(lossRatio * 100).toFixed(1)}% (lost money)`,
          emoji: getEmojiForScore(finalScore)
        },
        {
          metric: 'Operational Costs',
          score: primeCostPercent <= 70 ? 8 : primeCostPercent <= 80 ? 5 : 2,
          weight: 0,
          actualValue: `${primeCostPercent.toFixed(1)}%`,
          emoji: getEmojiForScore(primeCostPercent <= 70 ? 8 : primeCostPercent <= 80 ? 5 : 2)
        },
        {
          metric: 'Daily Revenue',
          score: dailyRevenue >= 3000 ? 8 : dailyRevenue >= 2000 ? 6 : 4,
          weight: 0,
          actualValue: `$${dailyRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/day`,
          emoji: getEmojiForScore(dailyRevenue >= 3000 ? 8 : dailyRevenue >= 2000 ? 6 : 4)
        },
      ],
    }
  }

  // ========== PROFITABLE: CALCULATE 6-10 ==========
  let finalScore = 6 // Break-even baseline (Pass)

  // Profit Margin Bonus (max +2.5 points) - 62.5% of available bonus
  let marginBonus = 0
  if (profitMargin >= 15) {
    marginBonus = 2.5
  } else if (profitMargin >= 10) {
    marginBonus = 2.0
  } else if (profitMargin >= 7) {
    marginBonus = 1.5
  } else if (profitMargin >= 5) {
    marginBonus = 1.0
  } else if (profitMargin >= 2) {
    marginBonus = 0.5
  }
  finalScore += marginBonus

  // Operational Costs Bonus (max +1.0 points) - 25% of available bonus
  // Stricter thresholds since this includes Food + Supplies + Labor + Rent + Taxes
  let opCostBonus = 0
  if (primeCostPercent <= 65) {
    opCostBonus = 1.0      // Exceptional - very lean operation
  } else if (primeCostPercent <= 70) {
    opCostBonus = 0.7      // Excellent - well managed
  } else if (primeCostPercent <= 75) {
    opCostBonus = 0.4      // Good - industry standard
  } else if (primeCostPercent <= 80) {
    opCostBonus = 0.2      // Acceptable - room for improvement
  }
  // Over 80% = no bonus
  finalScore += opCostBonus

  // Revenue Strength Bonus (max +0.5 points) - 12.5% of available bonus
  // Uses Hot Like A Mexican's actual business targets (NZD)
  let revenueBonus = 0
  if (dailyRevenue >= 4000) {
    revenueBonus = 0.5       // Excellent - $5,000+ is legendary!
  } else if (dailyRevenue >= 3500) {
    revenueBonus = 0.45      // Great - amazing day
  } else if (dailyRevenue >= 3000) {
    revenueBonus = 0.4       // Good - very good day
  } else if (dailyRevenue >= 2500) {
    revenueBonus = 0.3       // Satisfactory - solid day
  } else if (dailyRevenue >= 2000) {
    revenueBonus = 0.2       // Pass - average day
  } else if (dailyRevenue >= 1500) {
    revenueBonus = 0.1       // Below average
  }
  // Under $1,500 = no bonus
  finalScore += revenueBonus

  // Cap at 10 and round to 1 decimal
  finalScore = Math.min(10, Math.round(finalScore * 10) / 10)
  const roundedScore = Math.round(finalScore)
  const clampedScore = Math.max(0, Math.min(10, roundedScore))

  const { emoji, status, color } = scoreMapping[clampedScore]

  // Generate insights for profitable months
  const insights: string[] = []

  if (profitMargin >= 10) {
    insights.push(`✅ Strong profit margin (${profitMargin.toFixed(1)}%)`)
  } else if (profitMargin >= 5) {
    insights.push(`✅ Healthy profit margin (${profitMargin.toFixed(1)}%)`)
  } else if (profitMargin >= 0) {
    insights.push(`⚠️ Thin profit margin (${profitMargin.toFixed(1)}%)`)
  }

  if (primeCostPercent <= 70) {
    insights.push(`✅ Efficient operations (${primeCostPercent.toFixed(1)}% op costs)`)
  } else if (primeCostPercent <= 80) {
    insights.push(`⚠️ Operational costs could improve (${primeCostPercent.toFixed(1)}%)`)
  } else {
    insights.push(`🚨 High operational costs (${primeCostPercent.toFixed(1)}%)`)
  }

  if (dailyRevenue >= 3500) {
    insights.push(`✅ Strong daily revenue ($${dailyRevenue.toFixed(0)}/day)`)
  } else if (dailyRevenue >= 2500) {
    insights.push(`✅ Solid daily revenue ($${dailyRevenue.toFixed(0)}/day)`)
  } else if (dailyRevenue >= 2000) {
    insights.push(`⚠️ Moderate daily revenue ($${dailyRevenue.toFixed(0)}/day)`)
  } else if (dailyRevenue >= 1500) {
    insights.push(`⚠️ Below average revenue ($${dailyRevenue.toFixed(0)}/day)`)
  } else {
    insights.push(`🚨 Low daily revenue ($${dailyRevenue.toFixed(0)}/day)`)
  }

  // Calculate individual scores for breakdown display
  const marginScore = 6 + marginBonus * (4 / 2.5) // Scale to 6-10
  const opCostScore = opCostBonus > 0 ? 6 + opCostBonus * (4 / 1.0) : 5

  // Revenue score uses original benchmarks (0-10 scale)
  let revenueScore: number
  if (dailyRevenue >= 4000) revenueScore = 10
  else if (dailyRevenue >= 3500) revenueScore = 9
  else if (dailyRevenue >= 3000) revenueScore = 8
  else if (dailyRevenue >= 2500) revenueScore = 7
  else if (dailyRevenue >= 2000) revenueScore = 6
  else if (dailyRevenue >= 1500) revenueScore = 5
  else if (dailyRevenue >= 1000) revenueScore = 4
  else if (dailyRevenue >= 600) revenueScore = 3
  else if (dailyRevenue >= 300) revenueScore = 2
  else if (dailyRevenue > 0) revenueScore = 1
  else revenueScore = 0

  return {
    score: finalScore,
    status,
    emoji,
    color,
    insights: insights.slice(0, 3),
    breakdown: [
      {
        metric: 'Profit Margin',
        score: Math.min(10, marginScore),
        weight: 63,
        actualValue: `+${profitMargin.toFixed(1)}%`,
        emoji: getEmojiForScore(marginScore),
        bonusPoints: marginBonus
      },
      {
        metric: 'Operational Costs',
        score: Math.min(10, opCostScore),
        weight: 25,
        actualValue: `${primeCostPercent.toFixed(1)}%`,
        emoji: getEmojiForScore(opCostScore),
        bonusPoints: opCostBonus
      },
      {
        metric: 'Daily Revenue',
        score: Math.min(10, revenueScore),
        weight: 12,
        actualValue: `$${dailyRevenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/day`,
        emoji: getEmojiForScore(revenueScore),
        bonusPoints: revenueBonus
      },
    ],
  }
}

/**
 * Calculate dashboard metrics from imported data
 */
export function calculateMetrics(data: ImportedData): DashboardMetrics {
  // Apply classifications to bank transactions first
  const classifiedTransactions = applyClassifications(data.bankTransactions)

  // 1. Gross Sales from POS
  const grossSales = data.salesByDay.reduce((sum, day) => sum + day.total, 0)

  // 2. Calculate Uber Revenue from bank transactions
  const uberRevenue = classifiedTransactions
    .filter((tx) => tx.type === 'income' && tx.payee.toUpperCase().includes('UBER'))
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 2b. Calculate Delivereasy Revenue from bank transactions
  const delivereasyRevenue = classifiedTransactions
    .filter((tx) => tx.type === 'income' && tx.payee.toUpperCase().includes('DELIVEREASY'))
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 3. POS Revenue from bank transactions
  // HOT-MEXICAN account: "HOT LIKE A MEXICAN" (EFTPOS processing)
  // MEXI-CAN account: "MEXICAN QBT"
  const posRevenue = classifiedTransactions
    .filter((tx) =>
      tx.type === 'income' &&
      (tx.payee.toUpperCase().includes('HOT LIKE A MEXICAN') ||
       tx.payee.toUpperCase().includes('MEXICAN QBT'))
    )
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 4. Calculate expenses by category (using classifications)
  // Total ALL expenses (for display)
  const totalExpenses = classifiedTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Business expenses ONLY (excluding Personal and Internal Transfer)
  const businessExpenses = classifiedTransactions
    .filter((tx) => {
      if (tx.type !== 'expense') return false
      const category = tx.category as ExpenseCategory
      return isBusinessExpense(category)
    })
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Excluded expenses (Personal + Internal Transfer)
  const excludedExpenses = classifiedTransactions
    .filter((tx) => {
      if (tx.type !== 'expense') return false
      const category = tx.category as ExpenseCategory
      return isExcludedCategory(category)
    })
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Operational Costs = Food Supplies + Supplies + Labor/Payroll + Rent + Taxes/Govt
  // This is the key restaurant profitability metric (target: 65-75% of revenue)
  const primeCost = classifiedTransactions
    .filter((tx) => {
      if (tx.type !== 'expense') return false
      const category = tx.category as ExpenseCategory
      return category === EXPENSE_CATEGORIES.FOOD_SUPPLIES ||
             category === EXPENSE_CATEGORIES.SUPPLIES ||
             category === EXPENSE_CATEGORIES.LABOR_PAYROLL ||
             category === EXPENSE_CATEGORIES.RENT_LEASE ||
             category === EXPENSE_CATEGORIES.LICENSES_COMPLIANCE
    })
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Calculate expenses by category for breakdown
  const expensesByCategory = new Map<string, number>()
  classifiedTransactions
    .filter((tx) => tx.type === 'expense' && isBusinessExpense(tx.category as ExpenseCategory))
    .forEach((tx) => {
      const category = tx.category || EXPENSE_CATEGORIES.OTHER
      expensesByCategory.set(category, (expensesByCategory.get(category) || 0) + tx.amount)
    })

  // 5. Net Cash Flow (Revenue - Business Expenses only)
  // This gives TRUE business profitability
  const totalIncome = classifiedTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  // For display: raw cash flow (all income - all expenses)
  const rawNetCashFlow = totalIncome - totalExpenses

  // For profit calculation: business cash flow (income - business expenses only)
  const businessNetCashFlow = totalIncome - businessExpenses

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

  // 12. Calculate days in period from bank transaction dates (used for averages)
  // Use totalIncome (all bank income) for consistency with businessNetCashFlow calculation
  const totalRevenue = totalIncome

  let bankDaysInPeriod = 1
  if (classifiedTransactions.length > 0) {
    const dates = classifiedTransactions.map((tx) => {
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

  // 13. Weekly Averages - use bank-based revenue (includes all income sources)
  const posDaysInPeriod = data.salesByDay.length || 1
  const weeklyAverages = {
    dailyRevenue: bankDailyRevenue, // Use bank-based daily revenue (all income sources)
    dailyOrders: totalOrders / posDaysInPeriod,
    avgOrderValue: averageOrderValue,
  }

  // 14. Business Health Score (using only bank statement data)
  // Now using BUSINESS expenses only (excluding Personal & Internal Transfer)

  // Use BUSINESS net cash flow for health score (excludes personal expenses)
  const healthScore = calculateHealthScore({
    netCashFlow: businessNetCashFlow,
    totalRevenue,
    dailyRevenue: bankDailyRevenue,
    primeCost,
  })

  // 14. Build expenses by category breakdown for UI
  const sortedExpenses = Array.from(expensesByCategory.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: businessExpenses > 0 ? (amount / businessExpenses) * 100 : 0,
      emoji: getCategoryEmoji(category as ExpenseCategory),
    }))
    .sort((a, b) => b.amount - a.amount)

  // 15. Top expenses (individual transactions, business only)
  const topExpenses = classifiedTransactions
    .filter((tx) => tx.type === 'expense' && isBusinessExpense(tx.category as ExpenseCategory))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((tx) => ({
      payee: tx.payee,
      category: tx.category || EXPENSE_CATEGORIES.OTHER,
      amount: tx.amount,
    }))

  return {
    grossSales,
    netCashFlow: rawNetCashFlow, // Display raw cash flow (includes personal)
    totalOrders,
    averageOrderValue,
    posRevenue,
    uberRevenue,
    delivereasyRevenue,
    totalExpenses, // Total ALL expenses (for display)
    expensesByCategory: sortedExpenses,
    topExpenses,
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
