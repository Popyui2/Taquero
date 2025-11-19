import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wrench } from 'lucide-react'
import { MaintenanceRecord } from '@/types'
import { useEquipmentMaintenanceStore, saveMaintenanceRecordToGoogleSheets } from '@/store/equipmentMaintenanceStore'

interface AddMaintenanceRecordWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export function AddMaintenanceRecordWizard({ onComplete, onCancel }: AddMaintenanceRecordWizardProps) {
  const [step, setStep] = useState(1)
  const addRecord = useEquipmentMaintenanceStore((state) => state.addRecord)

  // Step 1: Equipment & Maintenance Details
  const [equipmentName, setEquipmentName] = useState('')
  const [maintenanceDescription, setMaintenanceDescription] = useState('')

  // Step 2: Date, Who, Frequency & Notes
  const [dateCompleted, setDateCompleted] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [performedBy, setPerformedBy] = useState('')
  const [checkingFrequency, setCheckingFrequency] = useState('')
  const [notes, setNotes] = useState('')

  const totalSteps = 2
  const progressValue = (step / totalSteps) * 100

  const validateStep1 = () => {
    return equipmentName.trim().length > 0 && maintenanceDescription.trim().length > 0
  }

  const validateStep2 = () => {
    return performedBy.trim().length > 0
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      alert('Please fill in equipment name and maintenance description.')
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
      alert('Please enter who performed the maintenance.')
      return
    }

    const recordId = `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newRecord: MaintenanceRecord = {
      id: recordId,
      equipmentName,
      dateCompleted,
      performedBy,
      maintenanceDescription,
      checkingFrequency: checkingFrequency.trim().length > 0 ? checkingFrequency : undefined,
      notes: notes.trim().length > 0 ? notes : undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    // Add to local state immediately
    addRecord(newRecord)

    // Save to Google Sheets in the background
    saveMaintenanceRecordToGoogleSheets(newRecord)

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

      {/* Step 1: Equipment & Maintenance Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipment & Maintenance Details
            </CardTitle>
            <CardDescription>What was serviced and what was done?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentName">
                Equipment/Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="equipmentName"
                placeholder="e.g., Grease Trap, Fridge #1, Water Filter"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Examples: Grease Trap, Fridge, Freezer, Oven, Extractor Fan, Water Filter, Fire Extinguisher
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceDescription">
                Maintenance Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="maintenanceDescription"
                placeholder="Describe what maintenance/repair was done..."
                value={maintenanceDescription}
                onChange={(e) => setMaintenanceDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Example: Full service and clean out of passive grease trap, Temperature calibration check, Filter replacement
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date, Who, Frequency & Notes */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Details</CardTitle>
            <CardDescription>When and who performed the maintenance</CardDescription>
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
              <Label htmlFor="performedBy">
                Performed By <span className="text-red-500">*</span>
              </Label>
              <Input
                id="performedBy"
                placeholder="Service provider or staff name"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                e.g., Greg's Grease Trap Services, Staff, John Smith
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkingFrequency">Checking Frequency (Optional)</Label>
              <Input
                id="checkingFrequency"
                placeholder="e.g., 6 monthly, Monthly, Quarterly"
                value={checkingFrequency}
                onChange={(e) => setCheckingFrequency(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                How often this maintenance should be done (for reference)
              </p>
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
                <p><span className="text-muted-foreground">Equipment:</span> {equipmentName}</p>
                <p><span className="text-muted-foreground">Maintenance:</span> {maintenanceDescription}</p>
                <p><span className="text-muted-foreground">Date:</span> {formatDate(dateCompleted)}</p>
                {checkingFrequency && (
                  <p><span className="text-muted-foreground">Frequency:</span> {checkingFrequency}</p>
                )}
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
          <Button onClick={handleSubmit}>Save Maintenance Record</Button>
        )}
      </div>
    </div>
  )
}
