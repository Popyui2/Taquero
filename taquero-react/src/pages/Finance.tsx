import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Loader2, TrendingUp, DollarSign, Package, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ImportedData, CSVImportStatus } from '@/types/finance'
import {
  parseSalesByProduct,
  parseSalesByCategory,
  parseSalesByHour,
  parseSalesByDay,
  parseBankStatement,
  extractSupplierPurchases,
  validateCSVFormat,
} from '@/lib/finance/csvParsers'
import {
  saveFinanceData,
  getFinanceData,
  clearFinanceData,
  calculateMetrics,
} from '@/lib/finance/storage'
import { FinanceCharts } from '@/components/finance/FinanceCharts'
import { FinanceDataTables } from '@/components/finance/FinanceDataTables'
import { UploadFinanceWizard } from '@/components/finance/UploadFinanceWizard'

type CSVType =
  | 'salesByDay'
  | 'salesByHour'
  | 'salesByCategory'
  | 'salesByProduct'
  | 'bankStatement'

const CSV_TYPES: { key: CSVType; label: string; description: string; expectedHeaders: string[] }[] = [
  {
    key: 'salesByDay',
    label: 'Sales by Day',
    description: 'Daily sales summary from Tabin POS',
    expectedHeaders: ['Date', 'Orders', 'Total'],
  },
  {
    key: 'salesByHour',
    label: 'Sales by Hour',
    description: 'Hourly sales breakdown from Tabin POS',
    expectedHeaders: ['Time', 'Orders', 'Total'],
  },
  {
    key: 'salesByCategory',
    label: 'Sales by Category',
    description: 'Category performance from Tabin POS',
    expectedHeaders: ['Category', 'Quantity', 'Total'],
  },
  {
    key: 'salesByProduct',
    label: 'Sales by Product',
    description: 'Product performance from Tabin POS',
    expectedHeaders: ['Product', 'Quantity', 'Total'],
  },
  {
    key: 'bankStatement',
    label: 'Bank Statement',
    description: 'Bank transactions for COGS calculation',
    expectedHeaders: ['Date', 'Amount', 'Payee'],
  },
]

