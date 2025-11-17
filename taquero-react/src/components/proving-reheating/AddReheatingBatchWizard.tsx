import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { useProvingReheatingStore, saveReheatingBatchToGoogleSheets } from '@/store/provingReheatingStore'
import { ReheatingMethod, ReheatingBatch } from '@/types'
import { Calendar, Thermometer, Flame } from 'lucide-react'

interface AddReheatingBatchWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: (isProven: boolean) => void
  method: ReheatingMethod
}

export function AddReheatingBatchWizard({ open, onClose, onSuccess, method }: AddReheatingBatchWizardProps) {
  const { currentUser } = useAuthStore()
  const { addBatchToMethod } = useProvingReheatingStore()

  // Current step (1-3)
  const [step, setStep] = useState(1)

  // Form data
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [internalTemp, setInternalTemp] = useState('75')

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const batchNumber = (method.batches.length + 1) as 1 | 2 | 3
  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  // Reset form
  const resetForm = () => {
    setStep(1)
    setDate(new Date().toISOString().split('T')[0])
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

  // Add batch to method
  const handleAddBatch = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)
    setLoadingMessage('Adding batch...')

    // Create new batch
    const newBatch: ReheatingBatch = {
      batchNumber,
      date,
      internalTemp: parseFloat(internalTemp),
      completedBy: currentUser.name,
      timestamp: new Date().toISOString(),
    }

    // Add to local state first
    addBatchToMethod(method.id, newBatch)

    const isProven = batchNumber === 3

    // Try to save to Google Sheets (non-blocking)
    try {
      setLoadingMessage('Saving to Google Sheets...')
      const result = await saveReheatingBatchToGoogleSheets(method, newBatch)
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
            Add Batch {batchNumber}/3
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Method Info */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Reheating Method</p>
            <p className="font-medium text-lg">{method.itemDescription}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* STEP 1: Date */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">Batch {batchNumber}: Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-16 text-xl pl-12"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 2: Internal Temperature */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base">Batch {batchNumber}: Internal Temperature</Label>
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

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Batch {batchNumber}</h3>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <p className="font-medium">{method.itemDescription}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Internal Temperature</p>
                  <p className="font-medium">{internalTemp}°C</p>
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
              disabled={step === 2 && !internalTemp}
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
              Add Batch
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
