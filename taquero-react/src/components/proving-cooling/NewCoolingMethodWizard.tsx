import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { useCoolingMethodStore, saveCoolingBatchToGoogleSheets } from '@/store/provingCoolingStore'
import { CoolingMethod, CoolingBatch } from '@/types'
import { Calendar, Clock, Snowflake, Thermometer } from 'lucide-react'

interface NewCoolingMethodWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewCoolingMethodWizard({ open, onClose, onSuccess }: NewCoolingMethodWizardProps) {
  const { currentUser } = useAuthStore()
  const { createMethod } = useCoolingMethodStore()

  // Current step (1-7)
  const [step, setStep] = useState(1)

  // Form data
  const [foodItem, setFoodItem] = useState('')
  const [coolingMethod, setCoolingMethod] = useState('')
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5))
  const [startTemp, setStartTemp] = useState('60')
  const [secondTimeCheck, setSecondTimeCheck] = useState('')
  const [secondTempCheck, setSecondTempCheck] = useState('')
  const [thirdTimeCheck, setThirdTimeCheck] = useState('')
  const [thirdTempCheck, setThirdTempCheck] = useState('')

  // Auto-filled date
  const [date] = useState(new Date().toISOString().split('T')[0])

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const totalSteps = 7
  const progress = (step / totalSteps) * 100

  // Reset form
  const resetForm = () => {
    setStep(1)
    setFoodItem('')
    setCoolingMethod('')
    setStartTime(new Date().toTimeString().slice(0, 5))
    setStartTemp('60')
    setSecondTimeCheck('')
    setSecondTempCheck('')
    setThirdTimeCheck('')
    setThirdTempCheck('')
    setHasPassedStep1(false)
  }

  // Handle close with warning
  const handleClose = () => {
    if (hasPassedStep1) {
      const confirmClose = window.confirm('You have unsaved data. Are you sure you want to close?')
      if (!confirmClose) return
    }
    resetForm()
    onClose()
  }

  // Navigation
  const handleNext = () => {
    if (step === 1) setHasPassedStep1(true)
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  // Create method and first batch
  const handleCreate = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)
    setLoadingMessage('Creating cooling method...')

    const methodId = `cooling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create first batch
    const firstBatch: CoolingBatch = {
      batchNumber: 1,
      date,
      startTime,
      startTemp: parseFloat(startTemp),
      secondTimeCheck,
      secondTempCheck: parseFloat(secondTempCheck),
      thirdTimeCheck,
      thirdTempCheck: parseFloat(thirdTempCheck),
      completedBy: currentUser.name,
      timestamp: new Date().toISOString(),
    }

    // Create method with first batch
    const newMethod: CoolingMethod = {
      id: methodId,
      foodItem,
      coolingMethod,
      status: 'in-progress',
      batches: [firstBatch],
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    }

    // Save to local state first
    createMethod(newMethod)

    // Try to save to Google Sheets (non-blocking)
    try {
      setLoadingMessage('Saving to Google Sheets...')
      const result = await saveCoolingBatchToGoogleSheets(newMethod, firstBatch)
      if (result.success) {
        console.log('✅ Saved to Google Sheets')
      } else {
        console.warn('⚠️ Failed to save to Google Sheets:', result.error)
      }
    } catch (error) {
      console.error('❌ Error saving to Google Sheets:', error)
    }

    setIsSubmitting(false)
    resetForm()
    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-lg font-medium">{loadingMessage}</p>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-primary" />
            New Cooling method - Batch 1
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* STEP 1: Food Item Description */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">What food are you cooling?</Label>
              <p className="text-sm text-muted-foreground">
                Describe the food item (type, size, weight, etc.)
              </p>
              <Textarea
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                placeholder="e.g., 1 litre of butter chicken curry"
                className="min-h-[120px] text-lg"
                autoFocus
              />
            </div>
          )}

          {/* STEP 2: Cooling Method */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base">Describe your cooling method</Label>
              <Textarea
                value={coolingMethod}
                onChange={(e) => setCoolingMethod(e.target.value)}
                placeholder="e.g., Curry was divided into five (5) 250mL containers and placed on cooling racks, then placed in the fridge at the second temperature check"
                className="min-h-[140px] text-lg"
                autoFocus
              />
            </div>
          )}

          {/* STEP 3: Batch 1 Date */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-base">Date of Batch 1</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={date}
                  className="h-16 text-xl pl-12"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Start Time and Temp */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-base">Start time (when food reaches 60°C)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-16 text-xl pl-12"
                  autoFocus
                />
              </div>
              <Label className="text-base mt-6">Start temperature</Label>
              <p className="text-sm text-muted-foreground">Temperature when food reaches 60°C</p>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  step="0.1"
                  value={startTemp}
                  onChange={(e) => setStartTemp(e.target.value)}
                  placeholder="60.0"
                  className="h-16 text-xl pl-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Second Check (60°C to 21°C) */}
          {step === 5 && (
            <div className="space-y-4">
              <Label className="text-base">2nd temperature check</Label>
              <p className="text-sm text-muted-foreground">
                Food needs to get from 60°C to 21°C (or room temp, whichever is lower) in 2 hours or less
              </p>
              <Label className="text-base mt-4">2nd check time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="time"
                  value={secondTimeCheck}
                  onChange={(e) => setSecondTimeCheck(e.target.value)}
                  className="h-16 text-xl pl-12"
                  autoFocus
                />
              </div>
              <Label className="text-base mt-4">2nd check temperature</Label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  step="0.1"
                  value={secondTempCheck}
                  onChange={(e) => setSecondTempCheck(e.target.value)}
                  placeholder="21.0 or below"
                  className="h-16 text-xl pl-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Third Check (21°C to 5°C) */}
          {step === 6 && (
            <div className="space-y-4">
              <Label className="text-base">3rd temperature check</Label>
              <p className="text-sm text-muted-foreground">
                Food needs to get from 21°C to 5°C (or lower) in a further 4 hours or less
              </p>
              <Label className="text-base mt-4">3rd check time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="time"
                  value={thirdTimeCheck}
                  onChange={(e) => setThirdTimeCheck(e.target.value)}
                  className="h-16 text-xl pl-12"
                  autoFocus
                />
              </div>
              <Label className="text-base mt-4">3rd check temperature</Label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  step="0.1"
                  value={thirdTempCheck}
                  onChange={(e) => setThirdTempCheck(e.target.value)}
                  placeholder="5.0 or below"
                  className="h-16 text-xl pl-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          )}

          {/* STEP 7: Review */}
          {step === 7 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Batch 1</h3>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Food Item</p>
                  <p className="font-medium">{foodItem}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cooling Method</p>
                  <p className="font-medium">{coolingMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start (60°C)</p>
                  <p className="font-medium">{startTime} - {startTemp}°C</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">2nd Check (60°C → 21°C)</p>
                  <p className="font-medium">{secondTimeCheck} - {secondTempCheck}°C</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">3rd Check (21°C → 5°C)</p>
                  <p className="font-medium">{thirdTimeCheck} - {thirdTempCheck}°C</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed By</p>
                  <p className="font-medium">{currentUser?.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {step === 1 && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          {step < totalSteps && (
            <Button
              onClick={handleNext}
              className="flex-1"
              disabled={
                (step === 1 && !foodItem.trim()) ||
                (step === 2 && !coolingMethod.trim()) ||
                (step === 4 && (!startTime || !startTemp)) ||
                (step === 5 && (!secondTimeCheck || !secondTempCheck)) ||
                (step === 6 && (!thirdTimeCheck || !thirdTempCheck))
              }
            >
              Next
            </Button>
          )}
          {step === totalSteps && (
            <Button
              onClick={handleCreate}
              className="flex-1"
              disabled={isSubmitting}
            >
              Create Method
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
