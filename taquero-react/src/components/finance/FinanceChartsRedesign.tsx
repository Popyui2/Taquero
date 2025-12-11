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
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardMetrics } from '@/types/finance'

interface FinanceChartsRedesignProps {
  metrics: DashboardMetrics
}

const CATEGORY_COLORS = ['#ffffff', '#cccccc', '#999999', '#666666', '#444444']

export function FinanceChartsRedesign({ metrics }: FinanceChartsRedesignProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Orders Per Day - Takes 2 columns */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Orders Per Day</CardTitle>
          <CardDescription>Daily order volume with 7-day moving average trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.ordersPerDay}>
              <defs>
                <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                fill="url(#orderGradient)"
              />
              <Line
                type="monotone"
                dataKey="movingAverage"
                name="7-Day Avg"
                stroke="#888888"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
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
