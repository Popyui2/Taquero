import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { useProvingMethodStore, saveBatchToGoogleSheets } from '@/store/provingMethodStore'
import { ProvingMethod, ValidationBatch } from '@/types'
import { Calendar, Clock, Edit2, Thermometer } from 'lucide-react'

interface NewMethodWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewMethodWizard({ open, onClose, onSuccess }: NewMethodWizardProps) {
  const { currentUser } = useAuthStore()
  const { createMethod } = useProvingMethodStore()

  // Current step (1-4)
  const [step, setStep] = useState(1)

  // Form data
  const [itemDescription, setItemDescription] = useState('')
  const [cookingMethod, setCookingMethod] = useState('')
  const [temperature, setTemperature] = useState('')
  const [timeValue, setTimeValue] = useState('')

  // Auto-filled date/time
  const [date] = useState(new Date().toISOString().split('T')[0])
  const [time] = useState(new Date().toTimeString().slice(0, 5))

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 5
  const progress = (step / totalSteps) * 100
  const tempValue = parseFloat(temperature)
  const hasTemp = temperature.trim() !== ''

  // Reset form
  const resetForm = () => {
    setStep(1)
    setItemDescription('')
    setCookingMethod('')
    setTemperature('')
    setTimeValue('')
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

  const handleJumpToStep = (targetStep: number) => {
    setStep(targetStep)
  }

  // Create method and first batch
  const handleCreate = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)

    const methodId = `method-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create first batch
    const firstBatch: ValidationBatch = {
      batchNumber: 1,
      date,
      temperature: tempValue,
      timeAtTemp: `${timeValue} ${timeValue === '1' ? 'minute' : 'minutes'}`,
      completedBy: currentUser.name,
      timestamp: new Date().toISOString(),
    }

    // Create method with first batch
    const newMethod: ProvingMethod = {
      id: methodId,
      itemDescription,
      cookingMethod,
      status: 'in-progress',
      batches: [firstBatch],
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    }

    try {
      // Save to Google Sheets
      const saveResult = await saveBatchToGoogleSheets(newMethod, firstBatch)

      if (!saveResult.success) {
        console.warn('⚠️ Failed to save to Google Sheets:', saveResult.error)
        // Continue anyway - data is saved locally
      }

      // Add to local store
      createMethod(newMethod)

      console.log('✅ Method created with first batch')

      // Success - close wizard
      resetForm()
      onClose()

      // Notify parent
      onSuccess?.()
    } catch (error) {
      console.error('❌ Error creating method:', error)
      alert('Error creating method. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <div className="text-lg font-semibold">Saving to Google Sheets...</div>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle>
            {step === totalSteps ? 'Review & Create Method' : 'Create New Method'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="py-6">
          {/* STEP 1: Item Description */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">What are you cooking?</Label>
              <p className="text-sm text-muted-foreground">
                Describe the item, including type, size, and weight
              </p>
              <Input
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g., 2kg chicken roast x4"
                className="h-16 text-xl"
              />
            </div>
          )}

          {/* STEP 2: Cooking Method */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base">Describe your cooking method</Label>
              <p className="text-sm text-muted-foreground">
                Include oven temperature, cooking time, and target internal temperature
              </p>
              <Textarea
                value={cookingMethod}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCookingMethod(e.target.value)}
                placeholder="e.g., Put in pre-heated oven at 220°C for 2 hours intended that the thickest part of the meat reaches 75°C for 30 seconds"
                className="min-h-[120px] text-lg"
              />
            </div>
          )}

          {/* STEP 3: Temperature (Batch 1) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-sm font-medium">Recording Batch 1 of 3</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll need to record 2 more batches to prove this method works
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-base">
                  Internal temperature at thickest part
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={temperature}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = parseFloat(value)
                        if (value === '' || (numValue >= 0 && numValue <= 300)) {
                          setTemperature(value)
                        }
                      }
                    }}
                    placeholder="Enter temperature"
                    className="h-16 text-2xl pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                    °C
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Time at Temperature (Batch 1) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">
                  Time at this temperature (minutes)
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={timeValue}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d+$/.test(value)) {
                        const numValue = parseInt(value)
                        if (value === '' || (numValue >= 0 && numValue <= 999)) {
                          setTimeValue(value)
                        }
                      }
                    }}
                    placeholder="Enter time in minutes"
                    className="h-16 text-xl pr-24"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                    minutes
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Your Method</h3>

              <div className="space-y-3">
                {/* Item */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Item</div>
                    <div className="font-medium">{itemDescription}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(1)} className="h-8 w-8 p-0">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Method */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Cooking Method</div>
                    <div className="font-medium text-sm line-clamp-2">{cookingMethod}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(2)} className="h-8 w-8 p-0">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Date/Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Batch 1 Date</div>
                        <div className="font-medium text-sm">
                          {new Date(date + 'T00:00').toLocaleDateString('en-NZ', { month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Time</div>
                        <div className="font-medium text-sm">{time}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch 1 Results */}
                <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Batch 1 Results
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Temperature:</span>{' '}
                      <span className="font-mono font-semibold">{temperature}°C</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>{' '}
                      <span className="font-medium">{timeValue} {timeValue === '1' ? 'minute' : 'minutes'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    By {currentUser?.name}
                  </div>
                </div>

                <div className="p-3 bg-muted/30 border rounded-lg">
                  <p className="text-sm">
                    You'll need to record <strong>2 more batches</strong> to prove this method works
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 border-t pt-4">
          {step > 1 && step <= totalSteps && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 min-h-[48px] flex-1"
            >
              ← Back
            </Button>
          )}

          {step < totalSteps && (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !itemDescription.trim()) ||
                (step === 2 && !cookingMethod.trim()) ||
                (step === 3 && !hasTemp)
              }
              className="h-12 min-h-[48px] flex-1"
            >
              Continue →
            </Button>
          )}

          {step === totalSteps && (
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !timeValue.trim()}
              className="h-12 min-h-[48px] flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Method & Record Batch 1'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
