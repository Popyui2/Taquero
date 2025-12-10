import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ImportedData, DashboardMetrics } from '@/types/finance'

interface FinanceDataTablesProps {
  data: ImportedData
  metrics: DashboardMetrics
}

export function FinanceDataTables({ data, metrics }: FinanceDataTablesProps) {
  const [activeTab, setActiveTab] = useState('salesByDay')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Data Tables</CardTitle>
        <CardDescription>
          View detailed breakdowns of all imported financial data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="salesByDay">Sales by Day</TabsTrigger>
            <TabsTrigger value="salesByHour">Sales by Hour</TabsTrigger>
            <TabsTrigger value="topProducts">Top Products</TabsTrigger>
            <TabsTrigger value="topCategories">Top Categories</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Purchases</TabsTrigger>
          </TabsList>

          {/* Sales by Day Table */}
          <TabsContent value="salesByDay" className="space-y-4">
            <div className="rounded-md border overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Eftpos</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Refunds</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.salesByDay.map((day, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell className="text-right">{day.orders}</TableCell>
                      <TableCell className="text-right">${day.cash.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${day.eftpos.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${day.discounts.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${day.refunds.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${day.tax.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${day.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.salesByDay.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No data available. Import Sales by Day CSV to see data here.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Sales by Hour Table */}
          <TabsContent value="salesByHour" className="space-y-4">
            <div className="rounded-md border overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Eftpos</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="text-right">Online</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.salesByHour
                    .filter((hour) => hour.orders > 0)
                    .map((hour, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{hour.time}</TableCell>
                        <TableCell className="text-right">{hour.orders}</TableCell>
                        <TableCell className="text-right">${hour.eftpos.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${hour.cash.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${hour.online.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${hour.tax.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${hour.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  {data.salesByHour.filter((h) => h.orders > 0).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No data available. Import Sales by Hour CSV to see data here.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Top Products Table */}
          <TabsContent value="topProducts" className="space-y-4">
            <div className="rounded-md border overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">% of Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topProducts.map((product, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{product.product}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">
                        $
                        {(
                          data.salesByProduct.find((p) => p.product === product.product)?.tax || 0
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${product.revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.percentOfSales.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {metrics.topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No data available. Import Sales by Product CSV to see data here.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Top Categories Table */}
          <TabsContent value="topCategories" className="space-y-4">
            <div className="rounded-md border overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">% of Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topCategories.map((category, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell className="text-right">{category.quantity}</TableCell>
                      <TableCell className="text-right">
                        $
                        {(
                          data.salesByCategory.find((c) => c.category === category.category)?.tax ||
                          0
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${category.revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {category.percentOfSales.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {metrics.topCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No data available. Import Sales by Category CSV to see data here.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Supplier Purchases Table */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="rounded-md border overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.supplierPurchases
                    .sort(
                      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((purchase, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{purchase.date}</TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${purchase.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  {data.supplierPurchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No supplier purchases identified. Import Bank Statement CSV to see data here.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {data.supplierPurchases.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Total COGS from {data.supplierPurchases.length} supplier purchases: $
                {data.supplierPurchases
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toFixed(2)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
