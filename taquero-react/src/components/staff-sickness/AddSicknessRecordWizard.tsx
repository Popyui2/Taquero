import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { useStaffSicknessStore, saveSicknessToGoogleSheets } from '@/store/staffSicknessStore'
import { SicknessRecord } from '@/types'
import { Calendar, User, Stethoscope, Edit2, FileText } from 'lucide-react'

interface AddSicknessRecordWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddSicknessRecordWizard({ open, onClose, onSuccess }: AddSicknessRecordWizardProps) {
  const { currentUser } = useAuthStore()
  const { addRecord } = useStaffSicknessStore()

  // Current step (1-4)
  const [step, setStep] = useState(1)

  // Form data
  const [staffName, setStaffName] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [dateSick, setDateSick] = useState(new Date().toISOString().split('T')[0])
  const [dateReturned, setDateReturned] = useState('')
  const [actionTaken, setActionTaken] = useState('')

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  // Reset form
  const resetForm = () => {
    setStep(1)
    setStaffName('')
    setSymptoms('')
    setDateSick(new Date().toISOString().split('T')[0])
    setDateReturned('')
    setActionTaken('')
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

  // Save record
  const handleSave = async () => {
    if (!currentUser) {
      alert('Error: No user logged in')
      return
    }

    setIsSubmitting(true)

    const recordId = `sick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const hasReturnDate = dateReturned.trim() !== ''

    const newRecord: SicknessRecord = {
      id: recordId,
      staffName,
      symptoms: symptoms.trim() || undefined,
      dateSick,
      dateReturned: hasReturnDate ? dateReturned : undefined,
      actionTaken: actionTaken.trim() || undefined,
      checkedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      status: hasReturnDate ? 'returned' : 'sick',
    }

    try {
      // Save to Google Sheets
      const saveResult = await saveSicknessToGoogleSheets(newRecord)

      if (!saveResult.success) {
        console.warn('⚠️ Failed to save to Google Sheets:', saveResult.error)
        // Continue anyway - data is saved locally
      }

      // Add to local store
      addRecord(newRecord)

      // Success - close wizard
      resetForm()
      onClose()

      // Notify parent
      onSuccess?.()
    } catch (error) {
      console.error('❌ Error creating record:', error)
      alert('Error creating record. Please try again.')
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
            {step === totalSteps ? 'Review Sickness Record' : 'Record Staff Sickness'}
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
          {/* STEP 1: Staff Name */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">Who is sick?</Label>
              <p className="text-sm text-muted-foreground">
                Enter the staff member's full name
              </p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="h-16 text-xl pl-12"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Symptoms (Optional) */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-base">What are their symptoms? (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                This is optional but can be useful for tracking patterns
              </p>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., Fever and vomiting"
                  className="min-h-[120px] text-lg pl-12 pt-3"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Date Became Sick */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-base">When did they become sick?</Label>
              <p className="text-sm text-muted-foreground">
                Select the date they were unable to work
              </p>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  type="date"
                  value={dateSick}
                  onChange={(e) => setDateSick(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-16 text-xl pl-12"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Date Returned (Optional), Action Taken (Optional) & Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="dateReturned" className="text-base">Date returned to work (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Leave blank if still sick
                </p>
                <Input
                  id="dateReturned"
                  type="date"
                  value={dateReturned}
                  onChange={(e) => setDateReturned(e.target.value)}
                  min={dateSick}
                  className="h-16 text-xl"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-base">Action taken (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Record any actions taken (e.g., "Stayed home, symptoms stopped 02/04/17")
                </p>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="e.g., Stayed home, symptoms stopped after 2 days"
                    className="min-h-[100px] text-lg pl-12 pt-3"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold text-lg mb-4">Review Record</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">Staff Member</div>
                      <div className="font-medium">{staffName}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(1)} className="h-8 w-8 p-0">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {symptoms && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Symptoms</div>
                        <div className="font-medium text-sm">{symptoms}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(2)} className="h-8 w-8 p-0">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-1">Date Became Sick</div>
                      <div className="font-medium">
                        {new Date(dateSick).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(3)} className="h-8 w-8 p-0">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {dateReturned && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Date Returned</div>
                        <div className="font-medium">
                          {new Date(dateReturned).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleJumpToStep(4)} className="h-8 w-8 p-0">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {actionTaken && (
                    <div className="p-3 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Action Taken</div>
                      <div className="font-medium text-sm">{actionTaken}</div>
                    </div>
                  )}

                  <div className="flex items-center p-3 border rounded-lg bg-muted/30">
                    <div>
                      <div className="text-xs text-muted-foreground">Checked by</div>
                      <div className="font-medium text-sm">{currentUser?.name}</div>
                    </div>
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
                (step === 1 && !staffName.trim()) ||
                (step === 3 && !dateSick)
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
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
