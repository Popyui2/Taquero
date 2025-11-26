import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles } from 'lucide-react'
import { CleaningRecord } from '@/types'
import { useCleaningClosingStore, saveCleaningRecordToGoogleSheets } from '@/store/cleaningClosingStore'

interface AddCleaningRecordWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: CleaningRecord | null
}

const formatDateToDDMMYYYY = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const formatDateToISO = (ddmmyyyy: string) => {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month}-${day}`
}

export function AddCleaningRecordWizard({ open, onClose, onSuccess, editingRecord }: AddCleaningRecordWizardProps) {
  const [step, setStep] = useState(1)
  const { addRecord, updateRecord } = useCleaningClosingStore((state) => ({
    addRecord: state.addRecord,
    updateRecord: state.updateRecord
  }))

  // Step 1: Cleaning Task & Method
  const [cleaningTask, setCleaningTask] = useState('')
  const [cleaningMethod, setCleaningMethod] = useState('')

  // Step 2: Date, Staff & Notes
  const [dateCompleted, setDateCompleted] = useState(
    formatDateToDDMMYYYY(new Date().toISOString().split('T')[0])
  )
  const [completedBy, setCompletedBy] = useState('')
  const [notes, setNotes] = useState('')

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord

  const totalSteps = 2
  const progressValue = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setCleaningTask(editingRecord.cleaningTask)
      setCleaningMethod(editingRecord.cleaningMethod)
      setDateCompleted(formatDateToDDMMYYYY(editingRecord.dateCompleted))
      setCompletedBy(editingRecord.completedBy)
      setNotes(editingRecord.notes || '')
    }
  }, [editingRecord, open])

  // Reset form
  const resetForm = () => {
    setStep(1)
    setCleaningTask('')
    setCleaningMethod('')
    setDateCompleted(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))
    setCompletedBy('')
    setNotes('')
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

  const validateStep1 = () => {
    return cleaningTask.trim().length > 0 && cleaningMethod.trim().length > 0
  }

  const validateStep2 = () => {
    return completedBy.trim().length > 0
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      alert('Please fill in what was cleaned and how it was cleaned.')
      return
    }

    if (step === 1) {
      setHasPassedStep1(true)
    }

    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      if (isEditing && editingRecord) {
        // Update existing record
        const updatedRecord: CleaningRecord = {
          ...editingRecord,
          cleaningTask,
          dateCompleted: formatDateToISO(dateCompleted),
          cleaningMethod,
          completedBy,
          notes: notes.trim().length > 0 ? notes : undefined,
          updatedAt: new Date().toISOString(),
        }

        // Update local state
        updateRecord(editingRecord.id, {
          cleaningTask,
          dateCompleted: formatDateToISO(dateCompleted),
          cleaningMethod,
          completedBy,
          notes: notes.trim().length > 0 ? notes : undefined,
          updatedAt: new Date().toISOString(),
        })

        // Save to Google Sheets
        await saveCleaningRecordToGoogleSheets(updatedRecord)
      } else {
        // Create new record
        const recordId = `cleaning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: CleaningRecord = {
          id: recordId,
          cleaningTask,
          dateCompleted: formatDateToISO(dateCompleted),
          cleaningMethod,
          completedBy,
          notes: notes.trim().length > 0 ? notes : undefined,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        // Add to local state immediately
        addRecord(newRecord)

        // Save to Google Sheets in the background
        await saveCleaningRecordToGoogleSheets(newRecord)
      }

      resetForm()
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error saving cleaning record:', error)
      alert('Error saving record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Cleaning Record' : 'Add Cleaning Record'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progressValue)}%</span>
        </div>
        <Progress value={progressValue} className="w-full" />
      </div>

      {/* Step 1: Cleaning Task & Method */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Cleaning Details
            </CardTitle>
            <CardDescription>What was cleaned and how?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cleaningTask">
                What was cleaned? <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cleaningTask"
                placeholder="e.g., Preparation benches, Floor, Equipment"
                value={cleaningTask}
                onChange={(e) => setCleaningTask(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Examples: Preparation benches, Floor mopping, Equipment, Fridge exterior, Sinks
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaningMethod">
                How was it cleaned? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="cleaningMethod"
                placeholder="Describe the cleaning method..."
                value={cleaningMethod}
                onChange={(e) => setCleaningMethod(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Example: Clean debris, wipe with hot soapy water, dry with paper towels, apply spray sanitiser
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date, Staff & Notes */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Record Details</CardTitle>
            <CardDescription>Date and creator information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateCompleted">Date</Label>
              <DatePicker
                value={dateCompleted}
                onChange={setDateCompleted}
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completedBy">
                Created By <span className="text-red-500">*</span>
              </Label>
              <Input
                id="completedBy"
                placeholder="Your name"
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Review Summary */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-semibold">Review:</p>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Task:</span> {cleaningTask}</p>
                <p><span className="text-muted-foreground">Method:</span> {cleaningMethod}</p>
                <p><span className="text-muted-foreground">Date:</span> {formatDate(dateCompleted)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button variant="outline" onClick={step === 1 ? handleClose : handleBack}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!validateStep2() || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Cleaning Record'}
            </Button>
          )}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
