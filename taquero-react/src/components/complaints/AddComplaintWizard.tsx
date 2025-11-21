import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ComplaintRecord, ComplaintType } from '@/types'
import {
  useComplaintsStore,
  saveComplaintRecordToGoogleSheets,
} from '@/store/complaintsStore'
import { useAuthStore } from '@/store/authStore'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'

interface AddComplaintWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export function AddComplaintWizard({ onComplete, onCancel }: AddComplaintWizardProps) {
  const [step, setStep] = useState(1)
  const addRecord = useComplaintsStore((state) => state.addRecord)
  const currentUser = useAuthStore((state) => state.currentUser)

  // Step 1: Customer Information
  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')

  // Step 2: Purchase Details
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [purchaseTime, setPurchaseTime] = useState('')
  const [foodItem, setFoodItem] = useState('')
  const [batchLotNumber, setBatchLotNumber] = useState('')

  // Step 3: Complaint Description
  const [complaintDescription, setComplaintDescription] = useState('')
  const [complaintType, setComplaintType] = useState<ComplaintType | undefined>(undefined)

  // Step 4: Investigation & Cause
  const [causeInvestigation, setCauseInvestigation] = useState('')

  // Step 5: Preventive Actions
  const [actionTakenPreventive, setActionTakenPreventive] = useState('')

  // Step 6: Resolution
  const [resolvedBy, setResolvedBy] = useState(currentUser?.name || '')
  const [linkedIncidentId, setLinkedIncidentId] = useState('')
  const [notes, setNotes] = useState('')

  const totalSteps = 6
  const progressValue = (step / totalSteps) * 100

  const complaintTypes: ComplaintType[] = [
    'Illness/Sickness',
    'Foreign Object',
    'Quality Issue',
    'Temperature Issue',
    'Allergen Issue',
    'Other',
  ]

  // Validation functions
  const validateStep1 = () => {
    return customerName.trim().length > 0 && customerContact.trim().length > 0
  }

  const validateStep2 = () => {
    return (
      purchaseDate.trim().length > 0 &&
      purchaseTime.trim().length > 0 &&
      foodItem.trim().length > 0
    )
  }

  const validateStep3 = () => {
    return complaintDescription.trim().length > 0
  }

  const validateStep4 = () => {
    return causeInvestigation.trim().length > 0
  }

  const validateStep5 = () => {
    return actionTakenPreventive.trim().length > 0
  }

  const validateStep6 = () => {
    return resolvedBy.trim().length > 0
  }

  const canProceed = () => {
    if (step === 1) return validateStep1()
    if (step === 2) return validateStep2()
    if (step === 3) return validateStep3()
    if (step === 4) return validateStep4()
    if (step === 5) return validateStep5()
    if (step === 6) return validateStep6()
    return false
  }

  const handleNext = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    const recordId = `complaint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newRecord: ComplaintRecord = {
      id: recordId,
      customerName,
      customerContact,
      purchaseDate,
      purchaseTime,
      foodItem,
      batchLotNumber: batchLotNumber.trim().length > 0 ? batchLotNumber : undefined,
      complaintDescription,
      complaintType: complaintType,
      causeInvestigation,
      actionTakenPreventive,
      resolvedBy,
      resolutionDate: new Date().toISOString().split('T')[0],
      complaintStatus: 'Under Investigation',
      linkedIncidentId: linkedIncidentId.trim().length > 0 ? linkedIncidentId : undefined,
      notes: notes.trim().length > 0 ? notes : undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    // Save to local store
    addRecord(newRecord)

    // Save to Google Sheets
    await saveComplaintRecordToGoogleSheets(newRecord)

    onComplete()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      {/* Step 1: Customer Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Who made the complaint?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                className="h-16 text-xl"
                placeholder="e.g., Fred Smith"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerContact">Customer Contact Details *</Label>
              <Input
                id="customerContact"
                className="h-16 text-xl"
                placeholder="e.g., +64 23 456 789 or email@example.com"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Purchase Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
            <CardDescription>When and what did they purchase?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Date of Purchase *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseTime">Time of Purchase *</Label>
              <Input
                id="purchaseTime"
                placeholder="e.g., 12:30 PM, Lunch time"
                value={purchaseTime}
                onChange={(e) => setPurchaseTime(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Approximate time is fine</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foodItem">Food Item Purchased *</Label>
              <Input
                id="foodItem"
                placeholder="e.g., Mince and cheese pie"
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchLotNumber">Batch / Lot Number</Label>
              <Input
                id="batchLotNumber"
                placeholder="e.g., Batch made Monday morning (if known)"
                value={batchLotNumber}
                onChange={(e) => setBatchLotNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Optional: If known</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Complaint Description */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Complaint Description</CardTitle>
            <CardDescription>What is the complaint?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complaintDescription">Complaint *</Label>
              <Textarea
                id="complaintDescription"
                placeholder="e.g., Claims pie made them sick&#10;&#10;Describe what the customer reported..."
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Complaint Type (Optional Helper)</Label>
              <div className="grid grid-cols-2 gap-2">
                {complaintTypes.map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-colors ${
                      complaintType === type
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setComplaintType(type)}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm font-medium">{type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Investigation & Cause */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Investigation & Cause</CardTitle>
            <CardDescription>What did you find? What caused the problem?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="causeInvestigation">Cause of the Problem *</Label>
              <Textarea
                id="causeInvestigation"
                placeholder="e.g., See investigation below. Does not appear to be caused by us&#10;&#10;What records did you check?&#10;What did you find?&#10;Was it your fault or not?"
                value={causeInvestigation}
                onChange={(e) => setCauseInvestigation(e.target.value)}
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Document your investigation: What records you checked, what you found, conclusion
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Preventive Actions */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Preventive Actions</CardTitle>
            <CardDescription>What action was taken to stop it happening again?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionTakenPreventive">Action Taken to Stop It Happening Again *</Label>
              <Textarea
                id="actionTakenPreventive"
                placeholder="e.g., I showed Mr Smith our cooking records for Monday's batch of pies.&#10;I also showed him our hot holding record.&#10;I suggested he speaks to the local council EHO about the matter and if he was still ill his doctor would be able to help as well.&#10;&#10;OR&#10;&#10;Retrain staff on proper cooking temps&#10;Update our cooking checklist&#10;Increase monitoring frequency"
                value={actionTakenPreventive}
                onChange={(e) => setActionTakenPreventive(e.target.value)}
                rows={8}
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Resolution */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Resolution</CardTitle>
            <CardDescription>Who managed this complaint?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolvedBy">Managed By or Resolved By *</Label>
              <Input
                id="resolvedBy"
                placeholder="Staff name"
                value={resolvedBy}
                onChange={(e) => setResolvedBy(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedIncidentId">Link to "When Something Goes Wrong" Record</Label>
              <Input
                id="linkedIncidentId"
                placeholder="Optional: Incident ID if you created one"
                value={linkedIncidentId}
                onChange={(e) => setLinkedIncidentId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Link to related incident record
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Review Summary */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Review Summary</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Customer:</span> {customerName}
                </p>
                <p>
                  <span className="font-medium">Food:</span> {foodItem}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(purchaseDate).toLocaleDateString()} at {purchaseTime}
                </p>
                <p>
                  <span className="font-medium">Managed By:</span> {resolvedBy}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={step === 1 ? onCancel : handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < totalSteps ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed()}>
            <Save className="w-4 h-4 mr-2" />
            Save Complaint
          </Button>
        )}
      </div>
    </div>
  )
}
