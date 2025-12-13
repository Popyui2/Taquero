import { useMemo, useState, useEffect, useRef } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, TrendingUp, TrendingDown, DollarSign, ChevronDown } from 'lucide-react'
import type { DashboardMetrics, ImportedData } from '@/types/finance'
import { format, startOfWeek, endOfWeek, startOfMonth, startOfQuarter, endOfQuarter, differenceInDays } from 'date-fns'

interface FinanceChartsRedesignProps {
  metrics: DashboardMetrics
  data: ImportedData
  selectedPeriod?: string
  heroOnly?: boolean
}

const CATEGORY_COLORS = ['#ffffff', '#cccccc', '#999999', '#666666', '#444444']

type AggregationType = 'weekly' | 'monthly' | 'quarterly'

export function FinanceChartsRedesign({ metrics, data, selectedPeriod = 'last-month', heroOnly = false }: FinanceChartsRedesignProps) {
  // Toggle states for Makings/Losses/Net
  const [showMakings, setShowMakings] = useState(true)
  const [showLosses, setShowLosses] = useState(true)
  const [showNet, setShowNet] = useState(true)

  // Toggle between aggregation views
  const [aggregationType, setAggregationType] = useState<AggregationType>('weekly')

  // Table dialog state
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [sortColumn, setSortColumn] = useState<'date' | 'net' | 'makings' | 'losses' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc') // Default newest first
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null)

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
    let aggregatedData: { date: string; net: number; income: number; expenses: number; fullDate: Date; endDate?: Date }[] = []

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
        .map(values => {
          const weekEnd = endOfWeek(values.date, { weekStartsOn: 1 }) // Sunday
          return {
            date: format(values.date, 'MMM d'),
            fullDate: values.date,
            endDate: weekEnd,
            net: values.income - values.expenses,
            income: values.income,
            expenses: values.expenses,
          }
        })
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    } else if (aggregationType === 'monthly') {
      const monthlyTotals: { [key: string]: { income: number; expenses: number; date: Date; lastDay: Date } } = {}

      Object.values(dailyTotals).forEach(({ income, expenses, date }) => {
        const monthStart = startOfMonth(date)
        const monthKey = format(monthStart, 'yyyy-MM')

        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = { income: 0, expenses: 0, date: monthStart, lastDay: date }
        }

        monthlyTotals[monthKey].income += income
        monthlyTotals[monthKey].expenses += expenses
        // Track the last day with data in this month
        if (date > monthlyTotals[monthKey].lastDay) {
          monthlyTotals[monthKey].lastDay = date
        }
      })

      aggregatedData = Object.values(monthlyTotals)
        .map(values => ({
          date: format(values.date, 'MMM yyyy'),
          fullDate: values.date,
          endDate: values.lastDay,
          net: values.income - values.expenses,
          income: values.income,
          expenses: values.expenses,
        }))
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    } else if (aggregationType === 'quarterly') {
      const quarterlyTotals: { [key: string]: { income: number; expenses: number; date: Date; lastDay: Date } } = {}

      Object.values(dailyTotals).forEach(({ income, expenses, date }) => {
        const quarterStart = startOfQuarter(date)
        const quarterKey = format(quarterStart, 'yyyy-QQQ')

        if (!quarterlyTotals[quarterKey]) {
          quarterlyTotals[quarterKey] = { income: 0, expenses: 0, date: quarterStart, lastDay: date }
        }

        quarterlyTotals[quarterKey].income += income
        quarterlyTotals[quarterKey].expenses += expenses
        // Track the last day with data in this quarter
        if (date > quarterlyTotals[quarterKey].lastDay) {
          quarterlyTotals[quarterKey].lastDay = date
        }
      })

      aggregatedData = Object.values(quarterlyTotals)
        .map(values => ({
          date: `Q${Math.floor(values.date.getMonth() / 3) + 1} ${format(values.date, 'yyyy')}`,
          fullDate: values.date,
          endDate: values.lastDay,
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
        netChangePercent,
        fullDate: item.fullDate,
        endDate: item.endDate
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

  // Get raw transactions filtered by selected date range
  const filteredTransactions = useMemo(() => {
    if (!selectedDateRange || !data.bankTransactions) {
      return []
    }

    return data.bankTransactions
      .map(transaction => {
        // Parse transaction date (format: dd/mm/yy)
        const [day, month, year] = transaction.date.split('/').map(Number)
        const transactionDate = new Date(2000 + year, month - 1, day)

        return {
          ...transaction,
          sortableDate: transactionDate,
          displayDate: format(transactionDate, 'dd/MM/yyyy')
        }
      })
      .filter(transaction => {
        return transaction.sortableDate >= selectedDateRange.start &&
               transaction.sortableDate <= selectedDateRange.end
      })
      .sort((a, b) => {
        let compareValue = 0

        if (sortColumn === 'date') {
          compareValue = a.sortableDate.getTime() - b.sortableDate.getTime()
        } else if (sortColumn === 'amount') {
          // Convert to signed values: income is positive, expense is negative
          const aValue = a.type === 'income' ? a.amount : -a.amount
          const bValue = b.type === 'income' ? b.amount : -b.amount
          compareValue = aValue - bValue
        }

        return sortDirection === 'asc' ? compareValue : -compareValue
      })
  }, [data.bankTransactions, selectedDateRange, sortColumn, sortDirection])

  // Calculate totals for filtered transactions
  const filteredTotals = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return { income: 0, expenses: 0, net: 0 }
    }

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      income,
      expenses,
      net: income - expenses
    }
  }, [filteredTransactions])

  // Sort table data (aggregated view when no date range selected)
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

  const handleSort = (column: 'date' | 'net' | 'makings' | 'losses' | 'amount') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column - default to desc (biggest/newest first)
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ column }: { column: 'date' | 'net' | 'makings' | 'losses' | 'amount' }) => {
    if (sortColumn !== column) {
      return <span className="ml-1 text-muted-foreground">↕</span>
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  // Handle chart click to open table with filtered data
  const handleChartClick = (data: any) => {
    // Recharts onClick provides activeIndex instead of activePayload
    if (!data || data.activeIndex === undefined) {
      return
    }

    // Use activeIndex to get the data point from chartData
    const clickedData = chartData[parseInt(data.activeIndex)]

    if (!clickedData || !clickedData.fullDate) {
      return
    }

    // Set date range based on clicked data point
    const startDate = clickedData.fullDate
    const endDate = clickedData.endDate || clickedData.fullDate

    setSelectedDateRange({ start: startDate, end: endDate })
    setShowTableDialog(true)
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

    const periodLabel = aggregationType === 'weekly' ? 'week' : aggregationType === 'monthly' ? 'month' : 'quarter'

    // Format date label based on aggregation type
    let dateLabel = label
    if (aggregationType === 'weekly' && data.fullDate && data.endDate) {
      // Format as dd/mm/yy - dd/mm/yy for weekly view
      const startDate = format(data.fullDate, 'dd/MM/yy')
      const endDate = format(data.endDate, 'dd/MM/yy')
      dateLabel = `${startDate} - ${endDate}`
    } else if (aggregationType === 'quarterly' && data.fullDate && data.endDate) {
      // Format as dd/mm/yy - dd/mm/yy for quarterly view
      const startDate = format(data.fullDate, 'dd/MM/yy')
      const endDate = format(data.endDate, 'dd/MM/yy')
      dateLabel = `${label} (${startDate} - ${endDate})`
    }

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{dateLabel}</p>
        <div className="space-y-1">
          {showMakings && data.income !== undefined && (
            <p className="text-white">
              Makings: ${data.income.toLocaleString()}
            </p>
          )}
          {showLosses && data.lossesNegative !== undefined && (
            <p className="text-red-500">
              Losses: ${Math.abs(data.lossesNegative).toLocaleString()}
            </p>
          )}
          {showNet && data.net !== undefined && (
            <div>
              <p className={data.net >= 0 ? "text-green-500" : "text-red-500"}>
                Net: ${data.net.toLocaleString()}
              </p>
              {data.netChangePercent !== null && (
                <p className={`text-xs mt-0.5 ${data.netChangePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatChange(data.netChangePercent)} vs prev {periodLabel}
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
              <CardTitle className="text-4xl">Makings and Losses</CardTitle>
            </div>

            {/* Aggregation Type Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[120px] justify-between">
                  {aggregationType === 'weekly' ? 'Weekly' : aggregationType === 'monthly' ? 'Monthly' : 'Quarterly'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAggregationType('weekly')}>
                  Weekly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAggregationType('monthly')}>
                  Monthly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAggregationType('quarterly')}>
                  Quarterly
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          {/* Weekly/Monthly/Quarterly view */}
          <div className="cursor-pointer">
            <ResponsiveContainer width="100%" height={heroOnly ? 600 : 400}>
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                onClick={handleChartClick}
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
          </div>
        </CardContent>

        {/* Data Table Dialog */}
        <Dialog open={showTableDialog} onOpenChange={(open) => {
          setShowTableDialog(open)
          if (!open) {
            // Clear date range filter when closing
            setSelectedDateRange(null)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              {selectedDateRange ? (
                <>
                  <DialogTitle>Detailed Transactions for Time Period</DialogTitle>
                  <CardDescription>
                    {format(selectedDateRange.start, 'dd/MM/yyyy')} - {format(selectedDateRange.end, 'dd/MM/yyyy')} ({filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''})
                  </CardDescription>
                </>
              ) : (
                <DialogTitle>
                  {aggregationType === 'weekly' ? 'Weekly' : aggregationType === 'monthly' ? 'Monthly' : 'Quarterly'} Net Cash Flow Data
                </DialogTitle>
              )}
            </DialogHeader>

            {/* Summary for filtered transactions */}
            {selectedDateRange && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Total Income</p>
                    <p className="text-lg font-semibold text-green-500 truncate">
                      ${filteredTotals.income.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="text-lg font-semibold text-red-500 truncate">
                      ${filteredTotals.expenses.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg ${filteredTotals.net >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} flex items-center justify-center flex-shrink-0`}>
                    <DollarSign className={`h-6 w-6 ${filteredTotals.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className={`text-lg font-semibold ${filteredTotals.net >= 0 ? 'text-emerald-500' : 'text-red-500'} truncate`}>
                      ${filteredTotals.net.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('date')}
                  >
                    Date <SortIcon column="date" />
                  </TableHead>
                  {selectedDateRange ? (
                    <>
                      <TableHead>Description</TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('amount')}
                      >
                        Amount <SortIcon column="amount" />
                      </TableHead>
                      <TableHead className="text-right">Type</TableHead>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDateRange ? (
                  // Show individual transactions for selected period
                  filteredTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{transaction.displayDate}</TableCell>
                      <TableCell className="max-w-xs truncate" title={transaction.payee}>
                        {transaction.payee}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${transaction.type === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {transaction.type}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Show aggregated data
                  sortedTableData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.displayDate}</TableCell>
                      <TableCell className={`text-right font-semibold ${row.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${(row.net || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(row.income || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        ${Math.abs(row.lossesNegative || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Regular mode - show Peak Hours and Category Performance in grid
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Peak Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Peak Hours</CardTitle>
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
          <CardTitle className="text-2xl">Sales by Category</CardTitle>
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
    </div>
  )
}
