// Finance module types for Taquero

// POS Data Types (from Tabin CSV exports)

export interface SalesByProduct {
  product: string
  quantity: number
  tax: number
  total: number
  percentOfSale: number
}

export interface SalesByCategory {
  category: string
  quantity: number
  tax: number
  total: number
  percentOfSale: number
}

export interface SalesByHour {
  time: string // e.g., "11 AM", "12 PM"
  orders: number
  cash: number
  eftpos: number
  online: number
  onAccount: number
  uberEats: number
  menulog: number
  doordash: number
  delivereasy: number
  eftposSurcharge: number
  tax: number
  total: number
}

export interface SalesByDay {
  date: string // e.g., "Thu, 04 Dec"
  orders: number
  cash: number
  eftpos: number
  online: number
  onAccount: number
  uberEats: number
  menulog: number
  doordash: number
  delivereasy: number
  eftposSurcharge: number
  discounts: number
  refunds: number
  tax: number
  total: number
}

// Bank Statement Types

export interface BankTransaction {
  date: string // e.g., "01/11/25"
  amount: number
  payee: string
  type: 'income' | 'expense'
}

export interface SupplierPurchase {
  date: string
  supplier: string
  amount: number
}

// Aggregated Financial Data

export interface FinancialPeriod {
  startDate: string
  endDate: string
  revenue: number
  cogs: number // Cost of Goods Sold (from supplier purchases)
  grossProfit: number
  grossMargin: number // percentage
  totalOrders: number
  averageOrderValue: number
}

export interface ProductPerformance {
  product: string
  quantity: number
  revenue: number
  percentOfSales: number
}

export interface CategoryPerformance {
  category: string
  quantity: number
  revenue: number
  percentOfSales: number
}

export interface PeakHours {
  hour: string
  orders: number
  revenue: number
}

// Import/Upload Types

export interface CSVImportStatus {
  salesByDay: boolean
  salesByHour: boolean
  salesByCategory: boolean
  salesByProduct: boolean
  bankStatementRestaurant: boolean
  bankStatementCaravan: boolean
  bankStatementEcommerce: boolean
}

export interface ImportedData {
  salesByDay: SalesByDay[]
  salesByHour: SalesByHour[]
  salesByCategory: SalesByCategory[]
  salesByProduct: SalesByProduct[]
  bankTransactions: BankTransaction[]
  supplierPurchases: SupplierPurchase[]
  lastUpdated: string
  dateRange: {
    start: string
    end: string
  }
}

// Dashboard Metrics

export interface DashboardMetrics {
  grossSales: number
  netCashFlow: number
  totalOrders: number
  averageOrderValue: number
  posRevenue: number
  uberRevenue: number
  delivereasyRevenue: number
  totalExpenses: number
  topProducts: ProductPerformance[]
  topCategories: CategoryPerformance[]
  peakHours: PeakHours[]
  ordersPerDay: { date: string; orders: number; movingAverage?: number }[]
  weeklyAverages: {
    dailyRevenue: number
    dailyOrders: number
    avgOrderValue: number
  }
  healthScore: {
    score: number
    status: string
    emoji: string
    color: string
    insights: string[]
    breakdown: { metric: string; score: number; weight: number; actualValue: string; emoji: string }[]
  }
  comparisonMetrics?: {
    grossSalesChange: number
    netCashFlowChange: number
    ordersChange: number
    avgOrderValueChange: number
  }
}

// Date Range Filter

export interface DateRangeFilter {
  start: Date | null
  end: Date | null
}

// IndexedDB Storage Types

export interface FinanceStore {
  id: string // 'current' - single record
  monthlyData: MonthlyFinanceData[]
  currentDataset?: CompanyDataset // New: Single company dataset
  lastCalculated: string
}

export interface MonthlyFinanceData {
  month: string // Format: 'YYYY-MM' (e.g., '2024-12')
  data: ImportedData
  uploadedAt: string
}

export interface CompanyDataset {
  id: string
  data: ImportedData
  uploadedAt: string
  files: UploadedFileInfo[]
  stats: {
    totalTransactions: number
    totalRevenue: number
    datesCovered: number
  }
}

export interface UploadedFileInfo {
  name: string
  type: 'POS' | 'Bank'
  rows: number
}
