// CSV Parsers for Finance Module
import type {
  SalesByProduct,
  SalesByCategory,
  SalesByHour,
  SalesByDay,
  BankTransaction,
  SupplierPurchase,
} from '@/types/finance'

/**
 * Helper function to parse currency strings to numbers
 * Handles formats like "$1,234.56" or "-$1,234.56"
 */
function parseCurrency(value: string): number {
  if (!value || value === '$0.00' || value === '0' || value === '') return 0

  // Remove $ and commas, handle negative values
  const cleaned = value.replace(/[\$,]/g, '').trim()
  return parseFloat(cleaned) || 0
}

/**
 * Helper function to parse percentage strings
 * Handles formats like "15.25%" or "0.00%"
 */
function parsePercentage(value: string): number {
  if (!value || value === '0.00%' || value === '0%') return 0

  const cleaned = value.replace('%', '').trim()
  return parseFloat(cleaned) || 0
}

/**
 * Parse CSV text into array of rows
 * Handles both comma-separated and tab-separated formats
 */
function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n')
  const rows: string[][] = []

  // Detect delimiter (tab or comma) from first line
  const firstLine = lines[0] || ''
  const hasTab = firstLine.includes('\t')
  const hasComma = firstLine.includes(',')

  // Prefer tab if present, otherwise use comma
  const delimiter = hasTab ? '\t' : ','

  for (const line of lines) {
    // For tab-separated, just split by tabs (simpler, no quotes needed)
    if (delimiter === '\t') {
      const row = line.split('\t').map(field => field.trim())
      rows.push(row)
    } else {
      // Handle quoted fields that may contain commas
      const row: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      row.push(current.trim())
      rows.push(row)
    }
  }

  return rows
}

/**
 * Parse Sales by Product CSV
 * Format: Product,Quantity,Tax,Total,% Of Sale
 */
export function parseSalesByProduct(csvText: string): SalesByProduct[] {
  const rows = parseCSV(csvText)
  const data: SalesByProduct[] = []

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const [product, quantity, tax, total, percentOfSale] = rows[i]

    if (!product) continue

    data.push({
      product: product.trim(),
      quantity: parseInt(quantity) || 0,
      tax: parseCurrency(tax),
      total: parseCurrency(total),
      percentOfSale: parsePercentage(percentOfSale),
    })
  }

  return data
}

/**
 * Parse Sales by Category CSV
 * Format: Category,Quantity,Tax,Total,% Of Sale
 */
export function parseSalesByCategory(csvText: string): SalesByCategory[] {
  const rows = parseCSV(csvText)
  const data: SalesByCategory[] = []

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const [category, quantity, tax, total, percentOfSale] = rows[i]

    if (!category) continue

    data.push({
      category: category.trim(),
      quantity: parseInt(quantity) || 0,
      tax: parseCurrency(tax),
      total: parseCurrency(total),
      percentOfSale: parsePercentage(percentOfSale),
    })
  }

  return data
}

/**
 * Parse Sales by Hour CSV
 * Format: Time,Orders,Cash,Eftpos,Online,On Account,Uber Eats,Menulog,Doordash,Delivereasy,Eftpos Surcharge,Tax,Total
 */
export function parseSalesByHour(csvText: string): SalesByHour[] {
  const rows = parseCSV(csvText)
  const data: SalesByHour[] = []

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const [
      time,
      orders,
      cash,
      eftpos,
      online,
      onAccount,
      uberEats,
      menulog,
      doordash,
      delivereasy,
      eftposSurcharge,
      tax,
      total,
    ] = rows[i]

    if (!time) continue

    data.push({
      time: time.trim(),
      orders: parseInt(orders) || 0,
      cash: parseCurrency(cash),
      eftpos: parseCurrency(eftpos),
      online: parseCurrency(online),
      onAccount: parseCurrency(onAccount),
      uberEats: parseCurrency(uberEats),
      menulog: parseCurrency(menulog),
      doordash: parseCurrency(doordash),
      delivereasy: parseCurrency(delivereasy),
      eftposSurcharge: parseCurrency(eftposSurcharge),
      tax: parseCurrency(tax),
      total: parseCurrency(total),
    })
  }

  return data
}

