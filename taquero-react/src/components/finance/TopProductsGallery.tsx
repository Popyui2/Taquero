import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProductPerformance } from '@/types/finance'
import { TrendingUp, Award } from 'lucide-react'

interface TopProductsGalleryProps {
  products: ProductPerformance[]
}

export function TopProductsGallery({ products }: TopProductsGalleryProps) {
  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return null
  }

  const getProductEmoji = (productName: string) => {
    const name = productName.toLowerCase()
    if (name.includes('burrito')) return '🌯'
    if (name.includes('taco')) return '🌮'
    if (name.includes('quesadilla')) return '🧀'
    if (name.includes('nachos')) return '🧀'
    if (name.includes('salad')) return '🥗'
    if (name.includes('beer') || name.includes('cerveza')) return '🍺'
    if (name.includes('margarita')) return '🍹'
    if (name.includes('soda') || name.includes('jarritos')) return '🥤'
    if (name.includes('juice') || name.includes('mango')) return '🥭'
    if (name.includes('tea') || name.includes('horchata')) return '🍵'
    if (name.includes('guacamole') || name.includes('guac')) return '🥑'
    if (name.includes('chips')) return '🍟'
    if (name.includes('birria')) return '🍖'
    if (name.includes('carnitas')) return '🥩'
    if (name.includes('chicken')) return '🍗'
    return '🍽️'
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6" />
          Top Products
        </h3>
        <p className="text-muted-foreground mt-1">
          Your best-selling items ranked by revenue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product, index) => {
          const medal = getMedalEmoji(index)
          const emoji = getProductEmoji(product.product)

          return (
            <Card
              key={product.product}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                index < 3 ? 'border-foreground/20' : ''
              }`}
            >
              {medal && (
                <div className="absolute top-2 right-2 text-2xl">{medal}</div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-4xl flex-shrink-0 mt-1">{emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
                      {product.product}
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">Revenue</span>
                        <span className="text-xl font-bold">
                          ${product.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Sold</span>
                        <span className="text-sm font-medium">{product.quantity} units</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.percentOfSales.toFixed(1)}% of sales
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No product data available. Upload your CSV files to see top products.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
