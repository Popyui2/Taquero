import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { TraceabilityRecord } from '@/types'
import {
  useTraceabilityStore,
  saveTraceabilityRecordToGoogleSheets,
} from '@/store/traceabilityStore'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'

interface AddTraceabilityRecordWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export function AddTraceabilityRecordWizard({ onComplete, onCancel }: AddTraceabilityRecordWizardProps) {
  const [step, setStep] = useState(1)
  const addRecord = useTraceabilityStore((state) => state.addRecord)

  // Step 1: Product Information
  const [traceDate, setTraceDate] = useState(new Date().toISOString().split('T')[0])
  const [productType, setProductType] = useState('')
  const [brand, setBrand] = useState('')
  const [batchLotInfo, setBatchLotInfo] = useState('')

  // Step 2: Supplier & Manufacturer
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [manufacturerSameAsSupplier, setManufacturerSameAsSupplier] = useState(true)
  const [manufacturerName, setManufacturerName] = useState('')
  const [manufacturerContact, setManufacturerContact] = useState('')

  // Step 3: Additional Details
  const [dateReceived, setDateReceived] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [otherInfo, setOtherInfo] = useState('')

  const totalSteps = 3
  const progressValue = (step / totalSteps) * 100

  // Validation functions
  const validateStep1 = () => {
    return (
      traceDate.trim().length > 0 &&
      productType.trim().length > 0 &&
      brand.trim().length > 0 &&
      batchLotInfo.trim().length > 0
    )
  }

  const validateStep2 = () => {
    const supplierValid = supplierName.trim().length > 0 && supplierContact.trim().length > 0

    if (manufacturerSameAsSupplier) {
      return supplierValid
    }

    return supplierValid && manufacturerName.trim().length > 0 && manufacturerContact.trim().length > 0
  }

  const validateStep3 = () => {
    return performedBy.trim().length > 0
  }

  const canProceed = () => {
    if (step === 1) return validateStep1()
    if (step === 2) return validateStep2()
    if (step === 3) return validateStep3()
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

    const recordId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newRecord: TraceabilityRecord = {
      id: recordId,
      traceDate,
      productType,
      brand,
      batchLotInfo,
      supplierName,
      supplierContact,
      manufacturerName: manufacturerSameAsSupplier ? supplierName : manufacturerName,
      manufacturerContact: manufacturerSameAsSupplier ? supplierContact : manufacturerContact,
      dateReceived: dateReceived.trim().length > 0 ? dateReceived : undefined,
      performedBy,
      otherInfo: otherInfo.trim().length > 0 ? otherInfo : undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    // Save to local store
    addRecord(newRecord)

    // Save to Google Sheets
    await saveTraceabilityRecordToGoogleSheets(newRecord)

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

      {/* Step 1: Product Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Details about the product being traced</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="traceDate">Date of Trace Exercise *</Label>
              <Input
                id="traceDate"
                type="date"
                value={traceDate}
                onChange={(e) => setTraceDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productType">Product Type *</Label>
              <Input
                id="productType"
                placeholder="e.g., Dumpling wrapper, Beef mince, Chicken breast"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                placeholder="e.g., Ying Yang, Tegel, Anchor"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchLotInfo">Batch / Lot Information *</Label>
              <Input
                id="batchLotInfo"
                placeholder="e.g., SGH117801, Batch #2024-0712"
                value={batchLotInfo}
                onChange={(e) => setBatchLotInfo(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Supplier & Manufacturer */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier & Manufacturer</CardTitle>
            <CardDescription>Contact details for supplier and manufacturer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                placeholder="e.g., Ying Yang Manufacturing Co"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierContact">Supplier Contact Details *</Label>
              <Textarea
                id="supplierContact"
                placeholder="Phone, email, address&#10;e.g., +86 23445657&#10;alanlee@yingyang.co.cn"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="sameAsSupplier"
                checked={manufacturerSameAsSupplier}
                onCheckedChange={(checked) => setManufacturerSameAsSupplier(checked === true)}
              />
              <Label htmlFor="sameAsSupplier" className="font-normal cursor-pointer">
                Manufacturer is the same as supplier
              </Label>
            </div>

            {!manufacturerSameAsSupplier && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="manufacturerName">Manufacturer Name *</Label>
                  <Input
                    id="manufacturerName"
                    placeholder="e.g., Ying Yang Manufacturing Co, Shanghai"
                    value={manufacturerName}
                    onChange={(e) => setManufacturerName(e.target.value)}
                    required={!manufacturerSameAsSupplier}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturerContact">Manufacturer Contact Details *</Label>
                  <Textarea
                    id="manufacturerContact"
                    placeholder="Contact person, phone, email&#10;e.g., Mr Alan Lee, owner&#10;tel +86 23445657&#10;Email: alanlee@yingyang.co.cn"
                    value={manufacturerContact}
                    onChange={(e) => setManufacturerContact(e.target.value)}
                    rows={4}
                    required={!manufacturerSameAsSupplier}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Additional Details */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Additional information about the trace exercise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateReceived">Date Product Received</Label>
              <Input
                id="dateReceived"
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Optional: When was this product received?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performedBy">Trace Performed By *</Label>
              <Input
                id="performedBy"
                placeholder="Person who performed this trace"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherInfo">Other Information</Label>
              <Textarea
                id="otherInfo"
                placeholder="Additional details such as:&#10;- Certificates of registration&#10;- Registration numbers&#10;- Transportation details&#10;- Product specifications&#10;- Compliance with NZ Food Standards"
                value={otherInfo}
                onChange={(e) => setOtherInfo(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Certificates, registration, transportation, specifications, etc.
              </p>
            </div>

            {/* Review Summary */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Review Summary</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Product:</span> {productType} ({brand})
                </p>
                <p>
                  <span className="font-medium">Batch:</span> {batchLotInfo}
                </p>
                <p>
                  <span className="font-medium">Supplier:</span> {supplierName}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {new Date(traceDate).toLocaleDateString()}
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
            Save Trace Record
          </Button>
        )}
      </div>
    </div>
  )
}