/**
 * Parse Sales by Day CSV
 * Format: Date,Orders,Cash,Eftpos,Online,On Account,Uber Eats,Menulog,Doordash,Delivereasy,Eftpos Surcharge,Discounts,Refunds,Tax,Total
 */
export function parseSalesByDay(csvText: string): SalesByDay[] {
  const rows = parseCSV(csvText)
  const data: SalesByDay[] = []

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const [
      date,
      orders,
      cash,
      eftpos,
      online,
      onAccount,
      uberEats,
      menulog,
      doordash,
      delivereasy,
      eftposSurcharge,
      discounts,
      refunds,
      tax,
      total,
    ] = rows[i]

    if (!date) continue

    data.push({
      date: date.trim(),
      orders: parseInt(orders) || 0,
      cash: parseCurrency(cash),
      eftpos: parseCurrency(eftpos),
      online: parseCurrency(online),
      onAccount: parseCurrency(onAccount),
      uberEats: parseCurrency(uberEats),
      menulog: parseCurrency(menulog),
      doordash: parseCurrency(doordash),
      delivereasy: parseCurrency(delivereasy),
      eftposSurcharge: parseCurrency(eftposSurcharge),
      discounts: parseCurrency(discounts),
      refunds: parseCurrency(refunds),
      tax: parseCurrency(tax),
      total: parseCurrency(total),
    })
  }

  return data
}

/**
 * Parse Bank Statement CSV
 * Format: Date,Amount,Payee
 * Classifies transactions as income or expense based on amount sign
 */
export function parseBankStatement(csvText: string): BankTransaction[] {
  const rows = parseCSV(csvText)
  const data: BankTransaction[] = []

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const [date, amount, payee] = rows[i]

    if (!date || !amount || !payee) continue

    const amountValue = parseCurrency(amount)

    data.push({
      date: date.trim(),
      amount: Math.abs(amountValue),
      payee: payee.trim(),
      type: amountValue >= 0 ? 'income' : 'expense',
    })
  }

  return data
}

/**
 * Extract supplier purchases from bank transactions
 * Identifies major suppliers like Gilmours, Davis Trading, etc.
 */
export function extractSupplierPurchases(
  transactions: BankTransaction[]
): SupplierPurchase[] {
  // List of known suppliers
  const supplierKeywords = [
    'GILMOURS',
    'DAVIS TRADING',
    'MEXI-CAN',
    'MONUMENT',
    'FOODSTUFFS',
  ]

  const purchases: SupplierPurchase[] = []

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue

    // Check if payee matches any supplier keyword
    const supplier = supplierKeywords.find((keyword) =>
      transaction.payee.toUpperCase().includes(keyword)
    )

    if (supplier) {
      purchases.push({
        date: transaction.date,
        supplier: transaction.payee,
        amount: transaction.amount,
      })
    }
  }

  return purchases
}

/**
 * Validate CSV file content before parsing
 */
export function validateCSVFormat(
  csvText: string,
  expectedHeaders: string[]
): { valid: boolean; error?: string } {
  if (!csvText || csvText.trim().length === 0) {
    return { valid: false, error: 'File is empty' }
  }

  const rows = parseCSV(csvText)
  if (rows.length < 2) {
    return { valid: false, error: 'File must have at least a header and one data row' }
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase())
  const missingHeaders = expectedHeaders.filter(
    (expected) => !headers.some((h) => h.toLowerCase().includes(expected.toLowerCase()))
  )

  if (missingHeaders.length > 0) {
    return {
      valid: false,
      error: `Missing required headers: ${missingHeaders.join(', ')}`,
    }
  }

  return { valid: true }
}
