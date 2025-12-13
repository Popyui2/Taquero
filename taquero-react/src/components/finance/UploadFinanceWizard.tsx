import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Loader2, X, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ImportedData, CSVImportStatus, UploadedFileInfo } from '@/types/finance'
import {
  parseSalesByProduct,
  parseSalesByCategory,
  parseSalesByHour,
  parseSalesByDay,
  parseBankStatement,
  extractSupplierPurchases,
} from '@/lib/finance/csvParsers'
import { saveCompanyDataset, getCompanyDataset } from '@/lib/finance/storage'
import { DatasetCards } from './DatasetCards'

type CSVType =
  | 'salesByDay'
  | 'salesByHour'
  | 'salesByCategory'
  | 'salesByProduct'
  | 'bankStatementRestaurant'
  | 'bankStatementCaravan'
  | 'bankStatementEcommerce'

interface UploadFinanceWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  existingData: ImportedData | null
}

export function UploadFinanceWizard({
  isOpen,
  onClose,
  onSuccess,
  existingData,
}: UploadFinanceWizardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<CSVImportStatus>({
    salesByDay: false,
    salesByHour: false,
    salesByCategory: false,
    salesByProduct: false,
    bankStatementRestaurant: false,
    bankStatementCaravan: false,
    bankStatementEcommerce: false,
  })
  const [errors, setErrors] = useState<string[]>([])
  const [dataset, setDataset] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadDataset()
    }
  }, [isOpen])

  const loadDataset = async () => {
    const data = await getCompanyDataset()
    setDataset(data)
  }

  // Auto-detect CSV type based on headers and filename
  const detectCSVType = (csvText: string, filename: string): CSVType | null => {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return null

    const headers = lines[0].toLowerCase()
    const filenameLower = filename.toLowerCase()

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
    // Detect bank statement type based on filename
    if (headers.includes('date') && headers.includes('amount') && headers.includes('payee')) {
      if (filenameLower.includes('hot-mexican') || filenameLower.includes('hot mexican')) {
        return 'bankStatementRestaurant'
      }
      if (filenameLower.includes('mexi-can') || filenameLower.includes('mexi can')) {
        return 'bankStatementCaravan'
      }
      if (filenameLower.includes('ecommerce') || filenameLower.includes('e-commerce')) {
        return 'bankStatementEcommerce'
      }
      // Default to restaurant if filename doesn't match
      return 'bankStatementRestaurant'
    }

    return null
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

  const handleFilesUpload = async (files: FileList) => {
    setProcessingFiles(true)
    setErrors([])

    let newData: ImportedData = createEmptyImportedData()
    const processedTypes: CSVType[] = []
    const errorMessages: string[] = []
    const newUploadStatus = { ...uploadStatus }
    const uploadedFiles: UploadedFileInfo[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.name.endsWith('.csv')) {
          errorMessages.push(`${file.name}: Not a CSV file`)
          continue
        }

        const csvText = await file.text()
        const detectedType = detectCSVType(csvText, file.name)

        if (!detectedType) {
          errorMessages.push(`${file.name}: Could not detect file type`)
          continue
        }

        const lines = csvText.trim().split('\n')
        const rowCount = lines.length - 1 // Exclude header

        try {
          switch (detectedType) {
            case 'salesByDay':
              newData.salesByDay = parseSalesByDay(csvText)
              processedTypes.push('salesByDay')
              newUploadStatus.salesByDay = true
              uploadedFiles.push({ name: file.name, type: 'POS', rows: rowCount })
              break
            case 'salesByHour':
              newData.salesByHour = parseSalesByHour(csvText)
              processedTypes.push('salesByHour')
              newUploadStatus.salesByHour = true
              uploadedFiles.push({ name: file.name, type: 'POS', rows: rowCount })
              break
            case 'salesByCategory':
              newData.salesByCategory = parseSalesByCategory(csvText)
              processedTypes.push('salesByCategory')
              newUploadStatus.salesByCategory = true
              uploadedFiles.push({ name: file.name, type: 'POS', rows: rowCount })
              break
            case 'salesByProduct':
              newData.salesByProduct = parseSalesByProduct(csvText)
              processedTypes.push('salesByProduct')
              newUploadStatus.salesByProduct = true
              uploadedFiles.push({ name: file.name, type: 'POS', rows: rowCount })
              break
            case 'bankStatementRestaurant':
            case 'bankStatementCaravan':
            case 'bankStatementEcommerce':
              const transactions = parseBankStatement(csvText)
              newData.bankTransactions = [...newData.bankTransactions, ...transactions]
              newData.supplierPurchases = extractSupplierPurchases(newData.bankTransactions)
              processedTypes.push(detectedType)
              if (detectedType === 'bankStatementRestaurant') newUploadStatus.bankStatementRestaurant = true
              if (detectedType === 'bankStatementCaravan') newUploadStatus.bankStatementCaravan = true
              if (detectedType === 'bankStatementEcommerce') newUploadStatus.bankStatementEcommerce = true
              uploadedFiles.push({ name: file.name, type: 'Bank', rows: rowCount })
              break
          }
        } catch (err) {
          errorMessages.push(`${file.name}: Parse error - ${err}`)
        }
      }

      if (newData.salesByDay.length > 0) {
        newData.dateRange = {
          start: newData.salesByDay[0].date,
          end: newData.salesByDay[newData.salesByDay.length - 1].date,
        }
      }

      newData.lastUpdated = new Date().toISOString()

      // Save to company dataset
      await saveCompanyDataset(newData, uploadedFiles)

      setUploadStatus(newUploadStatus)
      setErrors(errorMessages)

      if (processedTypes.length > 0) {
        await loadDataset()
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 1500)
      }
    } catch (err) {
      setErrors([`Failed to process files: ${err}`])
    } finally {
      setProcessingFiles(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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

  const handleClose = () => {
    setUploadStatus({
      salesByDay: false,
      salesByHour: false,
      salesByCategory: false,
      salesByProduct: false,
      bankStatementRestaurant: false,
      bankStatementCaravan: false,
      bankStatementEcommerce: false,
    })
    setErrors([])
    onClose()
  }

  const csvTypes = [
    { key: 'salesByDay' as keyof CSVImportStatus, label: 'Sales by Day' },
    { key: 'salesByHour' as keyof CSVImportStatus, label: 'Sales by Hour' },
    { key: 'salesByCategory' as keyof CSVImportStatus, label: 'Sales by Category' },
    { key: 'salesByProduct' as keyof CSVImportStatus, label: 'Sales by Product' },
    { key: 'bankStatementRestaurant' as keyof CSVImportStatus, label: 'Bank - Restaurant' },
    { key: 'bankStatementCaravan' as keyof CSVImportStatus, label: 'Bank - Caravan' },
    { key: 'bankStatementEcommerce' as keyof CSVImportStatus, label: 'Bank - E-commerce' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Financial Data</DialogTitle>
          <DialogDescription>
            Upload all CSV files from Tabin POS (Sales_By_*.csv) and your bank statements (Hot-Mexican-*.csv, MEXI-CAN-*.csv). All files will be processed together as one company dataset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
              isDragging
                ? 'border-foreground bg-foreground/5'
                : 'border-muted-foreground/25 hover:border-foreground/50'
            }`}
          >
            <Upload className={`h-12 w-12 mb-3 ${isDragging ? 'text-foreground' : 'text-muted-foreground'}`} />
            <div className="text-center space-y-2">
              <h3 className="font-medium">
                {isDragging ? 'Drop files here' : 'Drag & Drop CSV Files'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload all 6 files together (4 POS sales + 2 bank statements)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Button onClick={handleBrowseClick} disabled={processingFiles} variant="outline" className="mt-2">
                {processingFiles ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Files
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Upload Status */}
          {Object.values(uploadStatus).some(v => v) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Files Status:</h4>
              <div className="grid grid-cols-2 gap-2">
                {csvTypes.map((type) => (
                  <div
                    key={type.key}
                    className={`flex items-center space-x-2 p-2 rounded-md border text-sm ${
                      uploadStatus[type.key]
                        ? 'bg-foreground/5 border-foreground/20'
                        : 'bg-muted/50 border-muted'
                    }`}
                  >
                    {uploadStatus[type.key] ? (
                      <CheckCircle2 className="h-4 w-4 text-foreground" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className={uploadStatus[type.key] ? 'font-medium' : 'text-muted-foreground'}>
                      {type.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">Errors:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Current Dataset</span>
            </div>
          </div>

          {/* Dataset Cards */}
          <DatasetCards dataset={dataset} onDatasetDeleted={loadDataset} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
