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
import type { DashboardMetrics, ImportedData } from '@/types/finance'
import { format, startOfWeek, endOfWeek, startOfMonth, differenceInDays } from 'date-fns'

interface FinanceChartsRedesignProps {
  metrics: DashboardMetrics
  data: ImportedData
  selectedPeriod?: string
}

const CATEGORY_COLORS = ['#ffffff', '#cccccc', '#999999', '#666666', '#444444']

type AggregationType = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export function FinanceChartsRedesign({ metrics, data, selectedPeriod = 'last-month' }: FinanceChartsRedesignProps) {
  // Toggle states for Makings/Losses/Net
  const [showMakings, setShowMakings] = useState(true)
  const [showLosses, setShowLosses] = useState(true)
  const [showNet, setShowNet] = useState(true)

  // Determine aggregation type based on selected period
  const getAggregationType = (): AggregationType => {
    if (!data.bankTransactions || data.bankTransactions.length === 0) return 'daily'

    // Calculate data span for custom/all-time periods
    if (selectedPeriod === 'custom' || selectedPeriod === 'all-time') {
      const dates = data.bankTransactions.map(t => {
        const [day, month, year] = t.date.split('/').map(Number)
        return new Date(2000 + year, month - 1, day)
      })
      const oldest = new Date(Math.min(...dates.map(d => d.getTime())))
      const newest = new Date(Math.max(...dates.map(d => d.getTime())))
      const totalDays = differenceInDays(newest, oldest)

      // Smart aggregation based on total data span
      if (selectedPeriod === 'all-time') {
        if (totalDays <= 90) return 'weekly'      // Up to 3 months
        if (totalDays <= 365) return 'monthly'    // Up to 1 year
        if (totalDays <= 1095) return 'monthly'   // Up to 3 years
        return 'quarterly'                        // More than 3 years
      }

      // Custom range
      if (totalDays <= 7) return 'daily'
      if (totalDays <= 60) return 'weekly'
      if (totalDays <= 365) return 'monthly'
      return 'quarterly'
    }

    // Preset mappings
    const aggregationMap: { [key: string]: AggregationType } = {
      'last-week': 'daily',
      'last-month': 'weekly',
      'last-3-months': 'weekly',
      'last-6-months': 'weekly',
      'last-year': 'monthly',
    }

    return aggregationMap[selectedPeriod] || 'daily'
  }

  const aggregationType = getAggregationType()

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

    if (aggregationType === 'daily') {
      aggregatedData = Object.entries(dailyTotals)
        .map(([dateKey, values]) => ({
          date: format(values.date, 'MMM d'),
          fullDate: values.date,
          net: values.income - values.expenses,
          income: values.income,
          expenses: values.expenses,
        }))
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    } else if (aggregationType === 'weekly') {
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

  // Transform data for chart (expenses as negative)
  const chartData = useMemo(() => {
    return aggregatedData.map(item => ({
      date: item.date,
      income: item.income,
      lossesNegative: -item.expenses,  // Negative for proper display
      net: item.net
    }))
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0]?.payload
    if (!data) return null

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
            <p className={data.net >= 0 ? "text-green-500" : "text-red-500"}>
              Net: ${data.net.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    )
  }

  const getAggregationLabel = () => {
    const labels = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly'
    }
    return labels[aggregationType]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Net Cash Flow - Takes 2 columns */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Net Cash Flow</CardTitle>
            <CardDescription>
              {aggregationType === 'daily' && 'Daily profit/loss from bank statement'}
              {aggregationType === 'weekly' && 'Weekly profit/loss from bank statement'}
              {aggregationType === 'monthly' && 'Monthly profit/loss from bank statement'}
              {aggregationType === 'quarterly' && 'Quarterly profit/loss from bank statement'}
            </CardDescription>
          </div>

          {/* Toggle Buttons */}
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
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
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
      </Card>

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
