import { useState } from 'react'
import { X, Edit2, CheckCircle2, AlertTriangle } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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

  // Current step (1-7)
  const [step, setStep] = useState(1)

  // Form data
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(
    new Date().toTimeString().slice(0, 5) // HH:MM format
  )
  const [foodType, setFoodType] = useState<FoodType | ''>('')
  const [customFood, setCustomFood] = useState('')
  const [checkType, setCheckType] = useState<CheckType | ''>('')
  const [temperature, setTemperature] = useState('')
  const [timeAtTemp, setTimeAtTemp] = useState('')
  const [customTimeAtTemp, setCustomTimeAtTemp] = useState('')

  // UI state
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [hasPassedStep2, setHasPassedStep2] = useState(false)

  const totalSteps = 7
  const progress = (step / totalSteps) * 100

  // Check if temperature is safe
  const tempValue = parseFloat(temperature)
  const isSafeTemp = !isNaN(tempValue) && tempValue >= 65
  const hasTemp = temperature.trim() !== ''

  // Check if time at temp is safe
  const isUnsafeDuration = timeAtTemp === 'less-than-15'

  // Reset form
  const resetForm = () => {
    setStep(1)
    setDate(new Date().toISOString().split('T')[0])
    setTime(new Date().toTimeString().slice(0, 5))
    setFoodType('')
    setCustomFood('')
    setCheckType('')
    setTemperature('')
    setTimeAtTemp('')
    setCustomTimeAtTemp('')
    setIsEditingDate(false)
    setIsEditingTime(false)
    setShowSuccess(false)
    setHasPassedStep2(false)
  }

  // Handle close with warning
  const handleClose = () => {
    if (hasPassedStep2 && !showSuccess) {
      const confirmClose = window.confirm('You have unsaved data. Are you sure you want to close?')
      if (!confirmClose) return
    }
    resetForm()
    onClose()
  }

  // Navigation
  const handleNext = () => {
    if (step === 2) setHasPassedStep2(true)
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleJumpToStep = (targetStep: number) => {
    setStep(targetStep)
  }

  // Save batch check
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
      timeAtTemperature: timeAtTemp === 'other' ? customTimeAtTemp : timeAtTemp,
      completedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      isSafe: isSafeTemp,
    }

    addBatchCheck(batchCheck)
    setShowSuccess(true)
  }

  // Add another check
  const handleAddAnother = () => {
    setShowSuccess(false)
    resetForm()
  }

  // Get check type label
  const getCheckTypeLabel = (type: CheckType): string => {
    switch (type) {
      case 'initial':
        return 'Initial probe (first check of the day)'
      case 'weekly':
        return 'Weekly batch check'
      case 'confirm':
        return 'Confirm method still working'
      case 'doner':
        return 'When making doner kebabs'
      default:
        return ''
    }
  }

  // Render success screen
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-6 w-6" />
              Batch Check Saved!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Your protein batch check has been recorded.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Saved to:</span>{' '}
                <span className="font-medium">Local Storage</span>
              </div>
              <div>
                <span className="text-muted-foreground">Timestamp:</span>{' '}
                <span className="font-medium">
                  {new Date().toLocaleString('en-NZ')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAddAnother}
              className="flex-1 h-12 min-h-[48px]"
            >
              Add Another Check
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="flex-1 h-12 min-h-[48px]"
            >
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {step === totalSteps ? 'Review Your Batch Check' : 'New Batch Check'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
          {/* STEP 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Date</Label>
                    {!isEditingDate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingDate(true)}
                        className="h-8 text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingDate ? (
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-12"
                      onBlur={() => setIsEditingDate(false)}
                      autoFocus
                    />
                  ) : (
                    <div className="h-12 px-3 py-2 border rounded-md bg-muted/30 flex items-center font-medium">
                      {new Date(date + 'T00:00').toLocaleDateString('en-NZ', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Time</Label>
                    {!isEditingTime && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingTime(true)}
                        className="h-8 text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingTime ? (
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-12"
                      onBlur={() => setIsEditingTime(false)}
                      autoFocus
                    />
                  ) : (
                    <div className="h-12 px-3 py-2 border rounded-md bg-muted/30 flex items-center font-medium">
                      {time}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Food Type */}
          {step === 2 && (
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

          {/* STEP 3: Check Type */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-base">Which type of check?</Label>
              <RadioGroup
                value={checkType}
                onValueChange={(value: string) => setCheckType(value as CheckType)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="initial" id="initial" className="mt-0.5" />
                  <Label htmlFor="initial" className="flex-1 cursor-pointer space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-xl">🌡️</span>
                      <span>Initial probe</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      First check of the day
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="weekly" id="weekly" className="mt-0.5" />
                  <Label htmlFor="weekly" className="flex-1 cursor-pointer space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-xl">🔄</span>
                      <span>Weekly batch check</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Proving method works
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="confirm" id="confirm" className="mt-0.5" />
                  <Label htmlFor="confirm" className="flex-1 cursor-pointer space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-xl">✅</span>
                      <span>Confirm method still working</span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="doner" id="doner" className="mt-0.5" />
                  <Label htmlFor="doner" className="flex-1 cursor-pointer space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-xl">🍢</span>
                      <span>When making doner kebabs</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* STEP 4: Temperature */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">
                  What temperature did the probe read?
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="Enter temperature"
                    className="h-16 text-2xl pr-12"
                    min="0"
                    max="100"
                    step="0.1"
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

          {/* STEP 5: Time at Temperature */}
          {step === 5 && (
            <div className="space-y-4">
              <Label className="text-base">
                How long did it stay at this temperature?
              </Label>
              <RadioGroup
                value={timeAtTemp}
                onValueChange={(value: string) => setTimeAtTemp(value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer opacity-50">
                  <RadioGroupItem value="less-than-15" id="less-than-15" disabled />
                  <Label
                    htmlFor="less-than-15"
                    className="flex-1 cursor-not-allowed"
                  >
                    Less than 15 mins
                    <span className="ml-2 text-sm text-destructive">(Unsafe - disabled)</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="15 mins" id="15mins" />
                  <Label htmlFor="15mins" className="flex-1 cursor-pointer">
                    15 mins
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="20+ mins" id="20mins" />
                  <Label htmlFor="20mins" className="flex-1 cursor-pointer">
                    20+ mins
                  </Label>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="other" id="other-time" className="mt-3" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="other-time" className="cursor-pointer">
                      Other (specify)
                    </Label>
                    {timeAtTemp === 'other' && (
                      <Input
                        value={customTimeAtTemp}
                        onChange={(e) => setCustomTimeAtTemp(e.target.value)}
                        placeholder="e.g., 30 minutes"
                        className="h-12"
                      />
                    )}
                  </div>
                </div>
              </RadioGroup>

              {isUnsafeDuration && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Unsafe duration selected. The batch must be reheated.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* STEP 6: Completed By */}
          {step === 6 && (
            <div className="space-y-4">
              <Label className="text-base">Completed by</Label>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Logged in as:
                </div>
                <div className="h-14 px-4 py-3 border rounded-md bg-muted/30 flex items-center font-medium text-lg">
                  {currentUser?.name || 'Unknown User'}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review */}
          {step === 7 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">📅 Date</div>
                      <div className="font-medium">
                        {new Date(date + 'T00:00').toLocaleDateString('en-NZ')}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToStep(1)}
                      className="h-10 w-10 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">🕐 Time</div>
                      <div className="font-medium">{time}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToStep(1)}
                      className="h-10 w-10 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">🍗 Food</div>
                      <div className="font-medium">
                        {foodType === 'Other' ? customFood : foodType}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToStep(2)}
                      className="h-10 w-10 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">📋 Check Type</div>
                      <div className="font-medium">
                        {getCheckTypeLabel(checkType as CheckType)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToStep(3)}
                      className="h-10 w-10 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1 flex-1">
                      <div className="text-sm text-muted-foreground">🌡️ Temperature</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{temperature}°C</span>
                        {isSafeTemp ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Safe
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            Unsafe
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToStep(4)}
                      className="h-10 w-10 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">⏱️ Time at Temp</div>
                      <div className="font-medium">
                        {timeAtTemp === 'other' ? customTimeAtTemp : timeAtTemp}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToStep(5)}
                      className="h-10 w-10 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">👤 Done by</div>
                      <div className="font-medium">{currentUser?.name}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJumpToStep(6)}
                      className="h-10 w-10 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                (step === 2 && !foodType) ||
                (step === 2 && foodType === 'Other' && !customFood.trim()) ||
                (step === 3 && !checkType) ||
                (step === 4 && !hasTemp) ||
                (step === 5 && !timeAtTemp) ||
                (step === 5 && timeAtTemp === 'other' && !customTimeAtTemp.trim())
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
