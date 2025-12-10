import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { DatePicker } from '@/components/ui/date-picker'
import { useAuthStore } from '@/store/authStore'
import { useProvingReheatingStore, saveReheatingBatchToGoogleSheets } from '@/store/provingReheatingStore'
import { ReheatingMethod, ReheatingBatch } from '@/types'
import { Calendar, Thermometer, Flame } from 'lucide-react'

const formatDateToDDMMYYYY = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const formatDateToISO = (ddmmyyyy: string) => {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month}-${day}`
}

interface NewReheatingMethodWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewReheatingMethodWizard({ open, onClose, onSuccess }: NewReheatingMethodWizardProps) {
  const { currentUser } = useAuthStore()
  const { createMethod } = useProvingReheatingStore()

  // Current step (1-5)
  const [step, setStep] = useState(1)

  // Form data
  const [itemDescription, setItemDescription] = useState('')
  const [reheatingMethod, setReheatingMethod] = useState('')
  const [date, setDate] = useState(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))
  const [internalTemp, setInternalTemp] = useState('75')

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  // Reset form
  const resetForm = () => {
    setStep(1)
    setItemDescription('')
    setReheatingMethod('')
    setDate(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))
    setInternalTemp('75')
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

  // Create method with first batch
  const handleCreate = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)
    setLoadingMessage('Creating reheating method...')

    const methodId = `reheating-method-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create first batch
    const firstBatch: ReheatingBatch = {
      batchNumber: 1,
      date: formatDateToISO(date),
      internalTemp: parseFloat(internalTemp),
      completedBy: currentUser.name,
      timestamp: new Date().toISOString(),
    }

    // Create new method
    const newMethod: ReheatingMethod = {
      id: methodId,
      itemDescription,
      reheatingMethod,
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
      const result = await saveReheatingBatchToGoogleSheets(newMethod, firstBatch)
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
            <Flame className="h-5 w-5 text-primary" />
            New Reheating Method
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

          {/* STEP 1: Item Description */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">Item Description</Label>
              <p className="text-sm text-muted-foreground">Type, size, weight</p>
              <Input
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g., 5 litres vegetable soup"
                className="h-16 text-xl"
                autoFocus
              />
            </div>
          )}

          {/* STEP 2: Reheating Method */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base">Reheating Method</Label>
              <p className="text-sm text-muted-foreground">Describe the full reheating process</p>
              <Textarea
                value={reheatingMethod}
                onChange={(e) => setReheatingMethod(e.target.value)}
                placeholder="e.g., Heat all 5 litres in a 10 litre pot on stove on med/high for 15 minutes until the center of the liquid is 75°C"
                className="min-h-[140px] text-lg"
                autoFocus
              />
            </div>
          )}

          {/* STEP 3: Date for Batch 1 */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-base">Batch 1: Date</Label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="DD/MM/YYYY"
              />
            </div>
          )}

          {/* STEP 4: Internal Temperature */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-base">Batch 1: Internal Temperature</Label>
              <p className="text-sm text-muted-foreground">Must be at least 75°C at the coolest part (liquid) or middle (solid)</p>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  step="0.1"
                  value={internalTemp}
                  onChange={(e) => setInternalTemp(e.target.value)}
                  placeholder="75.0"
                  className="h-16 text-xl pl-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Reheating Method</h3>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Item Description</p>
                  <p className="font-medium">{itemDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reheating Method</p>
                  <p className="font-medium">{reheatingMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch 1 - Date</p>
                  <p className="font-medium">{new Date(date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch 1 - Internal Temperature</p>
                  <p className="font-medium">{internalTemp}°C</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
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
                (step === 1 && !itemDescription.trim()) ||
                (step === 2 && !reheatingMethod.trim()) ||
                (step === 4 && !internalTemp)
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
