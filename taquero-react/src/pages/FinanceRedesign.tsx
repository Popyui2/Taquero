import { useState, useEffect } from 'react'
import { Upload, TrendingUp, TrendingDown, DollarSign, Utensils, ShoppingBag, ShoppingCart, Loader2, Sparkles, Bot, Copy, Check, Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
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
import type { ImportedData, MonthlyFinanceData } from '@/types/finance'
import type { DateRange } from 'react-day-picker'
import { getFinanceData, calculateMetrics, getCombinedDataForMonths, getAvailableMonths, getCombinedBusinessData, filterByDateRange } from '@/lib/finance/storage'
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
  const [globalFilter, setGlobalFilter] = useState<'all-time' | 'last-day' | 'last-week' | 'last-month' | 'last-quarter' | 'custom'>('all-time')
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)

  // AI Export state
  const [aiExportDateRange, setAiExportDateRange] = useState<DateRange | undefined>()
  const [generatedReport, setGeneratedReport] = useState<string>('')
  const [reportCopied, setReportCopied] = useState(false)

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

    // Calculate expense categories from bank transactions
    const expensesByCategory = new Map<string, number>()
    reportData.bankTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        const category = tx.payee || 'Other'
        expensesByCategory.set(category, (expensesByCategory.get(category) || 0) + tx.amount)
      }
    })

    const totalExpenses = Array.from(expensesByCategory.values()).reduce((sum, amt) => sum + amt, 0)
    const topExpenseCategories = Array.from(expensesByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Generate report
    const report = `# Financial Analysis - Hot Like A Mexican
**Period:** ${format(aiExportDateRange.from, 'MMM d, yyyy')} - ${format(aiExportDateRange.to, 'MMM d, yyyy')} (${daysDiff} days)
**Business:** Mexi-Can Limited, Wellington, NZ - Mexican Restaurant

## Executive Summary
- Total Revenue: ${formatCurrency(reportMetrics.posRevenue + reportMetrics.uberRevenue + reportMetrics.delivereasyRevenue)}
- Net Cash Flow: ${formatCurrency(reportMetrics.netCashFlow)}
- Total Orders: ${reportMetrics.totalOrders.toLocaleString()}
- Average Order Value: ${formatCurrency(reportMetrics.averageOrderValue)}
- Daily Average Revenue: ${formatCurrency(reportMetrics.weeklyAverages.dailyRevenue)}
- Daily Average Orders: ${reportMetrics.weeklyAverages.dailyOrders.toFixed(0)}

## Revenue Sources
- POS Sales: ${formatCurrency(reportMetrics.posRevenue)} (${((reportMetrics.posRevenue / (reportMetrics.posRevenue + reportMetrics.uberRevenue + reportMetrics.delivereasyRevenue)) * 100).toFixed(1)}%)
- Uber Eats: ${formatCurrency(reportMetrics.uberRevenue)} (${((reportMetrics.uberRevenue / (reportMetrics.posRevenue + reportMetrics.uberRevenue + reportMetrics.delivereasyRevenue)) * 100).toFixed(1)}%)
- Delivereasy: ${formatCurrency(reportMetrics.delivereasyRevenue)} (${((reportMetrics.delivereasyRevenue / (reportMetrics.posRevenue + reportMetrics.uberRevenue + reportMetrics.delivereasyRevenue)) * 100).toFixed(1)}%)

## Top 10 Products
${top10Products.map((p, i) => `${i + 1}. ${p.product} - ${formatCurrency(p.revenue)} revenue, ${p.quantity} sold (${p.percentOfSales.toFixed(1)}% of sales)`).join('\n')}

## Expense Summary
- Total Expenses: ${formatCurrency(totalExpenses)}
${topExpenseCategories.map(([cat, amt]) => `- ${cat}: ${formatCurrency(amt)}`).join('\n')}

## Questions for AI Analysis
1. What are the key revenue trends in this period?
2. Is the profit margin healthy for a restaurant business?
3. Are there any concerning expense patterns?
4. Which products should we promote more based on performance?
5. What recommendations do you have for revenue growth?
6. Any operational improvements you can suggest?`

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
          <p className="text-muted-foreground text-lg">
            {importedData?.dateRange.start && importedData?.dateRange.end
              ? `${importedData.dateRange.start} - ${importedData.dateRange.end}`
              : 'Import CSV data to view analytics'}
          </p>
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

                {/* Custom Date Range Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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

              {/* Date Range Display on Right */}
              {filteredData?.dateRange.start && filteredData?.dateRange.end && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{filteredData.dateRange.start}</span>
                  <span>—</span>
                  <span className="font-medium">{filteredData.dateRange.end}</span>
                </div>
              )}
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
                        <p className="text-2xl font-bold">{formatCurrency(0)}</p>
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

          {/* Period Averages */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Period Averages</CardTitle>
              <CardDescription>Average daily performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Avg Daily Revenue */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Avg Daily Revenue</p>
                      <p className="text-2xl font-bold">
                        ${metrics.weeklyAverages.dailyRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground ml-15">per day average</p>
                </div>

                {/* Avg Daily Orders */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Avg Daily Orders</p>
                      <p className="text-2xl font-bold">
                        {metrics.weeklyAverages.dailyOrders.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground ml-15">orders per day</p>
                </div>

                {/* Avg Order Value */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                      <p className="text-2xl font-bold">
                        ${metrics.weeklyAverages.avgOrderValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground ml-15">per order average</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NET CASH FLOW - HERO CHART (PC Optimized) */}
          <div className="w-full">
            <FinanceChartsRedesign
              metrics={metrics}
              data={importedData}
              selectedPeriod={selectedPeriod}
              heroOnly={true}
            />
          </div>


          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gross Sales */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(metrics.grossSales)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total revenue from POS
                </p>
                {metrics.comparisonMetrics && (
                  <Badge
                    variant="outline"
                    className={`mt-2 ${
                      metrics.comparisonMetrics.grossSalesChange >= 0
                        ? 'text-green-500 border-green-500'
                        : 'text-red-500 border-red-500'
                    }`}
                  >
                    {metrics.comparisonMetrics.grossSalesChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(metrics.comparisonMetrics.grossSalesChange)}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Net Cash Flow */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metrics.netCashFlow < 0 ? 'text-red-500' : ''}`}>
                  {formatCurrency(metrics.netCashFlow)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Income - Expenses
                </p>
                {metrics.comparisonMetrics && (
                  <Badge
                    variant="outline"
                    className={`mt-2 ${
                      metrics.comparisonMetrics.netCashFlowChange >= 0
                        ? 'text-green-500 border-green-500'
                        : 'text-red-500 border-red-500'
                    }`}
                  >
                    {metrics.comparisonMetrics.netCashFlowChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(metrics.comparisonMetrics.netCashFlowChange)}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Orders in period
                </p>
                {metrics.comparisonMetrics && (
                  <Badge
                    variant="outline"
                    className={`mt-2 ${
                      metrics.comparisonMetrics.ordersChange >= 0
                        ? 'text-green-500 border-green-500'
                        : 'text-red-500 border-red-500'
                    }`}
                  >
                    {metrics.comparisonMetrics.ordersChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(metrics.comparisonMetrics.ordersChange)}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Average Order Value */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(metrics.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per order average
                </p>
                {metrics.comparisonMetrics && (
                  <Badge
                    variant="outline"
                    className={`mt-2 ${
                      metrics.comparisonMetrics.avgOrderValueChange >= 0
                        ? 'text-green-500 border-green-500'
                        : 'text-red-500 border-red-500'
                    }`}
                  >
                    {metrics.comparisonMetrics.avgOrderValueChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(metrics.comparisonMetrics.avgOrderValueChange)}
                  </Badge>
                )}
              </CardContent>
            </Card>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Export Financial Data for AI Analysis</DialogTitle>
                <DialogDescription className="text-base pt-2">
                  Select a date range to generate a formatted report for Claude AI
                </DialogDescription>
              </div>
              <Button
                onClick={generateAIReport}
                disabled={!aiExportDateRange?.from || !aiExportDateRange?.to}
                size="sm"
                className="ml-4"
              >
                <Bot className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Date Range Picker */}
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <label className="text-sm font-medium">Select Date Range (Required)</label>
                <p className="text-xs text-muted-foreground">
                  {aiExportDateRange?.from && aiExportDateRange?.to
                    ? `${format(aiExportDateRange.from, 'MMM d, yyyy')} - ${format(aiExportDateRange.to, 'MMM d, yyyy')}`
                    : 'Click to select dates'}
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {aiExportDateRange?.from && aiExportDateRange?.to ? 'Change Dates' : 'Select Dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selectedRange={aiExportDateRange}
                    onRangeSelect={setAiExportDateRange}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Generated Report */}
            {generatedReport && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Generated Report</label>
                  <Button
                    onClick={copyReportToClipboard}
                    size="sm"
                    variant="outline"
                  >
                    {reportCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs leading-relaxed max-h-[400px] overflow-y-auto border">
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
    </div>
  )
}
