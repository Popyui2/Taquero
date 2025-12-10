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
  bankStatement: boolean
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
  totalRevenue: number
  totalCOGS: number
  grossProfit: number
  grossMargin: number
  totalOrders: number
  averageOrderValue: number
  topProducts: ProductPerformance[]
  topCategories: CategoryPerformance[]
  peakHours: PeakHours[]
  revenueByDay: { date: string; revenue: number }[]
}

// Date Range Filter

export interface DateRangeFilter {
  start: Date | null
  end: Date | null
}

// IndexedDB Storage Types

export interface FinanceStore {
  id: string // 'current' - single record
  data: ImportedData
  metrics: DashboardMetrics
  lastCalculated: string
}
