import { useState } from 'react'
import { Edit2, CheckCircle2, AlertTriangle, User, Thermometer, Calendar, Clock, RefreshCw, Target } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useBatchCheckStore } from '@/store/batchCheckStore'
import { useAuthStore } from '@/store/authStore'
import type { FoodType, CheckType } from '@/types'

interface BatchCheckWizardProps {
  open: boolean
  onClose: () => void
}

export function BatchCheckWizard({ open, onClose }: BatchCheckWizardProps) {
  const { currentUser } = useAuthStore()
  const { addBatchCheck } = useBatchCheckStore()

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

  // UI state
  const [hasPassedStep1, setHasPassedStep1] = useState(false)

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  // Check if temperature is safe
  const tempValue = parseFloat(temperature)
  const isSafeTemp = !isNaN(tempValue) && tempValue >= 65
  const hasTemp = temperature.trim() !== ''

  // Reset form
  const resetForm = () => {
    setStep(1)
    setFoodType('')
    setCustomFood('')
    setCheckType('')
    setTemperature('')
    setTimeAtTemp('')
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
  const handleSave = () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    const batchCheck = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      time,
      foodType: foodType as FoodType,
      customFood: foodType === 'Other' ? customFood : undefined,
      checkType: checkType as CheckType,
      temperature: tempValue,
      timeAtTemperature: timeAtTemp,
      completedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      isSafe: isSafeTemp,
    }

    addBatchCheck(batchCheck)
    resetForm()
    onClose()
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
              <Select
                value={foodType}
                onValueChange={(value) => setFoodType(value as FoodType)}
              >
                <SelectTrigger className="h-14 text-base">
                  <SelectValue placeholder="Select a food type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chicken" className="h-12 text-base">
                    Chicken
                  </SelectItem>
                  <SelectItem value="Beef" className="h-12 text-base">
                    Beef
                  </SelectItem>
                  <SelectItem value="Pork" className="h-12 text-base">
                    Pork
                  </SelectItem>
                  <SelectItem value="Other" className="h-12 text-base">
                    Other (specify below)
                  </SelectItem>
                </SelectContent>
              </Select>

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
                        setTemperature(value)
                      }
                    }}
                    placeholder="Enter temperature"
                    className="h-16 text-2xl pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                    °C
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Safe range: 65°C or higher
                </p>
              </div>

              {/* Temperature validation feedback */}
              {hasTemp && (
                <Alert variant={isSafeTemp ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-2">
                    {isSafeTemp ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
                          Safe temperature
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                          <AlertDescription className="font-medium">
                            UNSAFE - Below safe temperature
                          </AlertDescription>
                          <AlertDescription className="text-sm mt-1">
                            Actions: Reheat immediately or discard batch
                          </AlertDescription>
                        </div>
                      </>
                    )}
                  </div>
                </Alert>
              )}
            </div>
          )}

          {/* STEP 4: Time at Temperature */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">
                  How long did it stay at this temperature?
                </Label>
                <Input
                  value={timeAtTemp}
                  onChange={(e) => setTimeAtTemp(e.target.value)}
                  placeholder="e.g., 15 minutes, 20+ mins"
                  className="h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the duration (e.g., "15 mins", "20+ minutes")
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{temperature}°C</span>
                    {isSafeTemp ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Safe
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20">
                        <AlertTriangle className="h-3 w-3" />
                        Unsafe
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(3)} className="h-8 w-8 p-0">
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Time at Temp</div>
                  <div className="font-medium">{timeAtTemp}</div>
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
              className="h-12 min-h-[48px] flex-1"
            >
              Save & Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
