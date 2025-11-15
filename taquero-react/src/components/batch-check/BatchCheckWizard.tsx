import { useState } from 'react'
import { Edit2, User, Thermometer, Calendar, Clock, RefreshCw, Target, Utensils, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useBatchCheckStore } from '@/store/batchCheckStore'
import { useAuthStore } from '@/store/authStore'
import type { FoodType, CheckType } from '@/types'

// Google Sheets webhook URL - update this with your deployed Apps Script URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxgS84Em_zCCa7xWbGaB0YcBEXbG24zZ2LO6D3H8fhJi0OxSYAqescXD99r2CK5bpSy/exec'

interface BatchCheckWizardProps {
  open: boolean
  onClose: () => void
}

export function BatchCheckWizard({ open, onClose }: BatchCheckWizardProps) {
  const { currentUser } = useAuthStore()
  const { addLocalRecord } = useBatchCheckStore()

  // Current step (1-5)
  const [step, setStep] = useState(1)

  // Form data - auto-filled date/time
  const [date] = useState(new Date().toISOString().split('T')[0])
  const [time] = useState(new Date().toTimeString().slice(0, 5))
  const [foodType, setFoodType] = useState<FoodType | ''>('')
  const [customFood, setCustomFood] = useState('')
  const [checkType, setCheckType] = useState<CheckType | ''>('')
  const [temperature, setTemperature] = useState('')
  const [timeAtTemp, setTimeAtTemp] = useState('')
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes')

  // UI state
  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  // Parse temperature
  const tempValue = parseFloat(temperature)
  const hasTemp = temperature.trim() !== ''

  // Reset form
  const resetForm = () => {
    setStep(1)
    setFoodType('')
    setCustomFood('')
    setCheckType('')
    setTemperature('')
    setTimeAtTemp('')
    setTimeUnit('minutes')
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

  // Save batch check and close
  const handleSave = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)

    const batchCheckId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const unixTimestamp = Math.floor(new Date().getTime() / 1000)

    const batchCheckData = {
      unixTimestamp,
      staffName: currentUser.name,
      proteinCooked: foodType === 'Other' ? customFood : foodType,
      typeOfCheck: getCheckTypeLabel(checkType as CheckType),
      temperature: tempValue,
      durationInTemperature: `${timeAtTemp} ${timeUnit}`,
      cookingProteinBatchID: batchCheckId,
    }

    try {
      // Send to Google Sheets
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchCheckData),
      })

      // Create batch check object for local storage
      const batchCheck = {
        id: batchCheckId,
        date,
        time,
        foodType: foodType as FoodType,
        customFood: foodType === 'Other' ? customFood : undefined,
        checkType: checkType as CheckType,
        temperature: tempValue,
        timeAtTemperature: `${timeAtTemp} ${timeUnit}`,
        completedBy: currentUser.name,
        timestamp: new Date().toISOString(),
      }

      // Add to local storage for immediate UI update
      addLocalRecord(batchCheck)

      // Success - close wizard
      resetForm()
      onClose()

      console.log('✅ Batch check submitted successfully')
    } catch (error) {
      console.error('❌ Error submitting batch check:', error)
      alert('Error submitting batch check. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get check type label
  const getCheckTypeLabel = (type: CheckType): string => {
    switch (type) {
      case 'initial':
        return 'Individual'
      case 'weekly':
        return 'Weekly Batch'
      case 'confirm':
        return 'One item in each batch'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === totalSteps ? 'Review Your Batch Check' : 'New Batch Check'}
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
          {/* STEP 1: Food Type */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">What food are you checking?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    foodType === 'Chicken' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setFoodType('Chicken')}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium">Chicken</div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    foodType === 'Beef' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setFoodType('Beef')}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium">Beef</div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    foodType === 'Pork' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setFoodType('Pork')}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium">Pork</div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    foodType === 'Other' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setFoodType('Other')}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium">Other</div>
                  </CardContent>
                </Card>
              </div>

              {foodType === 'Other' && (
                <div className="space-y-2">
                  <Label>Specify food type</Label>
                  <Input
                    value={customFood}
                    onChange={(e) => setCustomFood(e.target.value)}
                    placeholder="Enter food type..."
                    className="h-12"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Check Type */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base">Which type of check?</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    checkType === 'weekly' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setCheckType('weekly')}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium">Weekly Batch</div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    checkType === 'initial' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setCheckType('initial')}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium">Individual</div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    checkType === 'confirm' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setCheckType('confirm')}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Thermometer className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-medium text-sm">One item in each batch</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* STEP 3: Temperature */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">
                  What temperature did the probe read?
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

          {/* STEP 4: Time at Temperature */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">
                  How long did it stay at this temperature?
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={timeAtTemp}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d+$/.test(value)) {
                        const numValue = parseInt(value)
                        if (value === '' || (numValue >= 0 && numValue <= 999)) {
                          setTimeAtTemp(value)
                        }
                      }
                    }}
                    placeholder="Enter duration"
                    className="h-12 flex-1"
                  />
                  <div className="flex border rounded-md">
                    <Button
                      type="button"
                      variant={timeUnit === 'minutes' ? 'default' : 'ghost'}
                      onClick={() => setTimeUnit('minutes')}
                      className="h-12 rounded-r-none"
                    >
                      Minutes
                    </Button>
                    <Button
                      type="button"
                      variant={timeUnit === 'hours' ? 'default' : 'ghost'}
                      onClick={() => setTimeUnit('hours')}
                      className="h-12 rounded-l-none"
                    >
                      Hours
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter numbers only
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div className="font-medium text-sm">
                        {new Date(date + 'T00:00').toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Time</div>
                      <div className="font-medium text-sm">{time}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Food</div>
                  <div className="font-medium">{foodType === 'Other' ? customFood : foodType}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(1)} className="h-8 w-8 p-0">
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Check Type</div>
                  <div className="font-medium">{getCheckTypeLabel(checkType as CheckType)}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(2)} className="h-8 w-8 p-0">
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Temperature</div>
                  <div className="font-medium">{temperature}°C</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(3)} className="h-8 w-8 p-0">
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Time at Temp</div>
                  <div className="font-medium">{timeAtTemp} {timeUnit}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(4)} className="h-8 w-8 p-0">
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Completed by</div>
                    <div className="font-medium text-sm">{currentUser?.name}</div>
                  </div>
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
                (step === 1 && !foodType) ||
                (step === 1 && foodType === 'Other' && !customFood.trim()) ||
                (step === 2 && !checkType) ||
                (step === 3 && !hasTemp) ||
                (step === 4 && !timeAtTemp.trim())
              }
              className="h-12 min-h-[48px] flex-1"
            >
              Continue →
            </Button>
          )}

          {step === totalSteps && (
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="h-12 min-h-[48px] flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save & Close'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
