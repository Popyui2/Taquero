import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { useCoolingMethodStore, saveCoolingBatchToGoogleSheets } from '@/store/provingCoolingStore'
import { CoolingMethod, CoolingBatch } from '@/types'
import { Calendar, Clock, Snowflake, Thermometer } from 'lucide-react'

interface AddCoolingBatchWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: (isProven: boolean) => void
  method: CoolingMethod
}

const formatDateToDDMMYYYY = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const formatDateToISO = (ddmmyyyy: string) => {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month}-${day}`
}

export function AddCoolingBatchWizard({ open, onClose, onSuccess, method }: AddCoolingBatchWizardProps) {
  const { currentUser } = useAuthStore()
  const { addBatchToMethod } = useCoolingMethodStore()

  const nextBatchNumber = (method.batches.length + 1) as 1 | 2 | 3

  // Current step (1-5)
  const [step, setStep] = useState(1)

  // Form data
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5))
  const [startTemp, setStartTemp] = useState('60')
  const [secondTimeCheck, setSecondTimeCheck] = useState('')
  const [secondTempCheck, setSecondTempCheck] = useState('')
  const [thirdTimeCheck, setThirdTimeCheck] = useState('')
  const [thirdTempCheck, setThirdTempCheck] = useState('')

  // Auto-filled date
  const [date, setDate] = useState(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  // Reset form
  const resetForm = () => {
    setStep(1)
    setStartTime(new Date().toTimeString().slice(0, 5))
    setStartTemp('60')
    setSecondTimeCheck('')
    setSecondTempCheck('')
    setThirdTimeCheck('')
    setThirdTempCheck('')
  }

  // Navigation
  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  // Add batch
  const handleAddBatch = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)
    setLoadingMessage(`Adding Batch ${nextBatchNumber}...`)

    // Create new batch
    const newBatch: CoolingBatch = {
      batchNumber: nextBatchNumber,
      date: formatDateToISO(date),
      startTime,
      startTemp: parseFloat(startTemp),
      secondTimeCheck,
      secondTempCheck: parseFloat(secondTempCheck),
      thirdTimeCheck,
      thirdTempCheck: parseFloat(thirdTempCheck),
      completedBy: currentUser.name,
      timestamp: new Date().toISOString(),
    }

    // Add to local state first
    addBatchToMethod(method.id, newBatch)

    const isProven = nextBatchNumber === 3

    // Try to save to Google Sheets (non-blocking)
    try {
      setLoadingMessage('Saving to Google Sheets...')
      const result = await saveCoolingBatchToGoogleSheets(method, newBatch)
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
    onSuccess?.(isProven)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            Add Batch {nextBatchNumber}
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

          {/* Method Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">Food Item</p>
            <p className="font-medium">{method.foodItem}</p>
          </div>

          {/* STEP 1: Date */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">Date of Batch {nextBatchNumber}</Label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="DD/MM/YYYY"
              />
            </div>
          )}

          {/* STEP 2: Start Time and Temp */}
          {step === 2 && (
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

          {/* STEP 3: Second Check (60°C to 21°C) */}
          {step === 3 && (
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

          {/* STEP 4: Third Check (21°C to 5°C) */}
          {step === 4 && (
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

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Batch {nextBatchNumber}</h3>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
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
              onClick={onClose}
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
                (step === 2 && (!startTime || !startTemp)) ||
                (step === 3 && (!secondTimeCheck || !secondTempCheck)) ||
                (step === 4 && (!thirdTimeCheck || !thirdTempCheck))
              }
            >
              Next
            </Button>
          )}
          {step === totalSteps && (
            <Button
              onClick={handleAddBatch}
              className="flex-1"
              disabled={isSubmitting}
            >
              Add Batch {nextBatchNumber}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
