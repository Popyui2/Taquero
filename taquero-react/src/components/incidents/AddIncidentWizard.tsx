import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle } from 'lucide-react'
import { IncidentRecord, IncidentCategory, IncidentSeverity } from '@/types'
import { useIncidentsStore, saveIncidentRecordToGoogleSheets } from '@/store/incidentsStore'

interface AddIncidentWizardProps {
  onComplete: () => void
  onCancel: () => void
}

const INCIDENT_CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: 'equipment-failure', label: 'Equipment Failure' },
  { value: 'temperature-issue', label: 'Temperature Issue' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'supplier-problem', label: 'Supplier Problem' },
  { value: 'staff-error', label: 'Staff Error' },
  { value: 'facility-issue', label: 'Facility Issue' },
  { value: 'other', label: 'Other' },
]

export function AddIncidentWizard({ onComplete, onCancel }: AddIncidentWizardProps) {
  const [step, setStep] = useState(1)
  const addRecord = useIncidentsStore((state) => state.addRecord)

  // Step 1: Incident Details
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0])
  const [personResponsible, setPersonResponsible] = useState('')
  const [staffInvolved, setStaffInvolved] = useState('')

  // Step 2: What Went Wrong
  const [whatWentWrong, setWhatWentWrong] = useState('')
  const [category, setCategory] = useState<IncidentCategory>('equipment-failure')

  // Step 3: Immediate Fix
  const [whatDidToFix, setWhatDidToFix] = useState('')

  // Step 4: Preventive Action
  const [preventiveAction, setPreventiveAction] = useState('')

  // Step 5: Severity & Follow-up
  const [severity, setSeverity] = useState<IncidentSeverity>('moderate')
  const [followUpDate, setFollowUpDate] = useState('')
  const [notes, setNotes] = useState('')

  const totalSteps = 5
  const progressValue = (step / totalSteps) * 100

  const validateStep1 = () => {
    return personResponsible.trim().length > 0
  }

  const validateStep2 = () => {
    return whatWentWrong.trim().length >= 10
  }

  const validateStep3 = () => {
    return whatDidToFix.trim().length >= 10
  }

  const validateStep4 = () => {
    return preventiveAction.trim().length >= 10
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      alert('Please enter who is responsible for reporting this incident.')
      return
    }
    if (step === 2 && !validateStep2()) {
      alert('Please describe what went wrong (at least 10 characters).')
      return
    }
    if (step === 3 && !validateStep3()) {
      alert('Please describe what you did to fix it (at least 10 characters).')
      return
    }
    if (step === 4 && !validateStep4()) {
      alert('Please describe preventive actions (at least 10 characters).')
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

  const getSeverityLabel = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'minor':
        return '🟢 Minor'
      case 'moderate':
        return '🟡 Moderate'
      case 'major':
        return '🔴 Major'
    }
  }

  const handleSubmit = async () => {
    const recordId = `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newRecord: IncidentRecord = {
      id: recordId,
      incidentDate,
      personResponsible,
      staffInvolved: staffInvolved.trim().length > 0 ? staffInvolved : personResponsible,
      category,
      whatWentWrong,
      whatDidToFix,
      preventiveAction,
      severity,
      incidentStatus: 'open',
      followUpDate: followUpDate.trim().length > 0 ? followUpDate : undefined,
      notes: notes.trim().length > 0 ? notes : undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    // Add to local state immediately
    addRecord(newRecord)

    // Save to Google Sheets in the background
    saveIncidentRecordToGoogleSheets(newRecord)

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

      {/* Step 1: Incident Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Incident Details
            </CardTitle>
            <CardDescription>When did it happen and who was involved?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incidentDate">
                Incident Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="incidentDate"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personResponsible">
                Person Responsible (Who Noticed/Reported) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="personResponsible"
                placeholder="Staff name"
                value={personResponsible}
                onChange={(e) => setPersonResponsible(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffInvolved">Staff Involved (Optional)</Label>
              <Input
                id="staffInvolved"
                placeholder="e.g., Richard Thomas, John Johnson"
                value={staffInvolved}
                onChange={(e) => setStaffInvolved(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of staff involved (leave blank if same as reporter)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: What Went Wrong */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What Went Wrong?</CardTitle>
            <CardDescription>Describe the incident</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatWentWrong">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="whatWentWrong"
                placeholder="Describe what went wrong..."
                value={whatWentWrong}
                onChange={(e) => setWhatWentWrong(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Example: Fridge 2 on permanent defrost, Food left out too long, Cross-contamination incident
              </p>
            </div>

            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {INCIDENT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    type="button"
                    variant={category === cat.value ? 'default' : 'outline'}
                    onClick={() => setCategory(cat.value)}
                    className="h-auto py-3"
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Immediate Fix */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Immediate Fix</CardTitle>
            <CardDescription>What did you do to fix it?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatDidToFix">
                Corrective Action Taken <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="whatDidToFix"
                placeholder="Describe what you did to fix it..."
                value={whatDidToFix}
                onChange={(e) => setWhatDidToFix(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Examples: Called sparky, Moved food to backup fridge, Threw out affected food, Increased cooking time
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Preventive Action */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Preventive Action</CardTitle>
            <CardDescription>What will you do to stop it happening again?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preventiveAction">
                Prevention Strategy <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="preventiveAction"
                placeholder="Describe what you'll do to prevent this..."
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Examples: Added to cleaning schedule, Retrain staff on procedure, Change supplier, Update process
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Severity & Follow-up */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Severity & Follow-up</CardTitle>
            <CardDescription>Impact level and next steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Severity <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={severity === 'minor' ? 'default' : 'outline'}
                  onClick={() => setSeverity('minor')}
                  className="h-auto py-3"
                >
                  🟢 Minor
                  <span className="block text-xs mt-1">No food affected</span>
                </Button>
                <Button
                  type="button"
                  variant={severity === 'moderate' ? 'default' : 'outline'}
                  onClick={() => setSeverity('moderate')}
                  className="h-auto py-3"
                >
                  🟡 Moderate
                  <span className="block text-xs mt-1">Food affected but safe</span>
                </Button>
                <Button
                  type="button"
                  variant={severity === 'major' ? 'default' : 'outline'}
                  onClick={() => setSeverity('major')}
                  className="h-auto py-3"
                >
                  🔴 Major
                  <span className="block text-xs mt-1">Unsafe food produced</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-up Date (Optional)</Label>
              <Input
                id="followUpDate"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Date to verify corrective action (e.g., check in 1 week)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
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
                <p><span className="text-muted-foreground">Date:</span> {formatDate(incidentDate)}</p>
                <p><span className="text-muted-foreground">Reported by:</span> {personResponsible}</p>
                <p><span className="text-muted-foreground">Category:</span> {INCIDENT_CATEGORIES.find(c => c.value === category)?.label}</p>
                <p><span className="text-muted-foreground">Severity:</span> {getSeverityLabel(severity)}</p>
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
          <Button onClick={handleSubmit}>Save Incident Report</Button>
        )}
      </div>
    </div>
  )
}
