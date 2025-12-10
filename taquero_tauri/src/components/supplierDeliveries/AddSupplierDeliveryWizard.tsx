import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuthStore } from '@/store/authStore'
import { useSuppliersDeliveriesStore, saveDeliveryToGoogleSheets } from '@/store/suppliersDeliveriesStore'
import { SupplierDeliveryRecord, DeliveryUnit } from '@/types'
import { Loader2, ThermometerSnowflake, Thermometer, AlertTriangle } from 'lucide-react'

const formatDateToDDMMYYYY = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const formatDateToISO = (ddmmyyyy: string) => {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month}-${day}`
}

interface AddSupplierDeliveryWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: SupplierDeliveryRecord | null
}

const DELIVERY_UNITS: DeliveryUnit[] = ['kg', 'L', 'units', 'boxes', 'trays']

export function AddSupplierDeliveryWizard({
  open,
  onClose,
  onSuccess,
  editingRecord,
}: AddSupplierDeliveryWizardProps) {
  const { currentUser } = useAuthStore()
  const { addRecord, updateRecord } = useSuppliersDeliveriesStore()

  const [step, setStep] = useState(1)

  // Step 1: Supplier Details
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')

  // Step 2: Delivery Details
  const [deliveryDate, setDeliveryDate] = useState('')
  const [batchLotId, setBatchLotId] = useState('')
  const [typeOfFood, setTypeOfFood] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<DeliveryUnit>('kg')

  // Step 3: Temperature Check
  const [requiresTempCheck, setRequiresTempCheck] = useState<boolean | null>(null)
  const [temperature, setTemperature] = useState('')
  const [showTempWarning, setShowTempWarning] = useState(false)
  const [tempWarningMessage, setTempWarningMessage] = useState('')

  // Step 4: Review & Notes
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord
  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setSupplierName(editingRecord.supplierName)
      setSupplierContact(editingRecord.supplierContact)
      setDeliveryDate(formatDateToDDMMYYYY(editingRecord.deliveryDate))
      setBatchLotId(editingRecord.batchLotId || '')
      setTypeOfFood(editingRecord.typeOfFood)
      setQuantity(editingRecord.quantity.toString())
      setUnit(editingRecord.unit)
      setRequiresTempCheck(editingRecord.requiresTempCheck)
      setTemperature(editingRecord.temperature?.toString() || '')
      setNotes(editingRecord.notes || '')
    }
  }, [editingRecord, open])

  // Set default date to today when dialog opens (only for new records)
  useEffect(() => {
    if (open && !editingRecord) {
      const today = formatDateToDDMMYYYY(new Date().toISOString().split('T')[0])
      setDeliveryDate(today)
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
    setSupplierName('')
    setSupplierContact('')
    setDeliveryDate('')
    setBatchLotId('')
    setTypeOfFood('')
    setQuantity('')
    setUnit('kg')
    setRequiresTempCheck(null)
    setTemperature('')
    setNotes('')
    setShowTempWarning(false)
    setTempWarningMessage('')
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

  // Temperature validation (warnings only, not blocking)
  useEffect(() => {
    if (requiresTempCheck && temperature) {
      const tempValue = parseFloat(temperature)
      if (!isNaN(tempValue)) {
        // Cold food warning: >5°C
        if (tempValue >= 0 && tempValue > 5) {
          setShowTempWarning(true)
          setTempWarningMessage('⚠️ Cold food should be stored at 5°C or below')
        }
        // Frozen food warning: >-18°C
        else if (tempValue < 0 && tempValue > -18) {
          setShowTempWarning(true)
          setTempWarningMessage('⚠️ Frozen food should be stored at -18°C or below')
        } else {
          setShowTempWarning(false)
          setTempWarningMessage('')
        }
      }
    } else {
      setShowTempWarning(false)
      setTempWarningMessage('')
    }
  }, [temperature, requiresTempCheck])

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
        const updatedRecord: SupplierDeliveryRecord = {
          ...editingRecord,
          deliveryDate: formatDateToISO(deliveryDate),
          supplierName: supplierName.trim(),
          supplierContact: supplierContact.trim(),
          batchLotId: batchLotId.trim() || undefined,
          typeOfFood: typeOfFood.trim(),
          quantity: parseFloat(quantity),
          unit,
          requiresTempCheck: requiresTempCheck!,
          temperature: requiresTempCheck ? parseFloat(temperature) : undefined,
          notes: notes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        }

        await saveDeliveryToGoogleSheets(updatedRecord)
        updateRecord(editingRecord.id, {
          deliveryDate: formatDateToISO(deliveryDate),
          supplierName: supplierName.trim(),
          supplierContact: supplierContact.trim(),
          batchLotId: batchLotId.trim() || undefined,
          typeOfFood: typeOfFood.trim(),
          quantity: parseFloat(quantity),
          unit,
          requiresTempCheck: requiresTempCheck!,
          temperature: requiresTempCheck ? parseFloat(temperature) : undefined,
          notes: notes.trim() || undefined,
        })
      } else {
        // Create new record
        const recordId = `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: SupplierDeliveryRecord = {
          id: recordId,
          deliveryDate: formatDateToISO(deliveryDate),
          supplierName: supplierName.trim(),
          supplierContact: supplierContact.trim(),
          batchLotId: batchLotId.trim() || undefined,
          typeOfFood: typeOfFood.trim(),
          quantity: parseFloat(quantity),
          unit,
          requiresTempCheck: requiresTempCheck!,
          temperature: requiresTempCheck ? parseFloat(temperature) : undefined,
          taskDoneBy: currentUser.name,
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        await saveDeliveryToGoogleSheets(newRecord)
        addRecord(newRecord)
      }

      onSuccess?.()
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error saving delivery record:', error)
      alert('Error saving delivery record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validation for each step
  const canProceedFromStep1 = supplierName.trim().length > 0 && supplierContact.trim().length > 0
  const canProceedFromStep2 =
    deliveryDate.length > 0 &&
    typeOfFood.trim().length > 0 &&
    quantity.trim().length > 0 &&
    !isNaN(parseFloat(quantity)) &&
    parseFloat(quantity) > 0
  const canProceedFromStep3 =
    requiresTempCheck !== null &&
    (!requiresTempCheck || (temperature.trim().length > 0 && !isNaN(parseFloat(temperature))))

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? 'Edit Delivery Record' : 'Record Supplier Delivery'}
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

        {/* Step 1: Supplier Details */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Supplier Details</h3>
              <p className="text-sm text-muted-foreground">
                Enter the name and contact details of the supplier
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Supplier Name</Label>
                  <Input
                    id="supplierName"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g., Farmods, Fresh Foods Ltd"
                    className="h-16 text-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierContact">Supplier Contact Details</Label>
                  <Input
                    id="supplierContact"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    placeholder="e.g., South Farm Townsville, Ph: 09-123-4567"
                    className="h-16 text-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Delivery Details */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Delivery Details</h3>
              <p className="text-sm text-muted-foreground">Record what was delivered and when</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <DatePicker
                    value={deliveryDate}
                    onChange={setDeliveryDate}
                    placeholder="DD/MM/YYYY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchLotId">Batch / Lot ID (optional)</Label>
                  <Input
                    id="batchLotId"
                    value={batchLotId}
                    onChange={(e) => setBatchLotId(e.target.value)}
                    placeholder="e.g., 4251708"
                    className="h-16 text-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found on delivery invoice or product label
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeOfFood">Type of Food</Label>
                  <Input
                    id="typeOfFood"
                    value={typeOfFood}
                    onChange={(e) => setTypeOfFood(e.target.value)}
                    placeholder="e.g., fresh chicken breast, vegetables, milk"
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
                      placeholder="e.g., 5"
                      className="h-16 text-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <select
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as DeliveryUnit)}
                      className="flex h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xl ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {DELIVERY_UNITS.map((u) => (
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

        {/* Step 3: Temperature Check */}
        {step === 3 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Temperature Check</h3>
              <p className="text-sm text-muted-foreground">
                Does this food require temperature control?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`p-6 cursor-pointer transition-all border-2 ${
                    requiresTempCheck === true
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setRequiresTempCheck(true)}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Thermometer className="h-12 w-12" />
                    <div>
                      <p className="font-semibold text-lg">YES</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cold, frozen, or hot food
                      </p>
                    </div>
                  </div>
                </Card>

                <Card
                  className={`p-6 cursor-pointer transition-all border-2 ${
                    requiresTempCheck === false
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setRequiresTempCheck(false)}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <ThermometerSnowflake className="h-12 w-12" />
                    <div>
                      <p className="font-semibold text-lg">NO</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Shelf-stable food
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {requiresTempCheck === true && (
                <div className="space-y-2 pt-4">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="e.g., 4"
                    className="h-16 text-xl"
                  />

                  {showTempWarning && (
                    <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        {tempWarningMessage}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Please review the delivery details before submitting
              </p>

              <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Date</p>
                    <p className="font-medium">{formatDate(deliveryDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="font-medium">{supplierName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium">{supplierContact}</p>
                  </div>
                  {batchLotId && (
                    <div>
                      <p className="text-xs text-muted-foreground">Batch/Lot ID</p>
                      <p className="font-medium">{batchLotId}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Type of Food</p>
                    <p className="font-medium">{typeOfFood}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-medium">
                      {quantity} {unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temperature Check</p>
                    <p className="font-medium">
                      {requiresTempCheck
                        ? `${temperature}°C`
                        : 'Not required'}
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
                  placeholder="Any additional information about this delivery..."
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
                'Save Delivery'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
