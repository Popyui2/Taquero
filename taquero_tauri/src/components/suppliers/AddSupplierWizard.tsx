import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/store/authStore'
import { useSuppliersStore, saveSupplierToGoogleSheets } from '@/store/suppliersStore'
import { SupplierRecord } from '@/types'
import { Building2, User, Calendar, Package } from 'lucide-react'

interface AddSupplierWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: SupplierRecord | null
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function AddSupplierWizard({ open, onClose, onSuccess, editingRecord }: AddSupplierWizardProps) {
  const { currentUser } = useAuthStore()
  const { addRecord, updateRecord } = useSuppliersStore()

  // Current step (1-4)
  const [step, setStep] = useState(1)

  // Form data
  const [businessName, setBusinessName] = useState('')
  const [siteRegistrationNumber, setSiteRegistrationNumber] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [orderDays, setOrderDays] = useState<string[]>([])
  const [deliveryDays, setDeliveryDays] = useState<string[]>([])
  const [customArrangement, setCustomArrangement] = useState('')
  const [goodsSupplied, setGoodsSupplied] = useState('')
  const [comments, setComments] = useState('')

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord
  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setBusinessName(editingRecord.businessName)
      setSiteRegistrationNumber(editingRecord.siteRegistrationNumber || '')
      setContactPerson(editingRecord.contactPerson)
      setPhone(editingRecord.phone || '')
      setEmail(editingRecord.email || '')
      setAddress(editingRecord.address)
      setOrderDays(editingRecord.orderDays)
      setDeliveryDays(editingRecord.deliveryDays)
      setCustomArrangement(editingRecord.customArrangement || '')
      setGoodsSupplied(editingRecord.goodsSupplied)
      setComments(editingRecord.comments || '')
    }
  }, [editingRecord, open])

  // Reset form
  const resetForm = () => {
    setStep(1)
    setBusinessName('')
    setSiteRegistrationNumber('')
    setContactPerson('')
    setPhone('')
    setEmail('')
    setAddress('')
    setOrderDays([])
    setDeliveryDays([])
    setCustomArrangement('')
    setGoodsSupplied('')
    setComments('')
    setHasPassedStep1(false)
  }

  // Handle close with warning
  const handleClose = () => {
    if (hasPassedStep1 && !isEditing) {
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

  // Toggle day selection
  const toggleOrderDay = (day: string) => {
    // Clear custom arrangement when selecting days
    if (customArrangement.trim().length > 0) {
      setCustomArrangement('')
    }
    setOrderDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    )
  }

  const toggleDeliveryDay = (day: string) => {
    // Clear custom arrangement when selecting days
    if (customArrangement.trim().length > 0) {
      setCustomArrangement('')
    }
    setDeliveryDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    )
  }

  // Handle custom arrangement change
  const handleCustomArrangementChange = (value: string) => {
    // Clear day selections when typing custom arrangement
    if (value.trim().length > 0 && (orderDays.length > 0 || deliveryDays.length > 0)) {
      setOrderDays([])
      setDeliveryDays([])
    }
    setCustomArrangement(value)
  }

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
        const updatedRecord: SupplierRecord = {
          ...editingRecord,
          businessName,
          siteRegistrationNumber: siteRegistrationNumber.trim() || undefined,
          contactPerson,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address,
          orderDays,
          deliveryDays,
          customArrangement: customArrangement.trim() || undefined,
          goodsSupplied,
          comments: comments.trim() || undefined,
          updatedAt: new Date().toISOString(),
        }

        // Save to Google Sheets
        const saveResult = await saveSupplierToGoogleSheets(updatedRecord)

        if (!saveResult.success) {
          console.warn('⚠️ Failed to save to Google Sheets:', saveResult.error)
          // Continue anyway - data is saved locally
        }

        // Update local store
        updateRecord(editingRecord.id, {
          businessName,
          siteRegistrationNumber: siteRegistrationNumber.trim() || undefined,
          contactPerson,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address,
          orderDays,
          deliveryDays,
          customArrangement: customArrangement.trim() || undefined,
          goodsSupplied,
          comments: comments.trim() || undefined,
        })
      } else {
        // Create new record
        const recordId = `supplier-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: SupplierRecord = {
          id: recordId,
          businessName,
          siteRegistrationNumber: siteRegistrationNumber.trim() || undefined,
          contactPerson,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address,
          orderDays,
          deliveryDays,
          customArrangement: customArrangement.trim() || undefined,
          goodsSupplied,
          comments: comments.trim() || undefined,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
          status: 'active',
        }

        // Save to Google Sheets
        const saveResult = await saveSupplierToGoogleSheets(newRecord)

        if (!saveResult.success) {
          console.warn('⚠️ Failed to save to Google Sheets:', saveResult.error)
          // Continue anyway - data is saved locally
        }

        // Add to local store
        addRecord(newRecord)
      }

      // Success - close wizard
      resetForm()
      onClose()

      // Notify parent
      onSuccess?.()
    } catch (error) {
      console.error('❌ Error saving record:', error)
      alert('Error saving record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validation
  const canProceedFromStep1 = businessName.trim().length > 0
  const canProceedFromStep2 = contactPerson.trim().length > 0 && address.trim().length > 0
  const canProceedFromStep3 = (orderDays.length > 0 && deliveryDays.length > 0) || customArrangement.trim().length > 0
  const canSave = goodsSupplied.trim().length > 0

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
            {isEditing ? 'Edit Supplier' : 'Add Trusted Supplier'}
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
        <div className="space-y-6 py-4">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Business Information</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter the supplier's business details
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Cheesy Pete"
                      className="text-base"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteRegistrationNumber">Site Registration Number (optional)</Label>
                    <Input
                      id="siteRegistrationNumber"
                      value={siteRegistrationNumber}
                      onChange={(e) => setSiteRegistrationNumber(e.target.value)}
                      placeholder="e.g., MPI000010"
                      className="text-base font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      MPI registration number under Food Act or Animal Products Act
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Contact Information</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter contact details for this supplier
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g., Peter Ronnie"
                      className="text-base"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g., 021 123 456"
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., orders@cheesypete.co.nz"
                        className="text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g., Cheesy Pete&#10;44 Main Street&#10;Cityville"
                      className="text-base min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Order/Delivery Days */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Order & Delivery Schedule</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select the days for ordering and delivery, or specify a custom arrangement
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Days to place orders</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`order-${day}`}
                            checked={orderDays.includes(day)}
                            onCheckedChange={() => toggleOrderDay(day)}
                          />
                          <Label
                            htmlFor={`order-${day}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Days to receive delivery</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`delivery-${day}`}
                            checked={deliveryDays.includes(day)}
                            onCheckedChange={() => toggleDeliveryDay(day)}
                          />
                          <Label
                            htmlFor={`delivery-${day}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t">
                    <Label htmlFor="customArrangement">Custom arrangement (optional)</Label>
                    <Textarea
                      id="customArrangement"
                      value={customArrangement}
                      onChange={(e) => handleCustomArrangementChange(e.target.value)}
                      placeholder="e.g., We arrange deliveries on an ad-hoc basis&#10;No fixed schedule - call when needed"
                      className="text-base min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use this if you have a custom arrangement instead of fixed days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Products/Comments */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Products & Notes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      List the goods supplied and any additional notes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goodsSupplied">Goods Supplied *</Label>
                    <Textarea
                      id="goodsSupplied"
                      value={goodsSupplied}
                      onChange={(e) => setGoodsSupplied(e.target.value)}
                      placeholder="e.g., cheddar&#10;brie&#10;mozzarella"
                      className="text-base min-h-[120px]"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      List each product on a new line
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments (optional)</Label>
                    <Textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="e.g., doesn't like last minute orders but can do next day delivery&#10;closes at 2pm on thursdays"
                      className="text-base min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step === 1 ? (
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            ) : (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div>
            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedFromStep1) ||
                  (step === 2 && !canProceedFromStep2) ||
                  (step === 3 && !canProceedFromStep3)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!canSave || isSubmitting}
              >
                {isEditing ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
