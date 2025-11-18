import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/store/authStore'
import { useAllergensStore, saveAllergenToGoogleSheets } from '@/store/allergensStore'
import { AllergenRecord } from '@/types'
import { Utensils, ListOrdered, AlertTriangle } from 'lucide-react'

interface AddAllergenWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRecord?: AllergenRecord | null
}

// Grouped allergen lists as per NZ MPI requirements
const ALLERGEN_GROUPS = {
  common: [
    'Gluten (wheat, barley, rye, oats)',
    'Wheat',
    'Milk',
    'Egg',
    'Soy',
    'Peanuts',
    'Fish',
    'Sesame',
    'Sulphites',
  ],
  treeNuts: [
    'Almonds',
    'Brazil nuts',
    'Cashews',
    'Hazelnuts',
    'Macadamias',
    'Pecans',
    'Pine nuts',
    'Pistachios',
    'Walnuts',
  ],
  shellfish: [
    'Crustacea (prawns, crab)',
    'Molluscs (mussels, oysters)',
  ],
  other: [
    'Lupin',
  ],
}

export function AddAllergenWizard({ open, onClose, onSuccess, editingRecord }: AddAllergenWizardProps) {
  const { currentUser } = useAuthStore()
  const { addRecord, updateRecord } = useAllergensStore()

  // Current step (1-3)
  const [step, setStep] = useState(1)

  // Form data
  const [dishName, setDishName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])

  const [hasPassedStep1, setHasPassedStep1] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingRecord
  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  // Load editing data
  useEffect(() => {
    if (editingRecord && open) {
      setDishName(editingRecord.dishName)
      setIngredients(editingRecord.ingredients)
      setSelectedAllergens(editingRecord.allergens)
    }
  }, [editingRecord, open])

  // Reset form
  const resetForm = () => {
    setStep(1)
    setDishName('')
    setIngredients('')
    setSelectedAllergens([])
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

  // Toggle allergen selection
  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    )
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
        const updatedRecord: AllergenRecord = {
          ...editingRecord,
          dishName,
          ingredients,
          allergens: selectedAllergens,
          updatedAt: new Date().toISOString(),
        }

        // Save to Google Sheets
        const saveResult = await saveAllergenToGoogleSheets(updatedRecord)

        if (!saveResult.success) {
          console.warn('⚠️ Failed to save to Google Sheets:', saveResult.error)
          // Continue anyway - data is saved locally
        }

        // Update local store
        updateRecord(editingRecord.id, {
          dishName,
          ingredients,
          allergens: selectedAllergens,
        })
      } else {
        // Create new record
        const recordId = `allergen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const newRecord: AllergenRecord = {
          id: recordId,
          dishName,
          ingredients,
          allergens: selectedAllergens,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
        }

        // Save to Google Sheets
        const saveResult = await saveAllergenToGoogleSheets(newRecord)

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
  const canProceedFromStep1 = dishName.trim().length > 0
  const canProceedFromStep2 = ingredients.trim().length > 0
  const canSave = selectedAllergens.length > 0

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
            {isEditing ? 'Edit Allergen Record' : 'Add Allergen Record'}
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
          {/* Step 1: Dish Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Utensils className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Dish Name</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter the name of the dish or menu item
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dishName">Dish Name *</Label>
                    <Input
                      id="dishName"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="e.g., Cookie, Beef Tacos, Caesar Salad"
                      className="text-base"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ingredients */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ListOrdered className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Ingredients</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      List all ingredients used in this dish
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ingredients">Ingredients *</Label>
                    <Textarea
                      id="ingredients"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="e.g., Flour, eggs, butter, milk, sugar, chocolate chips"
                      className="text-base min-h-[120px]"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate ingredients with commas or new lines
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Allergens */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Allergens</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select all allergens present in this dish
                    </p>
                  </div>

                  {/* Common Allergens */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Common Allergens</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALLERGEN_GROUPS.common.map((allergen) => (
                        <div key={allergen} className="flex items-center space-x-2">
                          <Checkbox
                            id={`allergen-${allergen}`}
                            checked={selectedAllergens.includes(allergen)}
                            onCheckedChange={() => toggleAllergen(allergen)}
                          />
                          <Label
                            htmlFor={`allergen-${allergen}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {allergen}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tree Nuts */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Tree Nuts</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALLERGEN_GROUPS.treeNuts.map((allergen) => (
                        <div key={allergen} className="flex items-center space-x-2">
                          <Checkbox
                            id={`allergen-${allergen}`}
                            checked={selectedAllergens.includes(allergen)}
                            onCheckedChange={() => toggleAllergen(allergen)}
                          />
                          <Label
                            htmlFor={`allergen-${allergen}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {allergen}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shellfish */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Shellfish</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALLERGEN_GROUPS.shellfish.map((allergen) => (
                        <div key={allergen} className="flex items-center space-x-2">
                          <Checkbox
                            id={`allergen-${allergen}`}
                            checked={selectedAllergens.includes(allergen)}
                            onCheckedChange={() => toggleAllergen(allergen)}
                          />
                          <Label
                            htmlFor={`allergen-${allergen}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {allergen}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Other */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Other</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALLERGEN_GROUPS.other.map((allergen) => (
                        <div key={allergen} className="flex items-center space-x-2">
                          <Checkbox
                            id={`allergen-${allergen}`}
                            checked={selectedAllergens.includes(allergen)}
                            onCheckedChange={() => toggleAllergen(allergen)}
                          />
                          <Label
                            htmlFor={`allergen-${allergen}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {allergen}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedAllergens.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-medium">Selected allergens ({selectedAllergens.length}):</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedAllergens.map((allergen) => (
                          <span
                            key={allergen}
                            className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                  (step === 2 && !canProceedFromStep2)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!canSave || isSubmitting}
              >
                {isEditing ? 'Update Record' : 'Save Record'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
