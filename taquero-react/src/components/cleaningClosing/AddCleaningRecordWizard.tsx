import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles } from 'lucide-react'
import { CleaningRecord } from '@/types'
import { useCleaningClosingStore, saveCleaningRecordToGoogleSheets } from '@/store/cleaningClosingStore'

interface AddCleaningRecordWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export function AddCleaningRecordWizard({ onComplete, onCancel }: AddCleaningRecordWizardProps) {
  const [step, setStep] = useState(1)
  const addRecord = useCleaningClosingStore((state) => state.addRecord)

  // Step 1: Cleaning Task & Method
  const [cleaningTask, setCleaningTask] = useState('')
  const [cleaningMethod, setCleaningMethod] = useState('')

  // Step 2: Date, Staff & Notes
  const [dateCompleted, setDateCompleted] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [completedBy, setCompletedBy] = useState('')
  const [notes, setNotes] = useState('')

  const totalSteps = 2
  const progressValue = (step / totalSteps) * 100

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
    if (!validateStep2()) {
      alert('Please enter who completed the cleaning.')
      return
    }

    const recordId = `cleaning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newRecord: CleaningRecord = {
      id: recordId,
      cleaningTask,
      dateCompleted,
      cleaningMethod,
      completedBy,
      notes: notes.trim().length > 0 ? notes : undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    // Add to local state immediately
    addRecord(newRecord)

    // Save to Google Sheets in the background
    saveCleaningRecordToGoogleSheets(newRecord)

    onComplete()
  }

  return (
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
            <CardTitle>Completion Details</CardTitle>
            <CardDescription>When and who completed the cleaning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateCompleted">
                Date Completed <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateCompleted"
                type="date"
                value={dateCompleted}
                onChange={(e) => setDateCompleted(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completedBy">
                Completed By <span className="text-red-500">*</span>
              </Label>
              <Input
                id="completedBy"
                placeholder="Staff name"
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
        <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < totalSteps ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit}>Save Cleaning Record</Button>
        )}
      </div>
    </div>
  )
}
