import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useProvingMethodStore } from '@/store/provingMethodStore'
import { ProvingMethod, ValidationBatch } from '@/types'

interface AddBatchWizardProps {
  open: boolean
  onClose: () => void
  onSuccess: (isProven: boolean) => void
  method: ProvingMethod
}

export function AddBatchWizard({ open, onClose, onSuccess, method }: AddBatchWizardProps) {
  const { addBatchToMethod } = useProvingMethodStore()
  const [step, setStep] = useState(1)

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [temperature, setTemperature] = useState('')
  const [timeValue, setTimeValue] = useState('')
  const [timeUnit, setTimeUnit] = useState<'seconds' | 'minutes'>('minutes')
  const [completedBy, setCompletedBy] = useState('')

  const totalSteps = 4 // Date, Temp, Time, Review
  const nextBatchNumber = (method.batches.length + 1) as 1 | 2 | 3

  const handleClose = () => {
    setStep(1)
    setDate(new Date().toISOString().split('T')[0])
    setTemperature('')
    setTimeValue('')
    setTimeUnit('minutes')
    setCompletedBy('')
    onClose()
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    const batch: ValidationBatch = {
      batchNumber: nextBatchNumber,
      date: date,
      temperature: parseFloat(temperature),
      timeAtTemp: `${timeValue} ${timeUnit === 'minutes' ? timeValue === '1' ? 'minute' : 'minutes' : timeValue === '1' ? 'second' : 'seconds'}`,
      completedBy: completedBy,
      timestamp: new Date().toISOString()
    }

    addBatchToMethod(method.id, batch)

    // Check if this completes the method (becomes batch 3)
    const willBeProven = nextBatchNumber === 3

    handleClose()
    onSuccess(willBeProven)
  }

  const canProceed = () => {
    switch (step) {
      case 1: return date !== ''
      case 2: return temperature !== '' && parseFloat(temperature) > 0
      case 3: return timeValue !== '' && parseFloat(timeValue) > 0
      case 4: return completedBy.trim() !== ''
      default: return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Add Batch {nextBatchNumber}/3
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>

          {/* Method context */}
          <div className="bg-muted rounded-lg border p-4">
            <p className="text-sm font-medium mb-1">Recording batch for:</p>
            <p className="text-base font-semibold">{method.itemDescription}</p>
          </div>

          {/* Step 1: Date */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base">
                  What date was this batch cooked?
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-16 text-xl"
                />
                <p className="text-sm text-muted-foreground">
                  Select the date when this batch was prepared
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Temperature */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-base">
                  Temperature at thickest part (°C)
                </Label>
                <div className="relative">
                  <Input
                    id="temperature"
                    type="text"
                    inputMode="decimal"
                    value={temperature}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setTemperature(val)
                      }
                    }}
                    placeholder="e.g., 75"
                    className="h-16 text-xl pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                    °C
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Measure at the thickest part of the food
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Time at Temperature */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">Time at this temperature</Label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={timeValue}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setTimeValue(val)
                      }
                    }}
                    placeholder="Enter time"
                    className="h-16 text-xl flex-1"
                  />
                  <div className="flex border rounded-md">
                    <Button
                      type="button"
                      variant={timeUnit === 'seconds' ? 'default' : 'ghost'}
                      onClick={() => setTimeUnit('seconds')}
                      className="h-16 rounded-r-none"
                    >
                      Seconds
                    </Button>
                    <Button
                      type="button"
                      variant={timeUnit === 'minutes' ? 'default' : 'ghost'}
                      onClick={() => setTimeUnit('minutes')}
                      className="h-16 rounded-l-none"
                    >
                      Minutes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review and Complete */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Batch {nextBatchNumber}</h3>

              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(date).toLocaleDateString('en-NZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Temperature at thickest part</p>
                  <p className="font-medium">{temperature}°C</p>
                </div>

                <div className="bg-muted/50 rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Time at temperature</p>
                  <p className="font-medium">
                    {timeValue} {timeUnit === 'minutes' ? (timeValue === '1' ? 'minute' : 'minutes') : (timeValue === '1' ? 'second' : 'seconds')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="completedBy" className="text-base">
                  Who completed this batch?
                </Label>
                <Input
                  id="completedBy"
                  type="text"
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  placeholder="Staff member name"
                  className="h-12 text-base"
                />
              </div>

              {nextBatchNumber === 3 && (
                <div className="bg-muted/30 border rounded-lg p-4">
                  <p className="text-sm font-medium">
                    This is the final batch! Once recorded, this method will be marked as <span className="text-green-600 font-semibold">Proven</span>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1"
                size="lg"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="flex-1"
                size="lg"
              >
                {nextBatchNumber === 3 ? 'Complete & Prove Method' : 'Record Batch'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
