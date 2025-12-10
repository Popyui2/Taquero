import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Wrench } from 'lucide-react'
import { MaintenanceRecord } from '@/types'
import { useEquipmentMaintenanceStore, saveMaintenanceRecordToGoogleSheets } from '@/store/equipmentMaintenanceStore'

interface AddMaintenanceRecordWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: MaintenanceRecord | null
}

export function AddMaintenanceRecordWizard({ open, onClose, onSuccess, editingRecord }: AddMaintenanceRecordWizardProps) {
  const [step, setStep] = useState(1)
  const { addRecord, updateRecord } = useEquipmentMaintenanceStore((state) => ({
    addRecord: state.addRecord,
    updateRecord: state.updateRecord
  }))

  // Helper function to convert ISO date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

  // Helper function to convert DD/MM/YYYY to ISO date
  const formatDateToISO = (ddmmyyyy: string) => {
    const [day, month, year] = ddmmyyyy.split('/')
    return `${year}-${month}-${day}`
  }

  // Step 1: Equipment & Maintenance Details
  const [equipmentName, setEquipmentName] = useState('')
  const [maintenanceDescription, setMaintenanceDescription] = useState('')

  // Step 2: Date, Who, Frequency & Notes
  const [dateCompleted, setDateCompleted] = useState(
    formatDateToDDMMYYYY(new Date().toISOString().split('T')[0])
  )
  const [performedBy, setPerformedBy] = useState('')
  const [checkingFrequency, setCheckingFrequency] = useState('')
  const [notes, setNotes] = useState('')

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord

  const totalSteps = 2
  const progressValue = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setEquipmentName(editingRecord.equipmentName)
      setMaintenanceDescription(editingRecord.maintenanceDescription)
      setDateCompleted(formatDateToDDMMYYYY(editingRecord.dateCompleted))
      setPerformedBy(editingRecord.performedBy)
      setCheckingFrequency(editingRecord.checkingFrequency || '')
      setNotes(editingRecord.notes || '')
    }
  }, [editingRecord, open])

  // Reset form
  const resetForm = () => {
    setStep(1)
    setEquipmentName('')
    setMaintenanceDescription('')
    setDateCompleted(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))
    setPerformedBy('')
    setCheckingFrequency('')
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
    if (!validateStep2()) {
      alert('Please enter who performed the maintenance.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && editingRecord) {
        // Update existing record
        const updatedRecord: MaintenanceRecord = {
          ...editingRecord,
          equipmentName,
          dateCompleted: formatDateToISO(dateCompleted),
          performedBy,
          maintenanceDescription,
          checkingFrequency: checkingFrequency.trim().length > 0 ? checkingFrequency : undefined,
          notes: notes.trim().length > 0 ? notes : undefined,
          updatedAt: new Date().toISOString(),
        }

        // Update local state
        updateRecord(editingRecord.id, {
          equipmentName,
          dateCompleted: formatDateToISO(dateCompleted),
          performedBy,
          maintenanceDescription,
          checkingFrequency: checkingFrequency.trim().length > 0 ? checkingFrequency : undefined,
          notes: notes.trim().length > 0 ? notes : undefined,
          updatedAt: new Date().toISOString(),
        })

        // Save to Google Sheets
        await saveMaintenanceRecordToGoogleSheets(updatedRecord)
      } else {
        // Create new record
        const recordId = `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: MaintenanceRecord = {
          id: recordId,
          equipmentName,
          dateCompleted: formatDateToISO(dateCompleted),
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
        await saveMaintenanceRecordToGoogleSheets(newRecord)
      }

      resetForm()
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error saving maintenance record:', error)
      alert('Error saving record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</DialogTitle>
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
              <DatePicker
                value={dateCompleted}
                onChange={setDateCompleted}
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
            <Button variant="outline" onClick={step === 1 ? handleClose : handleBack}>
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            {step < totalSteps ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!validateStep2() || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Maintenance Record'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
