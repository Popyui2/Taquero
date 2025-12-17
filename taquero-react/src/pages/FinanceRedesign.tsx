import { useState, useEffect } from 'react'
import { Upload, TrendingUp, TrendingDown, DollarSign, Utensils, ShoppingBag, ShoppingCart, Loader2, Sparkles, Bot, Copy, Check, Calendar as CalendarIcon, ChevronDown, ChevronUp, HelpCircle, ListFilter, ArrowUpDown, Save, Drumstick, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { ImportedData, MonthlyFinanceData, CompanyDataset } from '@/types/finance'
import type { DateRange } from 'react-day-picker'
import { getFinanceData, calculateMetrics, getCombinedDataForMonths, getAvailableMonths, getCombinedBusinessData, getCompanyDataset, filterByDateRange, applyClassifications } from '@/lib/finance/storage'
import { getCategoryEmoji, EXPENSE_CATEGORIES, PAYEE_CLASSIFICATIONS, type ExpenseCategory } from '@/lib/finance/categories'
import payeeClassificationsCSV from '@/lib/finance/payee_classifications.csv?raw'
import { format, subDays, subWeeks, subMonths, startOfQuarter, endOfQuarter } from 'date-fns'
import { UploadFinanceWizard } from '@/components/finance/UploadFinanceWizard'
import { TopProductsGallery } from '@/components/finance/TopProductsGallery'
import { FinanceChartsRedesign } from '@/components/finance/FinanceChartsRedesign'

export function FinanceRedesign() {
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyFinanceData[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedPeriod] = useState<string>('all-time')
  const [showUploadWizard, setShowUploadWizard] = useState(false)
  const [showAIExportDialog, setShowAIExportDialog] = useState(false)

  // Global date filter
  const [globalFilter, setGlobalFilter] = useState<'all-time' | 'last-day' | 'last-week' | 'last-month' | 'last-quarter' | 'quarter' | 'custom'>('all-time')
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [quarterDropdownOpen, setQuarterDropdownOpen] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState<string>('') // Format: "Q1-2024"

  // AI Export state
  const [aiExportDateRange, setAiExportDateRange] = useState<DateRange | undefined>()
  const [generatedReport, setGeneratedReport] = useState<string>('')
  const [reportCopied, setReportCopied] = useState(false)

  // Health Score Explanation Dialog
  const [showHealthScoreDialog, setShowHealthScoreDialog] = useState(false)
  const [dataSourcesExpanded, setDataSourcesExpanded] = useState(false)
  const [componentDetailsExpanded, setComponentDetailsExpanded] = useState(false)
  const [scoringLogicExpanded, setScoringLogicExpanded] = useState(false)
  const [gradingIconsExpanded, setGradingIconsExpanded] = useState(false)

  // Transaction Classifications Dialog
  const [showClassificationsDialog, setShowClassificationsDialog] = useState(false)
  const [classificationSort, setClassificationSort] = useState<{ field: 'name' | 'date' | 'type' | 'category' | 'total'; direction: 'asc' | 'desc' }>({ field: 'total', direction: 'desc' })

  // Category Detail Dialog (for Important Transactions)
  const [showCategoryDetailDialog, setShowCategoryDetailDialog] = useState(false)
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string | null>(null)
  const [categoryDetailSort, setCategoryDetailSort] = useState<{ field: 'date' | 'payee' | 'amount'; direction: 'asc' | 'desc' }>({ field: 'amount', direction: 'desc' })
  const [editingPayee, setEditingPayee] = useState<string | null>(null)
  const [expandedPayee, setExpandedPayee] = useState<string | null>(null)
  const [userCategoryOverrides, setUserCategoryOverrides] = useState<Record<string, ExpenseCategory>>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('taquero-category-overrides')
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    loadFinanceData()
  }, [])

  // Reset AI export state when dialog closes
  useEffect(() => {
    if (!showAIExportDialog) {
      setAiExportDateRange(undefined)
      setGeneratedReport('')
      setReportCopied(false)
    }
  }, [showAIExportDialog])

  const loadFinanceData = async () => {
    setIsLoading(true)
    try {
      // Load combined business data
      const data = await getCombinedBusinessData()
      setCombinedData(data)

      // Load company dataset (includes file info)
      const dataset = await getCompanyDataset()
      setCompanyDataset(dataset)

      // Still load monthly data for backward compatibility (can be removed later)
      const stored = await getFinanceData()
      if (stored && stored.monthlyData) {
        setMonthlyData(stored.monthlyData)
        const months = stored.monthlyData.map(m => m.month).sort((a, b) => b.localeCompare(a))
        setAvailableMonths(months)

        // Auto-select all months by default (All Time)
        if (months.length > 0 && selectedMonths.length === 0) {
          setSelectedMonths(months)
        }
      }
    } catch (err) {
      console.error('Error loading finance data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Get combined data from all business datasets (Hot-Mexican + MEXI-CAN)
  const [combinedData, setCombinedData] = useState<ImportedData | null>(null)
  const [companyDataset, setCompanyDataset] = useState<CompanyDataset | null>(null)

  // Use combined business data, fallback to monthly data for backward compatibility
  const rawImportedData = combinedData || (selectedMonths.length > 0 && monthlyData.length > 0
    ? getCombinedDataForMonths(monthlyData, selectedMonths)
    : null)

  // Apply global filter to get filtered data
  const getFilteredData = (): ImportedData | null => {
    if (!rawImportedData) return null

    // Calculate date range based on global filter
    let startDate: Date | null = null
    let endDate: Date | null = new Date() // Today

    switch (globalFilter) {
      case 'last-day':
        startDate = subDays(new Date(), 1)
        break
      case 'last-week':
        startDate = subWeeks(new Date(), 1)
        break
      case 'last-month':
        startDate = subMonths(new Date(), 1)
        break
      case 'last-quarter':
        const currentQuarter = startOfQuarter(new Date())
        startDate = subMonths(currentQuarter, 3)
        endDate = endOfQuarter(subMonths(new Date(), 3))
        break
      case 'quarter':
        if (selectedQuarter) {
          // Parse "Q1-2024" format
          const [qStr, yearStr] = selectedQuarter.split('-')
          const quarter = parseInt(qStr.replace('Q', ''))
          const year = parseInt(yearStr)

          // Calculate start and end of quarter
          const startMonth = (quarter - 1) * 3
          startDate = new Date(year, startMonth, 1)
          endDate = new Date(year, startMonth + 3, 0) // Last day of quarter
        } else {
          startDate = null
          endDate = null
        }
        break
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          startDate = customDateRange.from
          endDate = customDateRange.to
        } else {
          // If custom range not set, show all time
          startDate = null
          endDate = null
        }
        break
      case 'all-time':
      default:
        startDate = null
        endDate = null
        break
    }

    return filterByDateRange(rawImportedData, startDate, endDate)
  }

  // Get filtered data for cards (affected by global filter)
  const filteredData = getFilteredData()

  // Use raw data for Net Cash Flow chart (not affected by global filter)
  const importedData = rawImportedData

  const metrics = filteredData ? calculateMetrics(filteredData) : null

  // Get formatted date range string for current filter
  const getFilterDateRangeString = (): string => {
    if (!filteredData?.dateRange.start || !filteredData?.dateRange.end) return ''

    switch (globalFilter) {
      case 'quarter':
        if (selectedQuarter) {
          // For quarters, show like "Q3 2023"
          return selectedQuarter.replace('-', ' ')
        }
        break
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          const startMonth = format(customDateRange.from, 'MMM')
          const startYear = format(customDateRange.from, 'yyyy')
          const endMonth = format(customDateRange.to, 'MMM')
          const endYear = format(customDateRange.to, 'yyyy')

          if (startYear === endYear) {
            return `${startMonth} — ${endMonth} ${startYear}`
          }
          return `${startMonth} ${startYear} — ${endMonth} ${endYear}`
        }
        break
    }

    // For all other cases (all-time, last-day, etc), use the actual data range
    const start = filteredData.dateRange.start
    const end = filteredData.dateRange.end

    // Extract month and year from "Thu, 27 Jul" format
    const startParts = start.split(' ')
    const endParts = end.split(' ')

    const startMonth = startParts[2] || startParts[1]
    const endMonth = endParts[2] || endParts[1]

    // Get years from first and last transaction
    const firstTx = rawImportedData?.bankTransactions?.[0]
    const lastTx = rawImportedData?.bankTransactions?.[rawImportedData.bankTransactions.length - 1]

    let startYear = '2023'
    let endYear = '2025'

    if (firstTx?.date) {
      const parts = firstTx.date.split('/')
      if (parts.length === 3) {
        let year = parseInt(parts[2])
        if (year < 100) year += 2000
        startYear = year.toString()
      }
    }

    if (lastTx?.date) {
      const parts = lastTx.date.split('/')
      if (parts.length === 3) {
        let year = parseInt(parts[2])
        if (year < 100) year += 2000
        endYear = year.toString()
      }
    }

    return `${startMonth} ${startYear} — ${endMonth} ${endYear}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading Financial Data...</span>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getFilterLabel = () => {
    switch (globalFilter) {
      case 'last-day': return 'Last Day'
      case 'last-week': return 'Last Week'
      case 'last-month': return 'Last Month'
      case 'last-quarter': return 'Last Quarter'
      case 'quarter': return selectedQuarter || 'Select Quarter'
      case 'custom': return customDateRange?.from && customDateRange?.to
        ? `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d, yyyy')}`
        : 'Custom Range'
      case 'all-time':
      default: return 'All Time'
    }
  }

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setCustomDateRange(range)
    if (range?.from && range?.to) {
      setGlobalFilter('custom')
      setCalendarOpen(false)
    }
  }

  // Get available quarters from data
  const getAvailableQuarters = (): string[] => {
    if (!rawImportedData) return []

    // Parse date in DD/MM/YY format
    const parseDate = (dateStr: string): Date | null => {
      const parts = dateStr.split('/')
      if (parts.length !== 3) return null

      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1 // JS months are 0-indexed
      let year = parseInt(parts[2])

      // Convert 2-digit year to 4-digit (23 -> 2023)
      if (year < 100) {
        year += 2000
      }

      return new Date(year, month, day)
    }

    // Get min/max dates from actual transactions
    let minDate: Date | null = null
    let maxDate: Date | null = null

    // Check bank transactions
    if (rawImportedData.bankTransactions && Array.isArray(rawImportedData.bankTransactions)) {
      rawImportedData.bankTransactions.forEach(tx => {
        if (tx.date) {
          const date = parseDate(tx.date)
          if (date) {
            if (!minDate || date < minDate) minDate = date
            if (!maxDate || date > maxDate) maxDate = date
          }
        }
      })
    }

    if (!minDate || !maxDate) return []

    console.log('Date range found:', minDate.toLocaleDateString(), 'to', maxDate.toLocaleDateString())

    const quarters: string[] = []

    // Start from the quarter of the start date
    let currentDate = new Date(minDate.getFullYear(), Math.floor(minDate.getMonth() / 3) * 3, 1)

    while (currentDate <= maxDate) {
      const year = currentDate.getFullYear()
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1
      quarters.push(`Q${quarter}-${year}`)

      // Move to next quarter
      currentDate.setMonth(currentDate.getMonth() + 3)
    }

    console.log('Generated quarters:', quarters)
    return quarters.reverse() // Most recent first
  }

  const handleQuarterSelect = (quarterStr: string) => {
    setSelectedQuarter(quarterStr)
    setGlobalFilter('quarter')
  }

  const generateAIReport = () => {
    if (!aiExportDateRange?.from || !aiExportDateRange?.to || !rawImportedData) {
      return
    }

    // Filter data based on selected date range
    const reportData = filterByDateRange(rawImportedData, aiExportDateRange.from, aiExportDateRange.to)
    const reportMetrics = calculateMetrics(reportData)

    // Calculate days in period
    const daysDiff = Math.ceil((aiExportDateRange.to.getTime() - aiExportDateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Get top 10 products
    const top10Products = reportMetrics.topProducts.slice(0, 10)
    const bottom10Products = reportMetrics.topProducts.slice(-10).reverse()

    // Calculate expense categories from bank transactions
    const expensesByCategory = new Map<string, number>()
    reportData.bankTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        const category = tx.payee || 'Other'
        expensesByCategory.set(category, (expensesByCategory.get(category) || 0) + tx.amount)
      }
    })

    const totalRevenue = reportMetrics.posRevenue + reportMetrics.uberRevenue + reportMetrics.delivereasyRevenue
    const totalExpenses = Array.from(expensesByCategory.values()).reduce((sum, amt) => sum + amt, 0)
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0
    const cashFlowRatio = totalRevenue > 0 ? (reportMetrics.netCashFlow / totalRevenue * 100) : 0

    const topExpenseCategories = Array.from(expensesByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Channel performance
    const posPercentage = totalRevenue > 0 ? (reportMetrics.posRevenue / totalRevenue * 100) : 0
    const uberPercentage = totalRevenue > 0 ? (reportMetrics.uberRevenue / totalRevenue * 100) : 0
    const delivereasyPercentage = totalRevenue > 0 ? (reportMetrics.delivereasyRevenue / totalRevenue * 100) : 0

    // Generate comprehensive report
    const report = `# Comprehensive Financial Analysis for Hot Like A Mexican
**Analysis Period:** ${format(aiExportDateRange.from, 'MMM d, yyyy')} - ${format(aiExportDateRange.to, 'MMM d, yyyy')} (${daysDiff} days)
**Business:** Mexi-Can Limited, Wellington, New Zealand
**Type:** Mexican Restaurant (Dine-in, Takeaway, Delivery)
**Established:** July 27, 2023

---

## BUSINESS CONTEXT & ANALYSIS INSTRUCTIONS

You are analyzing financial data for Hot Like A Mexican, a Mexican restaurant in Wellington, NZ. This business:
- Operates dine-in, takeaway, and delivery services
- Uses multiple revenue channels: In-store POS, Uber Eats, and Delivereasy
- Sells Mexican food products (tacos, burritos, quesadillas, nachos, etc.)
- Currency: All amounts in NZD (New Zealand Dollars)

**Your task is to provide:**
1. **Deep financial health analysis** comparing against NZ restaurant industry benchmarks
2. **Actionable insights** with specific recommendations (not generic advice)
3. **Product performance analysis** identifying winners and losers
4. **Operational efficiency recommendations** based on the data patterns
5. **Growth opportunities** with concrete next steps
6. **Risk identification** highlighting any concerning trends

---

## FINANCIAL PERFORMANCE SUMMARY

### Revenue Overview
- **Total Revenue:** ${formatCurrency(totalRevenue)}
- **Daily Average Revenue:** ${formatCurrency(reportMetrics.weeklyAverages.dailyRevenue)}
- **Net Cash Flow:** ${formatCurrency(reportMetrics.netCashFlow)} (${cashFlowRatio >= 0 ? '+' : ''}${cashFlowRatio.toFixed(1)}% of revenue)
- **Profit Margin:** ${profitMargin >= 0 ? '+' : ''}${profitMargin.toFixed(1)}%

### Revenue Channels
1. **In-Store POS:** ${formatCurrency(reportMetrics.posRevenue)} (${posPercentage.toFixed(1)}%)
2. **Uber Eats:** ${formatCurrency(reportMetrics.uberRevenue)} (${uberPercentage.toFixed(1)}%)
3. **Delivereasy:** ${formatCurrency(reportMetrics.delivereasyRevenue)} (${delivereasyPercentage.toFixed(1)}%)

### Order Metrics
- **Total Orders:** ${reportMetrics.totalOrders.toLocaleString()}
- **Average Order Value:** ${formatCurrency(reportMetrics.averageOrderValue)}
- **Daily Average Orders:** ${reportMetrics.weeklyAverages.dailyOrders.toFixed(0)}
- **Revenue Per Order:** ${formatCurrency(totalRevenue / reportMetrics.totalOrders)}

---

## EXPENSE ANALYSIS

**Total Expenses:** ${formatCurrency(totalExpenses)} (${totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0'}% of revenue)

### Top 10 Expense Categories (by amount)
${topExpenseCategories.map(([cat, amt], i) => `${i + 1}. **${cat}:** ${formatCurrency(amt)} (${totalRevenue > 0 ? ((amt / totalRevenue) * 100).toFixed(1) : '0'}% of revenue)`).join('\n')}

---

## PRODUCT PERFORMANCE ANALYSIS

### Top 10 Best-Selling Products
${top10Products.map((p, i) => `${i + 1}. **${p.product}**
   - Revenue: ${formatCurrency(p.revenue)} (${p.percentOfSales.toFixed(1)}% of total sales)
   - Units Sold: ${p.quantity}
   - Revenue Per Unit: ${formatCurrency(p.revenue / p.quantity)}`).join('\n\n')}

### Bottom 10 Products (Poorest Performance)
${bottom10Products.length > 0 ? bottom10Products.map((p, i) => `${i + 1}. **${p.product}**
   - Revenue: ${formatCurrency(p.revenue)} (${p.percentOfSales.toFixed(1)}% of sales)
   - Units Sold: ${p.quantity}
   - Revenue Per Unit: ${formatCurrency(p.revenue / p.quantity)}`).join('\n\n') : 'Not enough product data'}

---

## DETAILED ANALYSIS QUESTIONS

Please provide comprehensive, data-driven answers to these questions:

### 1. Financial Health Assessment
- How does the ${profitMargin.toFixed(1)}% profit margin compare to the 8-12% NZ restaurant benchmark?
- Is the ${cashFlowRatio.toFixed(1)}% cash flow ratio healthy or concerning?
- Are we profitable, breaking even, or losing money? What's the severity?
- What specific financial metrics are red flags that need immediate attention?

### 2. Revenue Channel Performance
- Which revenue channel (POS ${posPercentage.toFixed(0)}%, Uber ${uberPercentage.toFixed(0)}%, Delivereasy ${delivereasyPercentage.toFixed(0)}%) is performing best?
- Should we invest more in any particular channel? Why?
- Are delivery platforms (Uber/Delivereasy at ${(uberPercentage + delivereasyPercentage).toFixed(0)}% combined) cannibalizing in-store revenue or expanding our market?
- What's the optimal channel mix for maximizing profit?

### 3. Product Strategy
- Which top-performing products should we promote more aggressively?
- Which bottom-performing products should we consider removing from the menu?
- Are there any products with surprisingly low sales despite good revenue potential?
- Should we introduce product bundles or combo deals? Which products should be bundled?

### 4. Pricing Strategy
- Is our $${reportMetrics.averageOrderValue.toFixed(2)} average order value competitive for Wellington?
- Which products appear underpriced (high volume, low revenue share)?
- Which products appear overpriced (low volume despite being signature items)?
- Should we implement dynamic pricing or promotional discounts? On which products?

### 5. Operational Efficiency
- Are there expense categories that seem abnormally high compared to industry standards?
- What percentage of revenue should ideally go to each major expense category?
- Are there opportunities to reduce costs without sacrificing quality?
- Which expenses give the best ROI and should be maintained or increased?

### 6. Growth Opportunities
- Based on the ${formatCurrency(reportMetrics.weeklyAverages.dailyRevenue)}/day average, what's a realistic revenue growth target?
- Should we focus on increasing order frequency, average order value, or customer acquisition?
- Are there untapped revenue streams we should consider (catering, events, alcohol, etc.)?
- What specific marketing initiatives would have the highest impact?

### 7. Risk Analysis
- What are the top 3 financial risks this business faces based on this data?
- Are there any dependency risks (too reliant on one channel, product, or customer segment)?
- How vulnerable is the business to economic downturns or seasonal fluctuations?
- What contingency plans should be in place?

### 8. Actionable Recommendations
Please provide 5-7 specific, prioritized action items we should implement in the next:
- **This Week:** Immediate quick wins
- **This Month:** Short-term improvements
- **This Quarter:** Strategic initiatives

For each recommendation, explain:
- What to do specifically
- Why it matters (expected impact)
- How to measure success

---

## ADDITIONAL DATA NOTES

- This report covers ${daysDiff} days of operations
- All currency amounts are in NZD
- Expense categorization is based on transaction payees
- Product data includes items from all sales channels
- Industry benchmarks are for NZ casual dining restaurants

Please provide a thorough, honest analysis that will help drive business improvement.`

    setGeneratedReport(report)
  }

  const copyReportToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport)
      setReportCopied(true)
      setTimeout(() => setReportCopied(false), 2000)
    } catch (err) {
      alert('Failed to copy to clipboard. Please try copying manually.')
    }
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Financial and Product Data</h2>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={() => setShowAIExportDialog(true)}
            variant="outline"
            className="h-12 px-4 min-h-[48px]"
            title="Export for AI Analysis"
          >
            <Bot className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            onClick={() => setShowUploadWizard(true)}
            className="h-12 px-6 min-h-[48px] flex-1 sm:flex-initial"
          >
            <Upload className="h-5 w-5 mr-2" />
            Manage Financial Data
          </Button>
        </div>
      </div>

      {/* Global Date Filter Bar */}
      {metrics && (
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Viewing:</span>
                </div>

                {/* Period Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
                      {getFilterLabel()}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setGlobalFilter('last-day')}>
                      Last Day
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGlobalFilter('last-week')}>
                      Last Week
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGlobalFilter('last-month')}>
                      Last Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGlobalFilter('last-quarter')}>
                      Last Quarter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGlobalFilter('all-time')}>
                      All Time
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Quarter Selector */}
                {getAvailableQuarters().length > 0 && (
                  <DropdownMenu open={quarterDropdownOpen} onOpenChange={(open) => {
                    setQuarterDropdownOpen(open)
                    if (open) setCalendarOpen(false)
                  }}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Quarter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                      {getAvailableQuarters().map((quarter) => (
                        <DropdownMenuItem
                          key={quarter}
                          onClick={() => handleQuarterSelect(quarter)}
                          className={selectedQuarter === quarter ? 'bg-accent' : ''}
                        >
                          {quarter}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Custom Date Range Picker */}
                <Popover open={calendarOpen} onOpenChange={(open) => {
                  setCalendarOpen(open)
                  if (open) setQuarterDropdownOpen(false)
                }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Custom Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                    <Calendar
                      mode="range"
                      selectedRange={customDateRange}
                      onRangeSelect={handleCustomDateSelect}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range Display + Transaction Categories */}
              <div className="hidden sm:flex items-center gap-2">
                {filteredData?.dateRange.start && filteredData?.dateRange.end && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {getFilterDateRangeString()}
                    </span>
                  </div>
                )}

                {filteredData && filteredData.bankTransactions.length > 0 && (
                  <button
                    onClick={() => setShowClassificationsDialog(true)}
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent h-9 w-9 rounded-md"
                    title="Transaction Categories"
                  >
                    <Drumstick className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {metrics ? (
        <>
          {/* Revenue Sources */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Revenue Sources</CardTitle>
              <CardDescription>Total: {formatCurrency(metrics.posRevenue + metrics.uberRevenue + metrics.delivereasyRevenue)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* POS Sales */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Utensils className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">POS Sales</p>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.posRevenue)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {((metrics.posRevenue / (metrics.posRevenue + metrics.uberRevenue + metrics.delivereasyRevenue)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(metrics.posRevenue / (metrics.posRevenue + metrics.uberRevenue + metrics.delivereasyRevenue)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Uber Eats Revenue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Uber Eats</p>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.uberRevenue)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {((metrics.uberRevenue / (metrics.posRevenue + metrics.uberRevenue + metrics.delivereasyRevenue)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${(metrics.uberRevenue / (metrics.posRevenue + metrics.uberRevenue + metrics.delivereasyRevenue)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Delivereasy Revenue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f2f542' }}>
                        <ShoppingBag className="h-6 w-6 text-gray-900" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Delivereasy</p>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.delivereasyRevenue)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {((metrics.delivereasyRevenue / (metrics.posRevenue + metrics.uberRevenue + metrics.delivereasyRevenue)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${(metrics.delivereasyRevenue / (metrics.posRevenue + metrics.uberRevenue + metrics.delivereasyRevenue)) * 100}%`, backgroundColor: '#f2f542' }}
                    />
                  </div>
                </div>

                {/* eCommerce and Catering Revenue */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">eCommerce and Catering</p>
                        <p className="text-2xl font-bold">To be implemented</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      0.0%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Period Averages + Business Health Score */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Sales Information */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Sales Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-6">
                {/* Net Cash Flow - Hero Card */}
                <div className={`rounded-xl p-4 ${metrics.netCashFlow < 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${metrics.netCashFlow < 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                        {metrics.netCashFlow < 0 ? (
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
                        <div className="flex items-baseline gap-2">
                          <p className={`text-2xl font-bold ${metrics.netCashFlow < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {formatCurrency(metrics.netCashFlow)}
                          </p>
                          <span className={`text-sm font-medium ${metrics.netCashFlow < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ({metrics.grossSales > 0 ? ((metrics.netCashFlow / metrics.grossSales) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    {metrics.comparisonMetrics && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${metrics.comparisonMetrics.netCashFlowChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {metrics.comparisonMetrics.netCashFlowChange >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatPercentage(metrics.comparisonMetrics.netCashFlowChange)}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${metrics.netCashFlow < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {metrics.netCashFlow < 0 ? 'Expenses exceeded income this period' : 'Income exceeded expenses this period'}
                  </p>
                </div>

                {/* Restaurant Sales Data */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-4">Restaurant Sales Data</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gross Sales */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Gross Sales</p>
                          <p className="text-lg font-bold truncate">{formatCurrency(metrics.grossSales)}</p>
                        </div>
                      </div>
                      {metrics.comparisonMetrics && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${metrics.comparisonMetrics.grossSalesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.comparisonMetrics.grossSalesChange >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {formatPercentage(metrics.comparisonMetrics.grossSalesChange)}
                        </div>
                      )}
                    </div>
                    {/* Total Orders */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                          <ShoppingCart className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Total Orders</p>
                          <p className="text-lg font-bold truncate">{metrics.totalOrders.toLocaleString()}</p>
                        </div>
                      </div>
                      {metrics.comparisonMetrics && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${metrics.comparisonMetrics.ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.comparisonMetrics.ordersChange >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {formatPercentage(metrics.comparisonMetrics.ordersChange)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50" />

                {/* Period Averages */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-4">Period Averages</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Avg Daily Revenue */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Avg Daily Revenue</p>
                        <p className="text-lg font-bold">
                          ${metrics.weeklyAverages.dailyRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {/* Avg Daily Orders */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <ShoppingCart className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Avg Daily Orders</p>
                        <p className="text-lg font-bold">
                          {metrics.weeklyAverages.dailyOrders.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* Avg Order Value */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Avg Order Value</p>
                        <p className="text-lg font-bold">
                          ${metrics.weeklyAverages.avgOrderValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Health Score */}
            <Card className="overflow-hidden lg:w-[320px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">EmojiScore</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowHealthScoreDialog(true)}
                    title="How is this calculated?"
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center space-y-4">
                  {/* Large emoji */}
                  <div className="text-7xl leading-none">{metrics.healthScore.emoji}</div>

                  {/* Score */}
                  <div>
                    <div className={`text-5xl font-bold ${metrics.healthScore.color}`}>
                      {metrics.healthScore.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">/10</div>
                  </div>

                  {/* Status badge */}
                  <Badge
                    variant="outline"
                    className={`text-base px-4 py-1 ${metrics.healthScore.color} border-current`}
                  >
                    {metrics.healthScore.status}
                  </Badge>

                  {/* Key insights */}
                  <div className="pt-2 space-y-2 text-left text-sm border-t">
                    {metrics.healthScore.insights.map((insight, idx) => (
                      <p key={idx} className="leading-tight">{insight}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Transactions - All Categories */}
          {metrics.expensesByCategory && metrics.expensesByCategory.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Important Transactions</CardTitle>
                <CardDescription>Expense breakdown by category for this period</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {metrics.expensesByCategory.map((cat) => (
                    <button
                      key={cat.category}
                      onClick={() => {
                        setSelectedExpenseCategory(cat.category)
                        setShowCategoryDetailDialog(true)
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer text-left"
                    >
                      <div className="text-2xl">{cat.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">{cat.category}</p>
                        <p className="text-sm font-bold">{formatCurrency(cat.amount)}</p>
                        <p className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* NET CASH FLOW - HERO CHART (PC Optimized) */}
          <div className="w-full">
            <FinanceChartsRedesign
              metrics={metrics}
              data={importedData}
              selectedPeriod={selectedPeriod}
              heroOnly={true}
            />
          </div>

          {/* TOP PRODUCTS - HERO SECTION */}
          <TopProductsGallery products={metrics.topProducts} />

          {/* Other Charts (Peak Hours, Category Performance) */}
          <FinanceChartsRedesign
            metrics={metrics}
            data={importedData}
            selectedPeriod={selectedPeriod}
            heroOnly={false}
          />
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Financial Data</h3>
            <p className="text-muted-foreground mb-6">
              Upload your CSV files to start analyzing your financial performance
            </p>
            <Button size="lg" onClick={() => setShowUploadWizard(true)}>
              <Upload className="h-5 w-5 mr-2" />
              Upload CSV Files
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Wizard */}
      <UploadFinanceWizard
        isOpen={showUploadWizard}
        onClose={() => setShowUploadWizard(false)}
        onSuccess={loadFinanceData}
        existingData={importedData}
      />

      {/* AI Export Dialog */}
      <Dialog open={showAIExportDialog} onOpenChange={setShowAIExportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Data for AI Analysis</DialogTitle>
            <DialogDescription className="text-sm">
              Select a date range to generate a comprehensive business analysis report for AI system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-1">
            {/* Date Range Picker and Generate Button - Same Row */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 min-w-0 space-y-1.5">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {aiExportDateRange?.from && aiExportDateRange?.to
                          ? `${format(aiExportDateRange.from, 'MMM d, yyyy')} - ${format(aiExportDateRange.to, 'MMM d, yyyy')}`
                          : 'Pick a date range'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selectedRange={aiExportDateRange}
                      onRangeSelect={setAiExportDateRange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={generateAIReport}
                disabled={!aiExportDateRange?.from || !aiExportDateRange?.to}
                size="sm"
                className="whitespace-nowrap h-9 flex-shrink-0"
              >
                <Bot className="h-4 w-4 mr-1" />
                Generate
              </Button>
            </div>

            {/* Generated Report */}
            {generatedReport && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Generated Report</label>
                  <Button
                    onClick={copyReportToClipboard}
                    size="sm"
                    variant="ghost"
                    className="h-7 flex-shrink-0"
                  >
                    {reportCopied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-2 bg-muted rounded-md overflow-x-auto overflow-y-auto text-xs leading-relaxed h-40 border font-mono break-all whitespace-pre-wrap">
                  {generatedReport}
                </pre>
              </div>
            )}

            {!generatedReport && aiExportDateRange?.from && aiExportDateRange?.to && (
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "Generate Report" to create your AI analysis prompt</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Classifications Dialog */}
      <Dialog open={showClassificationsDialog} onOpenChange={(open) => {
        setShowClassificationsDialog(open)
        if (!open) setEditingPayee(null)
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">Transaction Categories</DialogTitle>
              {Object.keys(userCategoryOverrides).length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent h-9 rounded-md px-3 gap-2"
                    title="Copy updated CSV to clipboard - then paste into src/lib/finance/payee_classifications.csv"
                    onClick={async () => {
                      // Parse the original CSV line by line and only update lines with overrides
                      const lines = payeeClassificationsCSV.trim().split('\n')
                      const updatedLines: string[] = []

                      for (let i = 0; i < lines.length; i++) {
                        const line = lines[i]

                        // Keep header as-is
                        if (i === 0) {
                          updatedLines.push(line)
                          continue
                        }

                        // Skip empty lines
                        if (!line.trim()) continue

                        // Parse the line to get payee name (handles quoted fields)
                        let payee = ''
                        if (line.startsWith('"')) {
                          // Quoted payee name
                          const endQuote = line.indexOf('"', 1)
                          payee = line.substring(1, endQuote)
                        } else {
                          // Unquoted payee name
                          payee = line.split(',')[0]
                        }

                        // Check if this payee has a user override
                        const override = userCategoryOverrides[payee]
                        if (override) {
                          // Parse remaining fields
                          const parts = line.split(',')
                          const payeePart = line.startsWith('"')
                            ? `"${payee}"`
                            : payee
                          // Keep confidence from original, clear user correction
                          const confidence = parts[parts.length - 1] || 'High'
                          updatedLines.push(`${payeePart},${override},,${confidence}`)
                        } else {
                          // Keep original line unchanged
                          updatedLines.push(line)
                        }
                      }

                      const csvContent = updatedLines.join('\n')

                      // Copy to clipboard instead of download
                      try {
                        await navigator.clipboard.writeText(csvContent)
                        alert(`CSV copied to clipboard! (${Object.keys(userCategoryOverrides).length} changes)\n\nPaste it into:\nsrc/lib/finance/payee_classifications.csv\n\nThen click the X button to clear modifications.`)
                      } catch (err) {
                        // Fallback: download file
                        const blob = new Blob([csvContent], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'payee_classifications.csv'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        alert('CSV downloaded! Replace src/lib/finance/payee_classifications.csv with the downloaded file.\n\nThen click the X button to clear modifications.')
                      }
                      // DO NOT clear localStorage here - user must manually clear after confirming save
                    }}
                  >
                    <Save className="h-4 w-4" />
                    <span>{Object.keys(userCategoryOverrides).length} changes</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground hover:border-destructive h-9 w-9 rounded-md"
                    title="Clear all modifications (cannot be undone!)"
                    onClick={() => {
                      if (confirm(`Clear ${Object.keys(userCategoryOverrides).length} modifications? This cannot be undone!`)) {
                        setUserCategoryOverrides({})
                        localStorage.removeItem('taquero-category-overrides')
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <DialogDescription>
              {(() => {
                if (!filteredData) return 'No transactions'
                const classified = applyClassifications(filteredData.bankTransactions)
                const uniquePayees = new Map<string, typeof classified[0]>()
                classified.forEach(tx => {
                  if (!uniquePayees.has(tx.payee)) {
                    // Apply user override if exists
                    const category = userCategoryOverrides[tx.payee] || tx.category
                    uniquePayees.set(tx.payee, { ...tx, category })
                  }
                })
                return `Showing ${uniquePayees.size} unique payees (click emoji to edit category)`
              })()}
            </DialogDescription>
          </DialogHeader>

          {/* Sortable Headers */}
          <div className="flex items-center gap-3 px-2 py-2 border-b bg-muted/30 rounded-t-lg text-sm font-medium">
            <button
              onClick={() => setClassificationSort(prev => ({
                field: 'category',
                direction: prev.field === 'category' && prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className="w-10 flex items-center justify-center gap-1 hover:text-primary transition-colors"
              title="Sort by Category"
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setClassificationSort(prev => ({
                field: 'name',
                direction: prev.field === 'name' && prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className={`flex-1 flex items-center gap-1 hover:text-primary transition-colors ${classificationSort.field === 'name' ? 'text-primary' : ''}`}
            >
              Name <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setClassificationSort(prev => ({
                field: 'type',
                direction: prev.field === 'type' && prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className={`w-16 flex items-center gap-1 hover:text-primary transition-colors ${classificationSort.field === 'type' ? 'text-primary' : ''}`}
            >
              Type <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setClassificationSort(prev => ({
                field: 'total',
                direction: prev.field === 'total' && prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className={`w-24 flex items-center justify-end gap-1 hover:text-primary transition-colors ${classificationSort.field === 'total' ? 'text-primary' : ''}`}
            >
              Total <ArrowUpDown className="h-3 w-3" />
            </button>
            <span className="w-16 text-center text-muted-foreground text-xs">Modified</span>
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {filteredData && filteredData.bankTransactions.length > 0 ? (
              <div className="space-y-1">
                {(() => {
                  const classified = applyClassifications(filteredData.bankTransactions)

                  // Deduplicate by payee and aggregate amounts, but also store individual transactions
                  const payeeAggregates = new Map<string, {
                    payee: string
                    category: ExpenseCategory
                    type: 'income' | 'expense'
                    totalAmount: number
                    count: number
                    lastDate: string
                    transactions: typeof classified
                  }>()

                  classified.forEach(tx => {
                    const existing = payeeAggregates.get(tx.payee)
                    const category = (userCategoryOverrides[tx.payee] || tx.category) as ExpenseCategory
                    if (existing) {
                      existing.totalAmount += tx.amount
                      existing.count += 1
                      existing.transactions.push({ ...tx, category })
                      // Keep latest date
                      if (tx.date > existing.lastDate) existing.lastDate = tx.date
                    } else {
                      payeeAggregates.set(tx.payee, {
                        payee: tx.payee,
                        category,
                        type: tx.type as 'income' | 'expense',
                        totalAmount: tx.amount,
                        count: 1,
                        lastDate: tx.date,
                        transactions: [{ ...tx, category }]
                      })
                    }
                  })

                  // Convert to array and sort
                  let sortedPayees = Array.from(payeeAggregates.values())

                  sortedPayees.sort((a, b) => {
                    const dir = classificationSort.direction === 'asc' ? 1 : -1
                    switch (classificationSort.field) {
                      case 'name':
                        return a.payee.localeCompare(b.payee) * dir
                      case 'date':
                        return a.lastDate.localeCompare(b.lastDate) * dir
                      case 'type':
                        return a.type.localeCompare(b.type) * dir
                      case 'category':
                        return a.category.localeCompare(b.category) * dir
                      case 'total':
                        return (a.totalAmount - b.totalAmount) * dir
                      default:
                        return 0
                    }
                  })

                  return sortedPayees.map((item) => (
                    <div key={item.payee} className="border-b border-muted/30 last:border-0">
                      <div
                        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${item.count > 1 ? 'cursor-pointer' : ''} ${expandedPayee === item.payee ? 'bg-muted/30' : ''}`}
                        onClick={() => item.count > 1 && setExpandedPayee(expandedPayee === item.payee ? null : item.payee)}
                      >
                        {/* Category Emoji - Clickable for editing */}
                        <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                          {editingPayee === item.payee ? (
                            <DropdownMenu open={true} onOpenChange={(open) => !open && setEditingPayee(null)}>
                              <DropdownMenuTrigger asChild>
                                <button className="text-2xl w-10 text-center bg-primary/10 rounded-lg p-1 ring-2 ring-primary">
                                  {getCategoryEmoji(item.category)}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
                                {Object.values(EXPENSE_CATEGORIES).map((cat) => (
                                  <DropdownMenuItem
                                    key={cat}
                                    onClick={() => {
                                      const newOverrides = { ...userCategoryOverrides, [item.payee]: cat as ExpenseCategory }
                                      setUserCategoryOverrides(newOverrides)
                                      localStorage.setItem('taquero-category-overrides', JSON.stringify(newOverrides))
                                      setEditingPayee(null)
                                    }}
                                    className={item.category === cat ? 'bg-accent' : ''}
                                  >
                                    <span className="text-xl mr-2">{getCategoryEmoji(cat as ExpenseCategory)}</span>
                                    {cat}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <button
                              onClick={() => setEditingPayee(item.payee)}
                              className="text-2xl w-10 text-center hover:bg-primary/10 rounded-lg p-1 transition-colors cursor-pointer"
                              title="Click to change category"
                            >
                              {getCategoryEmoji(item.category)}
                            </button>
                          )}
                        </div>

                        {/* Payee Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{item.payee}</p>
                            {item.count > 1 && (
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedPayee === item.payee ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.category} {item.count > 1 && <span className="text-primary">({item.count} transactions)</span>}
                          </p>
                        </div>

                        {/* Income/Expense Badge */}
                        <Badge
                          variant="outline"
                          className={item.type === 'income'
                            ? 'text-green-500 border-green-500/50 w-14 justify-center'
                            : 'text-red-500 border-red-500/50 w-14 justify-center'
                          }
                        >
                          {item.type === 'income' ? 'IN' : 'OUT'}
                        </Badge>

                        {/* Total Amount */}
                        <span className={`text-sm font-bold w-24 text-right ${
                          item.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}${item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>

                        {/* Modified Indicator */}
                        <div className="w-16 flex justify-center">
                          {userCategoryOverrides[item.payee] ? (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 text-amber-500 border-amber-500/50">
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Transactions */}
                      {expandedPayee === item.payee && item.count > 1 && (
                        <div className="ml-12 mr-2 mb-2 bg-muted/20 rounded-lg border border-muted/40">
                          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-muted/40 text-xs font-medium text-muted-foreground">
                            <span className="w-20">Date</span>
                            <span className="flex-1">Details</span>
                            <span className="w-14 text-center">Type</span>
                            <span className="w-24 text-right">Amount</span>
                          </div>
                          {item.transactions
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .map((tx, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-3 py-2 border-b border-muted/20 last:border-0 text-sm">
                              <span className="text-xs text-muted-foreground w-20">{tx.date}</span>
                              <span className="flex-1 truncate text-xs">{tx.payee}</span>
                              <Badge
                                variant="outline"
                                className={`${tx.type === 'income'
                                  ? 'text-green-500 border-green-500/50'
                                  : 'text-red-500 border-red-500/50'
                                } w-14 justify-center text-xs py-0`}
                              >
                                {tx.type === 'income' ? 'IN' : 'OUT'}
                              </Badge>
                              <span className={`text-sm font-medium w-24 text-right ${
                                tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                              }`}>
                                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                })()}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <ListFilter className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions to display</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Detail Dialog (Important Transactions) */}
      <Dialog open={showCategoryDetailDialog} onOpenChange={(open) => {
        setShowCategoryDetailDialog(open)
        if (!open) setSelectedExpenseCategory(null)
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedExpenseCategory && metrics?.expensesByCategory && (
                <>
                  <span className="text-2xl">{metrics.expensesByCategory.find(c => c.category === selectedExpenseCategory)?.emoji}</span>
                  <span>{selectedExpenseCategory}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                if (!filteredData || !selectedExpenseCategory) return 'No transactions'
                const classified = applyClassifications(filteredData.bankTransactions)
                const categoryTransactions = classified.filter(tx => {
                  const txCategory = userCategoryOverrides[tx.payee] || tx.category
                  return txCategory === selectedExpenseCategory
                })
                const total = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0)
                return `${categoryTransactions.length} transaction${categoryTransactions.length !== 1 ? 's' : ''} totaling ${formatCurrency(total)}`
              })()}
            </DialogDescription>
          </DialogHeader>

          {/* Sortable Headers */}
          <div className="flex items-center gap-3 px-2 py-2 border-b bg-muted/30 rounded-t-lg text-sm font-medium">
            <button
              onClick={() => setCategoryDetailSort(prev => ({
                field: 'date',
                direction: prev.field === 'date' && prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className={`w-24 flex items-center gap-1 hover:text-primary transition-colors ${categoryDetailSort.field === 'date' ? 'text-primary' : ''}`}
            >
              Date <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setCategoryDetailSort(prev => ({
                field: 'payee',
                direction: prev.field === 'payee' && prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className={`flex-1 flex items-center gap-1 hover:text-primary transition-colors ${categoryDetailSort.field === 'payee' ? 'text-primary' : ''}`}
            >
              Payee <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setCategoryDetailSort(prev => ({
                field: 'amount',
                direction: prev.field === 'amount' && prev.direction === 'asc' ? 'desc' : 'asc'
              }))}
              className={`w-28 flex items-center justify-end gap-1 hover:text-primary transition-colors ${categoryDetailSort.field === 'amount' ? 'text-primary' : ''}`}
            >
              Amount <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {filteredData && selectedExpenseCategory ? (
              <div className="space-y-1">
                {(() => {
                  const classified = applyClassifications(filteredData.bankTransactions)
                  const categoryTransactions = classified.filter(tx => {
                    const txCategory = userCategoryOverrides[tx.payee] || tx.category
                    return txCategory === selectedExpenseCategory
                  })

                  // Sort transactions
                  const sorted = [...categoryTransactions].sort((a, b) => {
                    const dir = categoryDetailSort.direction === 'asc' ? 1 : -1
                    switch (categoryDetailSort.field) {
                      case 'date':
                        // Parse DD/MM/YY format for sorting
                        const parseDate = (d: string) => {
                          const parts = d.split('/')
                          if (parts.length !== 3) return 0
                          const day = parseInt(parts[0])
                          const month = parseInt(parts[1]) - 1
                          let year = parseInt(parts[2])
                          if (year < 100) year += 2000
                          return new Date(year, month, day).getTime()
                        }
                        return (parseDate(a.date) - parseDate(b.date)) * dir
                      case 'payee':
                        return a.payee.localeCompare(b.payee) * dir
                      case 'amount':
                        return (a.amount - b.amount) * dir
                      default:
                        return 0
                    }
                  })

                  if (sorted.length === 0) {
                    return (
                      <div className="p-12 text-center text-muted-foreground">
                        <ListFilter className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No transactions in this category</p>
                      </div>
                    )
                  }

                  return sorted.map((tx, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors border-b border-muted/20 last:border-0"
                    >
                      {/* Date */}
                      <span className="text-sm text-muted-foreground w-24">{tx.date}</span>

                      {/* Payee */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.payee}</p>
                      </div>

                      {/* Amount */}
                      <span className={`text-sm font-bold w-28 text-right ${
                        tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                })()}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <ListFilter className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions to display</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Health Score Explanation Dialog */}
      <Dialog open={showHealthScoreDialog} onOpenChange={setShowHealthScoreDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">EmojiScore Explanation</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Score Display */}
            {metrics && (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Your Current Score</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{metrics.healthScore.emoji}</span>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl font-bold ${metrics.healthScore.color}`}>
                        {metrics.healthScore.score.toFixed(1)}/10
                      </p>
                      <Badge variant="outline" className={`${metrics.healthScore.color} border-current`}>
                        {metrics.healthScore.status}
                      </Badge>
                    </div>
                  </div>
                  {metrics.healthScore.insights && metrics.healthScore.insights.length > 0 && (() => {
                    const topInsight = metrics.healthScore.insights.find(i => i.startsWith('🚨')) ||
                                      metrics.healthScore.insights.find(i => i.startsWith('⚠️')) ||
                                      metrics.healthScore.insights[0]
                    return (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                        <span className="text-sm font-semibold text-primary">{topInsight}</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            {metrics && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="font-semibold text-sm">Score Breakdown</h3>
                  {/* Date Range Badge */}
                  {filteredData?.dateRange.start && filteredData?.dateRange.end && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {getFilterDateRangeString()}
                      </span>
                    </div>
                  )}
                </div>
                {metrics.healthScore.breakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="font-medium">{item.metric}</div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                          <span className="text-xs font-medium text-primary">{item.actualValue}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {item.score.toFixed(0)}<span className="text-sm text-muted-foreground">/10</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(item.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Component Explanations - Collapsible */}
            <div className="border rounded-lg bg-primary/5">
              <button
                onClick={() => setComponentDetailsExpanded(!componentDetailsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors rounded-lg"
              >
                <h3 className="font-semibold text-sm text-primary">How is EmojiScore calculated</h3>
                {componentDetailsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </button>
              {componentDetailsExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Scoring Logic - Collapsible */}
                  <div className="border rounded-lg bg-muted/30">
                    <button
                      onClick={() => setScoringLogicExpanded(!scoringLogicExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      <h4 className="font-medium text-sm">Scoring Logic</h4>
                      {scoringLogicExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {scoringLogicExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Profit Gate */}
                        <div className="space-y-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                          <h5 className="font-medium text-xs text-red-400">The Profit Gate (Losing Money)</h5>
                          <p className="text-xs text-muted-foreground">
                            If you're losing money, max score is 5. Score based on loss severity:
                          </p>
                          <div className="text-xs space-y-0.5">
                            <p>• Lost 0-2% = 5 pts (😑) • Lost 2-5% = 4 pts (😒)</p>
                            <p>• Lost 5-10% = 3 pts (😠) • Lost 10-15% = 2 pts (😤)</p>
                            <p>• Lost 15-20% = 1 pt (😡) • Lost 20%+ = 0 pts (🍆)</p>
                          </div>
                        </div>
                        {/* Bonus System */}
                        <div className="space-y-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <h5 className="font-medium text-xs text-green-400">Bonus System (Profitable Months)</h5>
                          <p className="text-xs text-muted-foreground">
                            If you made money, start at 6 (Pass) and earn bonuses up to 10 based on margin, costs, and revenue.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profit Margin */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">1. Profit Margin</h4>
                      <Badge variant="outline">63% weight</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your profit as a percentage of revenue. This is the most important metric for profitable months - it shows how much you're actually keeping.
                    </p>
                    <div className="text-xs space-y-1 pt-2 border-t">
                      <p>• 15%+ margin = +2.5 pts (🤩 Outstanding)</p>
                      <p>• 10-15% margin = +2.0 pts (😄 Excellent)</p>
                      <p>• 7-10% margin = +1.5 pts (😊 Great)</p>
                      <p>• 5-7% margin = +1.0 pts (🙂 Good)</p>
                      <p>• 2-5% margin = +0.5 pts (😐 Okay)</p>
                      <p>• Under 2% = +0 pts (😑 Break-even)</p>
                    </div>
                  </div>

                  {/* Operational Costs */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">2. Operational Costs</h4>
                      <Badge variant="outline">25% weight</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your core operating costs as a percentage of revenue. Lower is better - shows operational efficiency.
                    </p>
                    <div className="text-xs space-y-1 pt-2 border-t">
                      <p>• Under 65% = +1.0 pts (🤩 Exceptional - very lean)</p>
                      <p>• 65-70% = +0.7 pts (😄 Excellent - well managed)</p>
                      <p>• 70-75% = +0.4 pts (😊 Good - industry standard)</p>
                      <p>• 75-80% = +0.2 pts (🙂 Acceptable)</p>
                      <p>• Over 80% = +0 pts (😑 No bonus)</p>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <p className="font-medium">Operational Costs includes:</p>
                      <p>• 🍖 Food Supplies (ingredients, raw materials)</p>
                      <p>• 📦 Supplies (packaging, containers)</p>
                      <p>• 👥 Labor/Payroll (wages, salaries)</p>
                      <p>• 🏠 Rent/Lease (premises)</p>
                      <p>• 🏛️ Tax & Govt (taxes, licenses)</p>
                    </div>
                  </div>

                  {/* Revenue Strength */}
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">3. Revenue Strength</h4>
                      <Badge variant="outline">12% weight</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Evaluates daily revenue performance based on Hot Like A Mexican's actual business targets (NZD).
                    </p>
                    <div className="text-xs space-y-1 pt-2 border-t">
                      <p>• $4,000+ = 10 pts (🤩 Excellent - $5,000+ is legendary!)</p>
                      <p>• $3,500-4,000 = 9 pts (😄 Great - amazing day)</p>
                      <p>• $3,000-3,500 = 8 pts (😊 Good - very good day)</p>
                      <p>• $2,500-3,000 = 7 pts (🙂 Satisfactory - solid day)</p>
                      <p>• $2,000-2,500 = 6 pts (😐 Pass - average day)</p>
                      <p>• $1,500-2,000 = 5 pts (😑 Failed - below average)</p>
                      <p>• $1,000-1,500 = 4 pts (😒 Failed - low sales)</p>
                      <p>• $600-1,000 = 3 pts (😠 Failed - bad day)</p>
                      <p>• $300-600 = 2 pts (😤 Failed - very bad)</p>
                      <p>• $1-300 = 1 pt (😡 Failed - critical)</p>
                      <p>• $0 = 0 pts (🍆 Failed - no sales)</p>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Grading Icons - Collapsible */}
            <div className="border rounded-lg bg-primary/5">
              <button
                onClick={() => setGradingIconsExpanded(!gradingIconsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors rounded-lg"
              >
                <h3 className="font-semibold text-sm text-primary">Grading Icons</h3>
                {gradingIconsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </button>
              {gradingIconsExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-muted-foreground">0-5 = Failed | 6-10 = Passing</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-green-600">10</span>
                  <span className="text-2xl">🤩</span>
                  <span className="text-muted-foreground">Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-green-500">9</span>
                  <span className="text-2xl">😄</span>
                  <span className="text-muted-foreground">Great</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-lime-500">8</span>
                  <span className="text-2xl">😊</span>
                  <span className="text-muted-foreground">Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-yellow-500">7</span>
                  <span className="text-2xl">🙂</span>
                  <span className="text-muted-foreground">Satisfactory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-yellow-600">6</span>
                  <span className="text-2xl">😐</span>
                  <span className="text-muted-foreground">Pass</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-orange-500">5</span>
                  <span className="text-2xl">😑</span>
                  <span className="text-muted-foreground">Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-orange-600">4</span>
                  <span className="text-2xl">😒</span>
                  <span className="text-muted-foreground">Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-red-500">3</span>
                  <span className="text-2xl">😠</span>
                  <span className="text-muted-foreground">Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-red-600">2</span>
                  <span className="text-2xl">😤</span>
                  <span className="text-muted-foreground">Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-red-600">1</span>
                  <span className="text-2xl">😡</span>
                  <span className="text-muted-foreground">Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-red-700">0</span>
                  <span className="text-2xl">🍆</span>
                  <span className="text-muted-foreground">Failed</span>
                </div>
              </div>
                </div>
              )}
            </div>

            {/* Data Sources Collapsible */}
            {companyDataset?.files && companyDataset.files.length > 0 && (
              <div className="border rounded-lg bg-primary/5">
                <button
                  onClick={() => setDataSourcesExpanded(!dataSourcesExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/10 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Data from {companyDataset.files.length} file{companyDataset.files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {dataSourcesExpanded ? (
                    <ChevronUp className="h-4 w-4 text-primary" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-primary" />
                  )}
                </button>
                {dataSourcesExpanded && (
                  <div className="px-4 pb-3">
                    <ul className="space-y-1 pl-6">
                      {companyDataset.files.map((file, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground list-disc">
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