export function Finance() {
  const [isLoading, setIsLoading] = useState(true)
  const [importedData, setImportedData] = useState<ImportedData | null>(null)
  const [importStatus, setImportStatus] = useState<CSVImportStatus>({
    salesByDay: false,
    salesByHour: false,
    salesByCategory: false,
    salesByProduct: false,
    bankStatement: false,
  })
  const [uploadingType, setUploadingType] = useState<CSVType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [showUploadWizard, setShowUploadWizard] = useState(false)

  // Load existing data from IndexedDB on mount
  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    setIsLoading(true)
    try {
      const stored = await getFinanceData()
      if (stored) {
        setImportedData(stored.data)
        updateImportStatus(stored.data)
      }
    } catch (err) {
      console.error('Error loading finance data:', err)
      setError('Failed to load stored data')
    } finally {
      setIsLoading(false)
    }
  }

  const updateImportStatus = (data: ImportedData) => {
    setImportStatus({
      salesByDay: data.salesByDay.length > 0,
      salesByHour: data.salesByHour.length > 0,
      salesByCategory: data.salesByCategory.length > 0,
      salesByProduct: data.salesByProduct.length > 0,
      bankStatement: data.bankTransactions.length > 0,
    })
  }

  // Auto-detect CSV type based on headers
  const detectCSVType = (csvText: string): CSVType | null => {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return null

    const headers = lines[0].toLowerCase()

    // Check for each CSV type by its unique header pattern
    if (headers.includes('date') && headers.includes('orders') && headers.includes('discounts')) {
      return 'salesByDay'
    }
    if (headers.includes('time') && headers.includes('orders') && headers.includes('eftpos surcharge')) {
      return 'salesByHour'
    }
    if (headers.includes('category') && headers.includes('quantity') && headers.includes('% of sale')) {
      return 'salesByCategory'
    }
    if (headers.includes('product') && headers.includes('quantity') && headers.includes('% of sale')) {
      return 'salesByProduct'
    }
    if (headers.includes('date') && headers.includes('amount') && headers.includes('payee')) {
      return 'bankStatement'
    }

    return null
  }

  // Process multiple CSV files
  const handleFilesUpload = async (files: FileList) => {
    setProcessingFiles(true)
    setError(null)

    let newData: ImportedData = importedData || createEmptyImportedData()
    const processedTypes: string[] = []
    const errors: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Skip non-CSV files
        if (!file.name.endsWith('.csv')) {
          errors.push(`Skipped ${file.name}: Not a CSV file`)
          continue
        }

        const csvText = await file.text()
        const detectedType = detectCSVType(csvText)

        if (!detectedType) {
          errors.push(`Could not detect type for ${file.name}`)
          continue
        }

        try {
          switch (detectedType) {
            case 'salesByDay':
              newData.salesByDay = parseSalesByDay(csvText)
              processedTypes.push('Sales by Day')
              break
            case 'salesByHour':
              newData.salesByHour = parseSalesByHour(csvText)
              processedTypes.push('Sales by Hour')
              break
            case 'salesByCategory':
              newData.salesByCategory = parseSalesByCategory(csvText)
              processedTypes.push('Sales by Category')
              break
            case 'salesByProduct':
              newData.salesByProduct = parseSalesByProduct(csvText)
              processedTypes.push('Sales by Product')
              break
            case 'bankStatement':
              const transactions = parseBankStatement(csvText)
              newData.bankTransactions = transactions
              newData.supplierPurchases = extractSupplierPurchases(transactions)
              processedTypes.push('Bank Statement')
              break
          }
        } catch (err) {
          errors.push(`Error parsing ${file.name}: ${err}`)
        }
      }

      // Update date range
      if (newData.salesByDay.length > 0) {
        newData.dateRange = {
          start: newData.salesByDay[0].date,
          end: newData.salesByDay[newData.salesByDay.length - 1].date,
        }
      }

      newData.lastUpdated = new Date().toISOString()

      // Save to IndexedDB
      await saveFinanceData(newData)
      setImportedData(newData)
      updateImportStatus(newData)

      // Show success/error messages
      if (processedTypes.length > 0 && errors.length === 0) {
        setError(null)
      } else if (errors.length > 0) {
        setError(errors.join('; '))
      }
    } catch (err) {
      console.error('Error processing files:', err)
      setError(`Failed to process files: ${err}`)
    } finally {
      setProcessingFiles(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFilesUpload(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesUpload(files)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleClearData = async () => {
    try {
      await clearFinanceData()
      setImportedData(null)
      setImportStatus({
        salesByDay: false,
        salesByHour: false,
        salesByCategory: false,
        salesByProduct: false,
        bankStatement: false,
      })
      setClearDialogOpen(false)
    } catch (err) {
      console.error('Error clearing data:', err)
      setError('Failed to clear data')
    }
  }

  const createEmptyImportedData = (): ImportedData => ({
    salesByDay: [],
    salesByHour: [],
    salesByCategory: [],
    salesByProduct: [],
    bankTransactions: [],
    supplierPurchases: [],
    lastUpdated: new Date().toISOString(),
    dateRange: {
      start: '',
      end: '',
    },
  })

  const metrics = importedData ? calculateMetrics(importedData) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading Financial Data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Financial Data</h2>
          <p className="text-muted-foreground text-lg">
            Import CSV data from Tabin POS and bank statements to analyze revenue, COGS, and profitability
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}


      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalOrders} orders • ${metrics.averageOrderValue.toFixed(2)} avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalCOGS.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {importedData?.supplierPurchases.length || 0} supplier purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.grossProfit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Revenue - COGS</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.grossMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Profit / Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {metrics && importedData && (
        <>
          <FinanceCharts metrics={metrics} data={importedData} />
          <FinanceDataTables data={importedData} metrics={metrics} />
        </>
      )}

      {/* Upload Wizard */}
      <UploadFinanceWizard
        isOpen={showUploadWizard}
        onClose={() => setShowUploadWizard(false)}
        onSuccess={loadFinanceData}
        existingData={importedData}
      />

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Financial Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all imported CSV data from your device. This action cannot be
              undone. You will need to re-import all CSV files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
