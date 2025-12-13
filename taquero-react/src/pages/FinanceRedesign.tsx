import { useState, useEffect } from 'react'
import { Upload, TrendingUp, TrendingDown, DollarSign, Utensils, ShoppingBag, ShoppingCart, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ImportedData, MonthlyFinanceData } from '@/types/finance'
import { getFinanceData, calculateMetrics, getCombinedDataForMonths, getAvailableMonths } from '@/lib/finance/storage'
import { UploadFinanceWizard } from '@/components/finance/UploadFinanceWizard'
import { TopProductsGallery } from '@/components/finance/TopProductsGallery'
import { FinanceChartsRedesign } from '@/components/finance/FinanceChartsRedesign'
import { MonthSelector } from '@/components/finance/MonthSelector'

export function FinanceRedesign() {
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyFinanceData[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last-month')
  const [showUploadWizard, setShowUploadWizard] = useState(false)

  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    setIsLoading(true)
    try {
      const stored = await getFinanceData()
      if (stored && stored.monthlyData) {
        setMonthlyData(stored.monthlyData)
        const months = stored.monthlyData.map(m => m.month).sort((a, b) => b.localeCompare(a))
        setAvailableMonths(months)

        // Auto-select last month by default
        if (months.length > 0 && selectedMonths.length === 0) {
          setSelectedMonths([months[0]])
        }
      }
    } catch (err) {
      console.error('Error loading finance data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Get combined data for selected months
  const importedData = selectedMonths.length > 0 && monthlyData.length > 0
    ? getCombinedDataForMonths(monthlyData, selectedMonths)
    : null

  const metrics = importedData ? calculateMetrics(importedData) : null

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
        <Button
          size="lg"
          onClick={() => setShowUploadWizard(true)}
          className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
        >
          <Upload className="h-5 w-5 mr-2" />
          Add Financial Files
        </Button>
      </div>

      {metrics ? (
        <>
          {/* Revenue Sources */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Revenue Sources</CardTitle>
              <CardDescription>Total: {formatCurrency(metrics.grossSales)}</CardDescription>
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
                      {((metrics.posRevenue / metrics.grossSales) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(metrics.posRevenue / metrics.grossSales) * 100}%` }}
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
                      {((metrics.uberRevenue / metrics.grossSales) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${(metrics.uberRevenue / metrics.grossSales) * 100}%` }}
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
                      {((metrics.delivereasyRevenue / metrics.grossSales) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${(metrics.delivereasyRevenue / metrics.grossSales) * 100}%`, backgroundColor: '#f2f542' }}
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

          {/* Month Selector */}
          {availableMonths.length > 0 && (
            <MonthSelector
              availableMonths={availableMonths}
              selectedMonths={selectedMonths}
              onSelectionChange={setSelectedMonths}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              currentData={importedData}
            />
          )}

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
    </div>
  )
}
