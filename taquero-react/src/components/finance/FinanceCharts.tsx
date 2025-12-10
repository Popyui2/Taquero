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
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardMetrics, ImportedData } from '@/types/finance'

interface FinanceChartsProps {
  metrics: DashboardMetrics
  data: ImportedData
}

const COLORS = [
  'hsl(var(--foreground))', // Primary - white/light gray
  'hsl(var(--muted-foreground))', // Secondary - muted gray
  'hsl(var(--border))', // Tertiary - border gray
  '#888888', // Gray 1
  '#666666', // Gray 2
  '#999999', // Gray 3
  '#777777', // Gray 4
  '#555555', // Gray 5
  '#aaaaaa', // Gray 6
  '#cccccc', // Gray 7
]

export function FinanceCharts({ metrics, data }: FinanceChartsProps) {
  // Prepare data for net cash flow by week from bank statement
  const netCashFlowByWeek = () => {
    if (!data.bankTransactions || data.bankTransactions.length === 0) {
      return []
    }

    // Group transactions by week
    const weeklyData: { [key: string]: { income: number; expenses: number } } = {}

    data.bankTransactions.forEach((transaction) => {
      // Parse date (format: DD/MM/YY)
      const parts = transaction.date.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1
        const year = 2000 + parseInt(parts[2])
        const date = new Date(year, month, day)

        // Get week start (Monday)
        const dayOfWeek = date.getDay()
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const weekStart = new Date(date.setDate(diff))
        const weekKey = `${weekStart.getDate()}/${weekStart.getMonth() + 1}/${weekStart.getFullYear()}`

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { income: 0, expenses: 0 }
        }

        if (transaction.type === 'income') {
          weeklyData[weekKey].income += transaction.amount
        } else {
          weeklyData[weekKey].expenses += transaction.amount
        }
      }
    })

    // Convert to array and calculate net
    return Object.entries(weeklyData)
      .map(([week, values]) => ({
        week,
        net: parseFloat((values.income - values.expenses).toFixed(2)),
      }))
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.week.split('/').map(Number)
        const [dayB, monthB, yearB] = b.week.split('/').map(Number)
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime()
      })
  }

  const revenueTrendData = netCashFlowByWeek()

  // Prepare data for peak hours chart (top 10 hours)
  const peakHoursData = metrics.peakHours.slice(0, 10).map((hour) => ({
    hour: hour.hour,
    orders: hour.orders,
    revenue: parseFloat(hour.revenue.toFixed(2)),
  }))

  // Prepare data for top products chart
  const topProductsData = metrics.topProducts.slice(0, 8).map((product) => ({
    name: product.product.length > 20 ? product.product.substring(0, 20) + '...' : product.product,
    revenue: parseFloat(product.revenue.toFixed(2)),
    quantity: product.quantity,
  }))

  // Prepare data for top categories pie chart
  const topCategoriesData = metrics.topCategories.map((category) => ({
    name: category.category,
    value: parseFloat(category.revenue.toFixed(2)),
    percentage: parseFloat(category.percentOfSales.toFixed(1)),
  }))

  // COGS vs Revenue comparison
  const cogsRevenueData = [
    {
      name: 'Financial Overview',
      Revenue: parseFloat(metrics.totalRevenue.toFixed(2)),
      COGS: parseFloat(metrics.totalCOGS.toFixed(2)),
      'Gross Profit': parseFloat(metrics.grossProfit.toFixed(2)),
    },
  ]

  // Custom tooltip for currency values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            ${payload[0].value.toLocaleString()} ({payload[0].payload.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Net Cash Flow by Week */}
      <Card>
        <CardHeader>
          <CardTitle>Net Cash Flow by Week</CardTitle>
          <CardDescription>Weekly net cash flow from bank statement (Income - Expenses)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="week"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="net"
                name="Net Cash Flow"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--foreground))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* COGS vs Revenue */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue, COGS & Gross Profit</CardTitle>
          <CardDescription>Financial breakdown for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cogsRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Revenue" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="COGS" fill="#666666" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gross Profit" fill="#888888" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Sales Hours</CardTitle>
            <CardDescription>Revenue by hour (top 10 hours)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis
                  dataKey="hour"
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Categories Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topCategoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Revenue by product (top 8 products)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
