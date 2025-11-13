import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { getTodayNZ } from '@/lib/dateUtils'
import { useToast } from '@/components/ui/use-toast'

interface LogTrainingModalProps {
  staffId: string
  staffName: string
  open: boolean
  onClose: () => void
}

// MPI Training Topics
const TRAINING_TOPICS = [
  'Wash hands (washing with soap for 20 seconds and drying thoroughly)',
  'Personal hygiene (hair, jewelry, and illness)',
  'Protecting food from contamination (clean clothes and managing sickness)',
  'Separating food (raw vs cooked, allergy awareness)',
  'Cleaning up (what to clean, when, and how)',
  'Temperature monitoring',
  'Equipment maintenance',
  'Fridge/chiller management',
]

export function LogTrainingModal({ staffId, staffName, open, onClose }: LogTrainingModalProps) {
  const { addTrainingRecord } = useStaffTrainingStore()
  const { toast } = useToast()

  const [topic, setTopic] = useState('')
  const [trainerInitials, setTrainerInitials] = useState('')
  const [date, setDate] = useState(getTodayNZ())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    // Validation
    if (!topic) {
      toast({
        title: 'Missing Information',
        description: 'Please select a training topic',
        variant: 'destructive',
      })
      return
    }

    if (!trainerInitials || trainerInitials.length < 2 || trainerInitials.length > 3) {
      toast({
        title: 'Invalid Initials',
        description: 'Trainer initials must be 2-3 characters',
        variant: 'destructive',
      })
      return
    }

    if (!date) {
      toast({
        title: 'Missing Date',
        description: 'Please select a training date',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await addTrainingRecord(staffId, {
        topic,
        trainerInitials: trainerInitials.toUpperCase(),
        date: new Date(date).toISOString(),
      })

      toast({
        title: 'Training Logged',
        description: `Training record added for ${staffName}`,
      })

      // Reset form
      setTopic('')
      setTrainerInitials('')
      setDate(getTodayNZ())

      onClose()
    } catch (error) {
      console.error('Error adding training record:', error)
      toast({
        title: 'Error',
        description: 'Failed to save training record. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form
    setTopic('')
    setTrainerInitials('')
    setDate(getTodayNZ())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Log Training Record</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Recording training for <span className="font-semibold">{staffName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Training Topic */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Training Topic <span className="text-destructive">*</span>
            </label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select from MPI FCP topics..." />
              </SelectTrigger>
              <SelectContent>
                {TRAINING_TOPICS.map((t) => (
                  <SelectItem key={t} value={t} className="py-3">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trainer Initials */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Trainer Initials <span className="text-destructive">*</span>
            </label>
            <Input
              value={trainerInitials}
              onChange={(e) => setTrainerInitials(e.target.value.toUpperCase())}
              placeholder="e.g., MW or MAW"
              maxLength={3}
              className="h-12 text-base font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">Enter 2-3 characters</p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 text-base"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-12 px-6 min-h-[48px] text-base"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="h-12 px-8 min-h-[48px] text-base font-medium"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Training Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
