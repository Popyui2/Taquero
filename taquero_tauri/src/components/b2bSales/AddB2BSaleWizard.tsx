import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuthStore } from '@/store/authStore'
import { useB2BSalesStore, saveB2BSaleToGoogleSheets } from '@/store/b2bSalesStore'
import { B2BSaleRecord, B2BUnit } from '@/types'
import { Loader2 } from 'lucide-react'

interface AddB2BSaleWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: B2BSaleRecord | null
}

const B2B_UNITS: B2BUnit[] = ['units', 'kg', 'L', 'boxes', 'trays', 'dozen']

export function AddB2BSaleWizard({
  open,
  onClose,
  onSuccess,
  editingRecord,
}: AddB2BSaleWizardProps) {
  const { currentUser } = useAuthStore()
  const { addRecord, updateRecord } = useB2BSalesStore()

  const [step, setStep] = useState(1)

  // Step 1: Business Details
  const [businessName, setBusinessName] = useState('')
  const [contactDetails, setContactDetails] = useState('')

  // Step 2: Product Details
  const [productSupplied, setProductSupplied] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<B2BUnit>('units')

  // Step 3: Supply Date
  const [dateSupplied, setDateSupplied] = useState('')

  // Step 4: Review & Notes
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord
  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  // Helper function to convert ISO date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

  // Helper function to convert DD/MM/YYYY to ISO date
  const formatDateToISO = (ddmmyyyy: string) => {
    const [day, month, year] = ddmmyyyy.split('/')
    return `${year}-${month}-${day}`
  }

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setBusinessName(editingRecord.businessName)
      setContactDetails(editingRecord.contactDetails)
      setProductSupplied(editingRecord.productSupplied)
      setQuantity(editingRecord.quantity.toString())
      setUnit(editingRecord.unit)
      setDateSupplied(formatDateToDDMMYYYY(editingRecord.dateSupplied))
      setNotes(editingRecord.notes || '')
    }
  }, [editingRecord, open])

  // Set default date to today when dialog opens (only for new records)
  useEffect(() => {
    if (open && !editingRecord) {
      const today = new Date().toISOString().split('T')[0]
      setDateSupplied(formatDateToDDMMYYYY(today))
    }
  }, [open, editingRecord])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetForm()
      }, 200)
    }
  }, [open])

  const resetForm = () => {
    setStep(1)
    setBusinessName('')
    setContactDetails('')
    setProductSupplied('')
    setQuantity('')
    setUnit('units')
    setDateSupplied('')
    setNotes('')
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  // Save record
  const handleSave = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && editingRecord) {
        // Update existing record
        const updatedRecord: B2BSaleRecord = {
          ...editingRecord,
          businessName: businessName.trim(),
          contactDetails: contactDetails.trim(),
          productSupplied: productSupplied.trim(),
          quantity: parseFloat(quantity),
          unit,
          dateSupplied: formatDateToISO(dateSupplied),
          notes: notes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        }

        await saveB2BSaleToGoogleSheets(updatedRecord)
        updateRecord(editingRecord.id, {
          businessName: businessName.trim(),
          contactDetails: contactDetails.trim(),
          productSupplied: productSupplied.trim(),
          quantity: parseFloat(quantity),
          unit,
          dateSupplied: formatDateToISO(dateSupplied),
          notes: notes.trim() || undefined,
        })
      } else {
        // Create new record
        const recordId = `b2b-sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: B2BSaleRecord = {
          id: recordId,
          businessName: businessName.trim(),
          contactDetails: contactDetails.trim(),
          productSupplied: productSupplied.trim(),
          quantity: parseFloat(quantity),
          unit,
          dateSupplied: formatDateToISO(dateSupplied),
          taskDoneBy: currentUser.name,
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        await saveB2BSaleToGoogleSheets(newRecord)
        addRecord(newRecord)
      }

      onSuccess?.()
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error saving B2B sale:', error)
      alert('Error saving B2B sale record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validation for each step
  const canProceedFromStep1 = businessName.trim().length > 0 && contactDetails.trim().length > 0
  const canProceedFromStep2 =
    productSupplied.trim().length > 0 &&
    quantity.trim().length > 0 &&
    !isNaN(parseFloat(quantity)) &&
    parseFloat(quantity) > 0
  const canProceedFromStep3 = dateSupplied.length > 0

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? 'Edit B2B Sale Record' : 'Record Business Sale'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step 1: Business Details */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Details</h3>
              <p className="text-sm text-muted-foreground">
                Enter the name and contact details of the business customer
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., PJ's Burger Truck"
                    className="h-16 text-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactDetails">Contact Details</Label>
                  <Textarea
                    id="contactDetails"
                    value={contactDetails}
                    onChange={(e) => setContactDetails(e.target.value)}
                    placeholder="Address, phone, email&#10;e.g., 123 Main Street, Auckland. 027 345 789"
                    className="text-base min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Product Details */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Details</h3>
              <p className="text-sm text-muted-foreground">
                Enter what product you supplied and how much
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productSupplied">Product Supplied</Label>
                  <Input
                    id="productSupplied"
                    value={productSupplied}
                    onChange={(e) => setProductSupplied(e.target.value)}
                    placeholder="e.g., burger buns, pastries, sauces"
                    className="h-16 text-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g., 200"
                      className="h-16 text-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <select
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as B2BUnit)}
                      className="flex h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xl ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {B2B_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Supply Date */}
        {step === 3 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Supply Date</h3>
              <p className="text-sm text-muted-foreground">
                When was this product supplied to the business?
              </p>

              <div className="space-y-2">
                <Label htmlFor="dateSupplied">Date Supplied</Label>
                <DatePicker
                  value={dateSupplied}
                  onChange={setDateSupplied}
                  placeholder="DD/MM/YYYY"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Please review the B2B sale details before submitting
              </p>

              <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Business Name</p>
                    <p className="font-medium">{businessName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date Supplied</p>
                    <p className="font-medium">{formatDate(dateSupplied)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Contact Details</p>
                    <p className="font-medium text-sm whitespace-pre-line">{contactDetails}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Product Supplied</p>
                    <p className="font-medium">{productSupplied}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-medium">
                      {quantity} {unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Task Done By</p>
                    <p className="font-medium">{currentUser?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about this sale..."
                  className="text-base min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={step === 1 ? handleClose : handleBack} disabled={isSubmitting}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !canProceedFromStep1) ||
                (step === 2 && !canProceedFromStep2) ||
                (step === 3 && !canProceedFromStep3)
              }
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Sale'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
