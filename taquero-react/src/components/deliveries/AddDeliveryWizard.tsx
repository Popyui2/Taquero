import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/store/authStore'
import { useDeliveriesStore, saveDeliveryToGoogleSheets } from '@/store/deliveriesStore'
import { DeliveryRecord } from '@/types'
import { Loader2, AlertTriangle, Thermometer, X } from 'lucide-react'
import { format } from 'date-fns'

interface AddDeliveryWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: DeliveryRecord | null
}

export function AddDeliveryWizard({ open, onClose, onSuccess, editingRecord }: AddDeliveryWizardProps) {
  const { currentUser } = useAuthStore()
  const { addDelivery, updateDelivery } = useDeliveriesStore()
  const [step, setStep] = useState(1)

  // Step 1: Supplier Info
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')

  // Step 2: Delivery Details
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [batchLotId, setBatchLotId] = useState('')
  const [typeOfFood, setTypeOfFood] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<'kg' | 'L' | 'units' | 'boxes' | 'trays'>('kg')

  // Step 3: Temperature Check
  const [requiresTempCheck, setRequiresTempCheck] = useState<boolean | null>(null)
  const [temperature, setTemperature] = useState('')

  // Step 4: Review & Submit
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempWarning, setTempWarning] = useState<string | null>(null)

  const isEditing = !!editingRecord
  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setSupplierName(editingRecord.supplierName)
      setSupplierContact(editingRecord.supplierContact)
      setDeliveryDate(editingRecord.deliveryDate)
      setBatchLotId(editingRecord.batchLotId || '')
      setTypeOfFood(editingRecord.typeOfFood)
      setQuantity(editingRecord.quantity.toString())
      setUnit(editingRecord.unit)
      setRequiresTempCheck(editingRecord.requiresTempCheck)
      setTemperature(editingRecord.temperature !== undefined ? editingRecord.temperature.toString() : '')
      setNotes(editingRecord.notes || '')
    }
  }, [editingRecord, open])

  // Reset form
  const resetForm = () => {
    setStep(1)
    setSupplierName('')
    setSupplierContact('')
    setDeliveryDate(format(new Date(), 'yyyy-MM-dd'))
    setBatchLotId('')
    setTypeOfFood('')
    setQuantity('')
    setUnit('kg')
    setRequiresTempCheck(null)
    setTemperature('')
    setNotes('')
    setTempWarning(null)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  // Temperature validation
  useEffect(() => {
    if (requiresTempCheck && temperature) {
      const temp = parseFloat(temperature)
      if (!isNaN(temp)) {
        if (temp > 5 && temp < 60) {
          setTempWarning('⚠️ Temperature is in the danger zone (5°C - 60°C). Please verify before accepting.')
        } else {
          setTempWarning(null)
        }
      }
    } else {
      setTempWarning(null)
    }
  }, [temperature, requiresTempCheck])

  // Save handler
  const handleSave = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)

    try {
      const quantityNum = parseFloat(quantity)
      const tempNum = requiresTempCheck && temperature ? parseFloat(temperature) : undefined

      if (isEditing && editingRecord) {
        const updatedRecord: DeliveryRecord = {
          ...editingRecord,
          supplierName,
          supplierContact,
          deliveryDate,
          batchLotId: batchLotId.trim() || undefined,
          typeOfFood,
          quantity: quantityNum,
          unit,
          requiresTempCheck: requiresTempCheck || false,
          temperature: tempNum,
          taskDoneBy: currentUser.name,
          notes: notes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        }

        await saveDeliveryToGoogleSheets(updatedRecord)
        updateDelivery(editingRecord.id, {
          supplierName,
          supplierContact,
          deliveryDate,
          batchLotId: batchLotId.trim() || undefined,
          typeOfFood,
          quantity: quantityNum,
          unit,
          requiresTempCheck: requiresTempCheck || false,
          temperature: tempNum,
          taskDoneBy: currentUser.name,
          notes: notes.trim() || undefined,
        })
      } else {
        const recordId = `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: DeliveryRecord = {
          id: recordId,
          supplierName,
          supplierContact,
          deliveryDate,
          batchLotId: batchLotId.trim() || undefined,
          typeOfFood,
          quantity: quantityNum,
          unit,
          requiresTempCheck: requiresTempCheck || false,
          temperature: tempNum,
          taskDoneBy: currentUser.name,
          notes: notes.trim() || undefined,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        await saveDeliveryToGoogleSheets(newRecord)
        addDelivery(newRecord)
      }

      onSuccess?.()
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error saving delivery:', error)
      alert('Error saving delivery record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validation
  const canProceedFromStep1 = supplierName.trim().length > 0 && supplierContact.trim().length > 0
  const canProceedFromStep2 = deliveryDate && typeOfFood.trim().length > 0 && quantity && parseFloat(quantity) > 0
  const canProceedFromStep3 = requiresTempCheck !== null && (!requiresTempCheck || (temperature && !isNaN(parseFloat(temperature))))
  const canSubmit = canProceedFromStep1 && canProceedFromStep2 && canProceedFromStep3

  const handleNext = () => {
    if (step === 1 && canProceedFromStep1) {
      setStep(2)
    } else if (step === 2 && canProceedFromStep2) {
      setStep(3)
    } else if (step === 3 && canProceedFromStep3) {
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
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
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step 1: Supplier Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Step 1: Supplier Information</h3>
              <p className="text-muted-foreground">
                Enter the supplier name and contact details
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="supplierName" className="text-lg">
                  Supplier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="h-16 text-xl mt-2"
                  placeholder="e.g., Farmods"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="supplierContact" className="text-lg">
                  Supplier Contact <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplierContact"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  className="h-16 text-xl mt-2"
                  placeholder="e.g., south farm townsville, or phone/email"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Delivery Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Step 2: Delivery Details</h3>
              <p className="text-muted-foreground">
                Record delivery date, batch ID, and quantity
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="deliveryDate" className="text-lg">
                  Delivery Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="h-16 text-xl mt-2"
                />
              </div>

              <div>
                <Label htmlFor="batchLotId" className="text-lg">
                  Batch/Lot ID <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="batchLotId"
                  value={batchLotId}
                  onChange={(e) => setBatchLotId(e.target.value)}
                  className="h-16 text-xl mt-2"
                  placeholder="e.g., 4251708"
                />
              </div>

              <div>
                <Label htmlFor="typeOfFood" className="text-lg">
                  Type of Food <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="typeOfFood"
                  value={typeOfFood}
                  onChange={(e) => setTypeOfFood(e.target.value)}
                  className="h-16 text-xl mt-2"
                  placeholder="e.g., fresh chicken breast"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="text-lg">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-16 text-xl mt-2"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <Label htmlFor="unit" className="text-lg">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full h-16 text-xl mt-2 px-4 border rounded-md bg-background"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="units">units</option>
                    <option value="boxes">boxes</option>
                    <option value="trays">trays</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Temperature Check */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Step 3: Temperature Check</h3>
              <p className="text-muted-foreground">
                Does this food require temperature control?
              </p>
            </div>

            <div className="space-y-4">
              {/* Binary Card Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={`p-6 cursor-pointer border-2 transition-all ${
                    requiresTempCheck === true
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setRequiresTempCheck(true)}
                >
                  <div className="text-center">
                    <Thermometer className="h-12 w-12 mx-auto mb-2" />
                    <div className="text-lg font-semibold">YES</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Temperature control required
                    </div>
                  </div>
                </Card>

                <Card
                  className={`p-6 cursor-pointer border-2 transition-all ${
                    requiresTempCheck === false
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setRequiresTempCheck(false)
                    setTemperature('')
                    setTempWarning(null)
                  }}
                >
                  <div className="text-center">
                    <X className="h-12 w-12 mx-auto mb-2" />
                    <div className="text-lg font-semibold">NO</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Ambient/shelf-stable
                    </div>
                  </div>
                </Card>
              </div>

              {/* Temperature Input */}
              {requiresTempCheck === true && (
                <div className="mt-6">
                  <Label htmlFor="temperature" className="text-lg">
                    Temperature (°C) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="h-16 text-xl mt-2"
                    placeholder="e.g., 4"
                    autoFocus
                  />
                  {tempWarning && (
                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500 rounded-md flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-500">{tempWarning}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Safe ranges: ≤5°C (cold/frozen) or ≥60°C (hot)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Step 4: Review & Submit</h3>
              <p className="text-muted-foreground">
                Review the delivery details and add any notes
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">Supplier:</span> {supplierName}
                </div>
                <div>
                  <span className="font-semibold">Contact:</span> {supplierContact}
                </div>
                <div>
                  <span className="font-semibold">Date:</span>{' '}
                  {format(new Date(deliveryDate), 'MMMM d, yyyy')}
                </div>
                <div>
                  <span className="font-semibold">Batch/Lot:</span>{' '}
                  {batchLotId || 'Not provided'}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Food Type:</span> {typeOfFood}
                </div>
                <div>
                  <span className="font-semibold">Quantity:</span> {quantity} {unit}
                </div>
                <div>
                  <span className="font-semibold">Temp Check:</span>{' '}
                  {requiresTempCheck ? 'Yes' : 'No'}
                </div>
                {requiresTempCheck && temperature && (
                  <div className="col-span-2">
                    <span className="font-semibold">Temperature:</span> {temperature}°C
                    {tempWarning && <span className="text-red-500 ml-2">⚠️ Warning</span>}
                  </div>
                )}
                <div className="col-span-2">
                  <span className="font-semibold">Task Done By:</span> {currentUser?.name}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-lg">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-[100px]"
                placeholder="Any additional notes about this delivery..."
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
          )}

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
            <Button onClick={handleSave} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Delivery'
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
