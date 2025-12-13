import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ProductPerformance } from '@/types/finance'
import { TrendingUp, Utensils, Beer, Coffee, Cookie, ShoppingBag, ChevronDown, AlertTriangle } from 'lucide-react'

interface TopProductsGalleryProps {
  products: ProductPerformance[]
}

// Product classification based on current POS setup
const PRODUCT_CATEGORIES = {
  'Main Dishes': [
    'Birria Combo x2 (GF)',
    'Birria Tacos x2 (GF)',
    'Burrito',
    'Burrito (Contains gluten)', // Old CSV name
    'Cheese Only Quesadilla',
    'Extra Taco',
    'Nachos (GF)',
    'Quesadilla',
    'Quesadilla (Contains Gluten)', // Old CSV name
    'Salad (GF)',
    'Salad/Naked Burrito (GF)', // Old CSV name
    'Single Birria Taco',
    'Tacos X2 (GF)',
    'Tamal (GF)',
    'Eat! Like a Mexican', // Old CSV name - likely a combo
    'Eat Like a Mexican (ELM)', // Old CSV name - likely a combo
  ],
  'Alcoholic Drinks': [
    'Cerveza Bohemia',
    'Cerveza Corona Oscura',
    'Cerveza Dos Equis Ambar',
    'Cerveza Modelo',
    'Cerveza Modelo Negra',
    'Cerveza Pacifico',
    'Cerveza Victoria',
    'Cerveza XX',
    'Estrella de Jalisco',
    'Fugazi Beer',
    'Lime Margarita',
    'Spicy Margartia',
  ],
  'Non-Alcoholic Drinks': [
    'Hibiscus Tea (Jamaica)',
    'Horchata',
    'Jarritos Soda',
    'Mango Juice',
    'Manzanita Sol Fizzy',
    'Mexican Coca-Cola - 355 Ml',
    'Mexican Coca-Cola - 500 Ml',
    'Sangria Señorial Fizzy',
    'Sidral Mundet',
    'Squirt Soda',
  ],
  'Snacks': [
    'Homemade Tortilla Chips with Fresh Guacamole',
    'Tortilla Chips with Fresh Guacamole (GF)', // Old CSV name
    'Guacamole', // Standalone guacamole
  ],
  'Retail': [
    'MAGA Hat',
    'Salsa x1',
    'Salsa x2',
    'Salsa x3',
    'Takeaway Container',
    'Tortilla Chip Bag',
  ],
}

type CategoryName = keyof typeof PRODUCT_CATEGORIES

export function TopProductsGallery({ products }: TopProductsGalleryProps) {
  const [activeTab, setActiveTab] = useState<CategoryName>('Main Dishes')
  const [isOpen, setIsOpen] = useState(false)

  const getProductCategory = (productName: string): CategoryName | null => {
    // Normalize product name for matching (trim and case-insensitive)
    const normalizedName = productName.trim()

    for (const [category, items] of Object.entries(PRODUCT_CATEGORIES)) {
      // Check if any item in the category matches (case-insensitive, trimmed)
      if (items.some(item => item.trim().toLowerCase() === normalizedName.toLowerCase())) {
        return category as CategoryName
      }
    }

    return null
  }

  // First, aggregate products with the same name (combine duplicates from POS)
  const aggregatedProductsMap = new Map<string, ProductPerformance>()

  products.forEach((product) => {
    const existing = aggregatedProductsMap.get(product.product)
    if (existing) {
      // Combine with existing entry
      existing.quantity += product.quantity
      existing.revenue += product.revenue
      existing.percentOfSales += product.percentOfSales
    } else {
      // Create new entry (copy to avoid mutation)
      aggregatedProductsMap.set(product.product, { ...product })
    }
  })

  const aggregatedProducts = Array.from(aggregatedProductsMap.values())
    .sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending

  // Determine top 3 products OVERALL for medals
  const top3Overall = new Set([
    aggregatedProducts[0]?.product,
    aggregatedProducts[1]?.product,
    aggregatedProducts[2]?.product,
  ].filter(Boolean))

  const groupedProducts: Record<CategoryName, ProductPerformance[]> = {
    'Main Dishes': [],
    'Alcoholic Drinks': [],
    'Non-Alcoholic Drinks': [],
    'Snacks': [],
    'Retail': [],
  }

  // Group aggregated products by category
  aggregatedProducts.forEach((product) => {
    const category = getProductCategory(product.product)
    if (category) {
      groupedProducts[category].push(product)
    }
  })

  const getCategoryStats = (category: CategoryName) => {
    const categoryProducts = groupedProducts[category]
    const totalRevenue = categoryProducts.reduce((sum, p) => sum + p.revenue, 0)
    const count = categoryProducts.length
    return { totalRevenue, count }
  }

  const getCategoryIcon = (category: CategoryName) => {
    switch (category) {
      case 'Main Dishes': return Utensils
      case 'Alcoholic Drinks': return Beer
      case 'Non-Alcoholic Drinks': return Coffee
      case 'Snacks': return Cookie
      case 'Retail': return ShoppingBag
    }
  }

  const getMedalEmoji = (productName: string) => {
    // Find the product's rank in the overall top 3
    const rank = aggregatedProducts.findIndex(p => p.product === productName)
    if (rank === 0) return '🥇'
    if (rank === 1) return '🥈'
    if (rank === 2) return '🥉'
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
    if (name.includes('tamal')) return '🫔'
    if (name.includes('hat')) return '🧢'
    if (name.includes('salsa')) return '🌶️'
    if (name.includes('container') || name.includes('bag')) return '📦'
    return '🍽️'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Product Data</h3>
          <p className="text-muted-foreground mt-1">
            Sales performance organized by product category
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-muted transition-colors">
            <span className="text-sm font-medium">{isOpen ? 'Hide' : 'Show'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-semibold">
            INCORRECT DATA - UNDER CONSTRUCTION
          </AlertDescription>
        </Alert>

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No product data available. Upload your CSV files to see product performance.</p>
            </CardContent>
          </Card>
        ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryName)}>
          <TabsList className="grid w-full grid-cols-5 h-auto">
            {(Object.keys(groupedProducts) as CategoryName[]).map((category) => {
              const stats = getCategoryStats(category)
              const Icon = getCategoryIcon(category)

              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{category}</span>
                  <span className="text-xs opacity-70">
                    {stats.count} items · {formatCurrency(stats.totalRevenue)}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {(Object.keys(groupedProducts) as CategoryName[]).map((category) => {
            const categoryProducts = groupedProducts[category]

            return (
              <TabsContent key={category} value={category} className="mt-6">
                {categoryProducts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <p>No products in this category for the selected period.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryProducts.map((product) => {
                      const medal = getMedalEmoji(product.product)
                      const emoji = getProductEmoji(product.product)

                      return (
                        <Card
                          key={product.product}
                          className={`relative overflow-hidden transition-all hover:shadow-lg ${
                            medal ? 'border-primary/30' : ''
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
                                      {formatCurrency(product.revenue)}
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
                )}
              </TabsContent>
            )
          })}
        </Tabs>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
