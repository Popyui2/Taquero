import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText } from 'lucide-react'
import type { DashboardMetrics, ImportedData } from '@/types/finance'
import { format, startOfWeek, endOfWeek, startOfMonth, differenceInDays } from 'date-fns'

interface FinanceChartsRedesignProps {
  metrics: DashboardMetrics
  data: ImportedData
  selectedPeriod?: string
  heroOnly?: boolean
}

const CATEGORY_COLORS = ['#ffffff', '#cccccc', '#999999', '#666666', '#444444']

type AggregationType = 'weekly' | 'monthly'

export function FinanceChartsRedesign({ metrics, data, selectedPeriod = 'last-month', heroOnly = false }: FinanceChartsRedesignProps) {
  // Toggle states for Makings/Losses/Net
  const [showMakings, setShowMakings] = useState(true)
  const [showLosses, setShowLosses] = useState(true)
  const [showNet, setShowNet] = useState(true)

  // Toggle between weekly and monthly view
  const [aggregationType, setAggregationType] = useState<AggregationType>('weekly')

  // Table dialog state
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [sortColumn, setSortColumn] = useState<'date' | 'net' | 'makings' | 'losses'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc') // Default newest first

  // Process and aggregate bank transactions
  const processNetCashFlow = () => {
    if (!data.bankTransactions || data.bankTransactions.length === 0) {
      return { aggregatedData: [] }
    }

    // First, get daily data
    const dailyTotals: { [key: string]: { income: number; expenses: number; date: Date } } = {}

    data.bankTransactions.forEach((transaction) => {
      const [day, month, year] = transaction.date.split('/').map(Number)
      const date = new Date(2000 + year, month - 1, day)
      const dateKey = format(date, 'yyyy-MM-dd')

      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = { income: 0, expenses: 0, date }
      }

      if (transaction.type === 'income') {
        dailyTotals[dateKey].income += transaction.amount
      } else {
        dailyTotals[dateKey].expenses += Math.abs(transaction.amount)
      }
    })

    // Aggregate based on type
    let aggregatedData: { date: string; net: number; income: number; expenses: number }[] = []

    if (aggregationType === 'weekly') {
      const weeklyTotals: { [key: string]: { income: number; expenses: number; date: Date } } = {}

      Object.values(dailyTotals).forEach(({ income, expenses, date }) => {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        const weekKey = format(weekStart, 'yyyy-MM-dd')

        if (!weeklyTotals[weekKey]) {
          weeklyTotals[weekKey] = { income: 0, expenses: 0, date: weekStart }
        }

        weeklyTotals[weekKey].income += income
        weeklyTotals[weekKey].expenses += expenses
      })

      aggregatedData = Object.values(weeklyTotals)
        .map(values => ({
          date: format(values.date, 'MMM d'),
          fullDate: values.date,
          net: values.income - values.expenses,
          income: values.income,
          expenses: values.expenses,
        }))
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    } else if (aggregationType === 'monthly') {
      const monthlyTotals: { [key: string]: { income: number; expenses: number; date: Date } } = {}

      Object.values(dailyTotals).forEach(({ income, expenses, date }) => {
        const monthStart = startOfMonth(date)
        const monthKey = format(monthStart, 'yyyy-MM')

        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = { income: 0, expenses: 0, date: monthStart }
        }

        monthlyTotals[monthKey].income += income
        monthlyTotals[monthKey].expenses += expenses
      })

      aggregatedData = Object.values(monthlyTotals)
        .map(values => ({
          date: format(values.date, 'MMM yyyy'),
          fullDate: values.date,
          net: values.income - values.expenses,
          income: values.income,
          expenses: values.expenses,
        }))
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    }

    return { aggregatedData }
  }

  const { aggregatedData } = processNetCashFlow()

  // Transform data for chart (expenses as negative) with period-over-period comparison
  const chartData = useMemo(() => {
    return aggregatedData.map((item, index) => {
      // Calculate % change from previous period
      let netChangePercent: number | null = null
      if (index > 0) {
        const previousNet = aggregatedData[index - 1].net
        if (previousNet !== 0) {
          netChangePercent = ((item.net - previousNet) / Math.abs(previousNet)) * 100
        } else if (item.net !== 0) {
          // Previous was 0, current is not
          netChangePercent = item.net > 0 ? 100 : -100
        }
      }

      return {
        date: item.date,
        income: item.income,
        lossesNegative: -item.expenses,  // Negative for proper display
        net: item.net,
        netChangePercent
      }
    })
  }, [aggregatedData])

  // Calculate average net
  const averageNet = useMemo(() => {
    if (chartData.length === 0) return 0
    return chartData.reduce((sum, item) => sum + item.net, 0) / chartData.length
  }, [chartData])

  // Calculate dynamic Y-axis domain
  const yAxisDomain = useMemo(() => {
    let minValue = 0
    let maxValue = 0

    chartData.forEach(item => {
      if (showMakings && item.income > maxValue) {
        maxValue = item.income
      }
      if (showLosses && item.lossesNegative < minValue) {
        minValue = item.lossesNegative
      }
      if (showNet) {
        if (item.net > maxValue) maxValue = item.net
        if (item.net < minValue) minValue = item.net
      }
    })

    const padding = Math.max(Math.abs(maxValue), Math.abs(minValue)) * 0.1

    if (minValue >= 0) {
      return [0, maxValue + padding]
    }

    return [minValue - padding, maxValue + padding]
  }, [chartData, showMakings, showLosses, showNet])

  // Sort table data
  const sortedTableData = useMemo(() => {
    const dataWithFormattedDates = aggregatedData.map(row => {
      // Format the fullDate as DD/MM/YYYY
      const dateObj = row.fullDate
      const formattedDate = format(dateObj, 'dd/MM/yyyy')

      return {
        date: row.date, // Keep original for display fallback
        displayDate: formattedDate,
        sortableDate: dateObj,
        net: row.net,
        income: row.income,
        lossesNegative: -row.expenses,
        expenses: row.expenses
      }
    })

    const sorted = [...dataWithFormattedDates].sort((a, b) => {
      let compareValue = 0

      switch (sortColumn) {
        case 'date':
          compareValue = a.sortableDate.getTime() - b.sortableDate.getTime()
          break
        case 'net':
          compareValue = a.net - b.net
          break
        case 'makings':
          compareValue = a.income - b.income
          break
        case 'losses':
          compareValue = a.expenses - b.expenses
          break
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })

    return sorted
  }, [aggregatedData, sortColumn, sortDirection])

  const handleSort = (column: 'date' | 'net' | 'makings' | 'losses') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column - default to desc (biggest/newest first)
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ column }: { column: 'date' | 'net' | 'makings' | 'losses' }) => {
    if (sortColumn !== column) {
      return <span className="ml-1 text-muted-foreground">↕</span>
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0]?.payload
    if (!data) return null

    const formatChange = (percent: number | null) => {
      if (percent === null) return null
      const sign = percent >= 0 ? '+' : ''
      return `${sign}${percent.toFixed(1)}%`
    }

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          {showMakings && (
            <p className="text-white">
              Makings: ${data.income.toLocaleString()}
            </p>
          )}
          {showLosses && (
            <p className="text-red-500">
              Losses: ${Math.abs(data.lossesNegative).toLocaleString()}
            </p>
          )}
          {showNet && (
            <div>
              <p className={data.net >= 0 ? "text-green-500" : "text-red-500"}>
                Net: ${data.net.toLocaleString()}
              </p>
              {data.netChangePercent !== null && (
                <p className={`text-xs mt-0.5 ${data.netChangePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatChange(data.netChangePercent)} vs prev {aggregationType === 'weekly' ? 'week' : 'month'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }


  // Hero mode - only show Net Cash Flow chart full-width
  if (heroOnly) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Net Cash Flow</CardTitle>
              <CardDescription>
                {aggregationType === 'weekly' ? 'Weekly' : 'Monthly'} profit/loss from bank statement
              </CardDescription>
            </div>

            {/* Aggregation Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={aggregationType === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAggregationType('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant={aggregationType === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAggregationType('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>

          {/* Data Toggle Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={showMakings ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMakings(!showMakings)}
            >
              Makings
            </Button>
            <Button
              variant={showLosses ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setShowLosses(!showLosses)}
            >
              Losses
            </Button>
            <Button
              variant={showNet ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowNet(!showNet)}
              className={showNet ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Net
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTableDialog(true)}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={heroOnly ? 600 : 400}>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis
                domain={yAxisDomain}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `$${(value / 1000).toFixed(0)}k`
                  }
                  return `$${value.toLocaleString()}`
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Zero reference line - only show if domain crosses zero */}
              {yAxisDomain[0] < 0 && yAxisDomain[1] > 0 && (
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" strokeWidth={1} />
              )}

              {/* Average line */}
              <ReferenceLine
                y={averageNet}
                stroke="#888"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Avg: $${averageNet.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                  position: averageNet > 0 ? 'insideTopRight' : 'insideBottomRight',
                  fill: '#888',
                  fontSize: 11
                }}
              />

              {/* Makings (Income) - White area */}
              {showMakings && (
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#ffffff"
                  fill="#ffffff"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Makings"
                />
              )}

              {/* Losses (Expenses as negative) - Red area */}
              {showLosses && (
                <Area
                  type="monotone"
                  dataKey="lossesNegative"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Losses"
                />
              )}

              {/* Net Cash Flow - Green line */}
              {showNet && (
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Net"
                />
              )}

              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>

        {/* Data Table Dialog */}
        <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {aggregationType === 'weekly' ? 'Weekly' : 'Monthly'} Net Cash Flow Data
              </DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('date')}
                  >
                    Date <SortIcon column="date" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('net')}
                  >
                    Net <SortIcon column="net" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('makings')}
                  >
                    Makings <SortIcon column="makings" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('losses')}
                  >
                    Losses <SortIcon column="losses" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.displayDate}</TableCell>
                    <TableCell className={`text-right font-semibold ${row.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${row.net.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${row.income.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-500">
                      ${Math.abs(row.lossesNegative).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Regular mode - show all charts in grid
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Peak Hours - Takes 1 column */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
          <CardDescription>Top 10 revenue hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.peakHours} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis
                dataKey="hour"
                type="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="revenue"
                name="Revenue"
                radius={[0, 4, 4, 0]}
              >
                {metrics.peakHours.map((entry, index) => {
                  // Create gradient based on position (highest = brightest)
                  const opacity = 1 - (index / metrics.peakHours.length) * 0.6
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`rgba(255, 255, 255, ${opacity})`}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Performance Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
          <CardDescription>Revenue distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.topCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentOfSales }) => `${category}: ${percentOfSales.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {metrics.topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Performance Summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Period Averages</CardTitle>
          <CardDescription>Average daily performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Daily Revenue</p>
              <p className="text-3xl font-bold">
                ${metrics.weeklyAverages.dailyRevenue.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Daily Orders</p>
              <p className="text-3xl font-bold">
                {metrics.weeklyAverages.dailyOrders.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-3xl font-bold">
                ${metrics.weeklyAverages.avgOrderValue.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">per order</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
