import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/authStore'
import { useTransportTempChecksStore, saveTransportTempCheckToGoogleSheets } from '@/store/transportTempChecksStore'
import { TransportTempCheckRecord } from '@/types'
import { Loader2, AlertTriangle, Info } from 'lucide-react'

interface AddTransportTempCheckWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: TransportTempCheckRecord | null
}

export function AddTransportTempCheckWizard({
  open,
  onClose,
  onSuccess,
  editingRecord,
}: AddTransportTempCheckWizardProps) {
  const { currentUser } = useAuthStore()
  const { addRecord, updateRecord } = useTransportTempChecksStore()

  const [step, setStep] = useState(1)

  // Step 1: Food Details
  const [checkDate, setCheckDate] = useState('')
  const [typeOfFood, setTypeOfFood] = useState('')

  // Step 2: Temperature Check
  const [temperature, setTemperature] = useState('')
  const [showTempWarning, setShowTempWarning] = useState(false)
  const [tempWarningMessage, setTempWarningMessage] = useState('')
  const [tempWarningLevel, setTempWarningLevel] = useState<'warning' | 'danger'>('warning')

  // Step 3: Review & Notes
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord
  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setCheckDate(editingRecord.checkDate)
      setTypeOfFood(editingRecord.typeOfFood)
      setTemperature(editingRecord.temperature.toString())
      setNotes(editingRecord.notes || '')
    }
  }, [editingRecord, open])

  // Set default date to today when dialog opens (only for new records)
  useEffect(() => {
    if (open && !editingRecord) {
      const today = new Date().toISOString().split('T')[0]
      setCheckDate(today)
    }
  }, [open, editingRecord])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetForm()
      }, 200)
    }
  }, [open])

  const resetForm = () => {
    setStep(1)
    setCheckDate('')
    setTypeOfFood('')
    setTemperature('')
    setNotes('')
    setShowTempWarning(false)
    setTempWarningMessage('')
    setTempWarningLevel('warning')
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  // Temperature validation (warnings only, not blocking)
  useEffect(() => {
    if (temperature) {
      const tempValue = parseFloat(temperature)
      if (!isNaN(tempValue)) {
        if (tempValue > 8) {
          setShowTempWarning(true)
          setTempWarningLevel('danger')
          setTempWarningMessage('⚠️ Temperature is unsafe (>8°C). According to 2/4 hour rule, food should be discarded.')
        } else if (tempValue > 5) {
          setShowTempWarning(true)
          setTempWarningLevel('warning')
          setTempWarningMessage('⚠️ Temperature is borderline (5-8°C). Monitor closely.')
        } else {
          setShowTempWarning(false)
          setTempWarningMessage('')
        }
      }
    } else {
      setShowTempWarning(false)
      setTempWarningMessage('')
    }
  }, [temperature])

  // Save record
  const handleSave = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && editingRecord) {
        // Update existing record
        const updatedRecord: TransportTempCheckRecord = {
          ...editingRecord,
          checkDate,
          typeOfFood: typeOfFood.trim(),
          temperature: parseFloat(temperature),
          notes: notes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        }

        await saveTransportTempCheckToGoogleSheets(updatedRecord)
        updateRecord(editingRecord.id, {
          checkDate,
          typeOfFood: typeOfFood.trim(),
          temperature: parseFloat(temperature),
          notes: notes.trim() || undefined,
        })
      } else {
        // Create new record
        const recordId = `transport-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: TransportTempCheckRecord = {
          id: recordId,
          checkDate,
          typeOfFood: typeOfFood.trim(),
          temperature: parseFloat(temperature),
          taskDoneBy: currentUser.name,
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        await saveTransportTempCheckToGoogleSheets(newRecord)
        addRecord(newRecord)
      }

      onSuccess?.()
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error saving transport temp check:', error)
      alert('Error saving temperature check. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validation for each step
  const canProceedFromStep1 = checkDate.length > 0 && typeOfFood.trim().length > 0
  const canProceedFromStep2 =
    temperature.trim().length > 0 && !isNaN(parseFloat(temperature))

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? 'Edit Temperature Check' : 'Record Transport Temperature Check'}
          </DialogTitle>
        </DialogHeader>

        {/* Info Banner */}
        <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400">
              Only for food transported for more than 4 hours
            </p>
            <p className="text-blue-600 dark:text-blue-400 mt-1">
              Record temperature after food has been out of temperature control for more than 4 hours during transport.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step 1: Food Details */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Food Details</h3>
              <p className="text-sm text-muted-foreground">
                Enter the date and type of food being transported
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="checkDate">Date</Label>
                  <Input
                    id="checkDate"
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="h-16 text-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeOfFood">Type of Food</Label>
                  <Input
                    id="typeOfFood"
                    value={typeOfFood}
                    onChange={(e) => setTypeOfFood(e.target.value)}
                    placeholder="e.g., milk, yoghurt, meat, prepared meals"
                    className="h-16 text-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Temperature Check */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Temperature Check</h3>
              <p className="text-sm text-muted-foreground">
                Record the temperature after more than 4 hours out of temperature control
              </p>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="e.g., 4.5"
                  className="h-16 text-xl"
                />
              </div>

              {showTempWarning && (
                <div
                  className={`flex items-start gap-2 p-4 border rounded-lg mt-3 ${
                    tempWarningLevel === 'danger'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      tempWarningLevel === 'danger'
                        ? 'text-red-600 dark:text-red-500'
                        : 'text-yellow-600 dark:text-yellow-500'
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      tempWarningLevel === 'danger'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {tempWarningMessage}
                  </p>
                </div>
              )}

              <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm font-medium mb-2">2/4 Hour Rule Reference:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• ≤5°C: Safe temperature</li>
                  <li>• 5-8°C: Borderline - monitor closely</li>
                  <li>• &gt;8°C: Unsafe - should be discarded</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Please review the temperature check details before submitting
              </p>

              <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(checkDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type of Food</p>
                    <p className="font-medium">{typeOfFood}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="font-medium">{temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Checked By</p>
                    <p className="font-medium">{currentUser?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about this temperature check..."
                  className="text-base min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={step === 1 ? handleClose : handleBack} disabled={isSubmitting}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !canProceedFromStep1) ||
                (step === 2 && !canProceedFromStep2)
              }
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Check'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
