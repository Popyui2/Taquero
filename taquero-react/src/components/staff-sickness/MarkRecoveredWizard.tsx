import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { useStaffSicknessStore, saveSicknessToGoogleSheets } from '@/store/staffSicknessStore'
import { SicknessRecord } from '@/types'
import { CalendarCheck, Pencil } from 'lucide-react'

const formatDateToDDMMYYYY = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const formatDateToISO = (ddmmyyyy: string) => {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month}-${day}`
}

interface MarkRecoveredWizardProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  record: SicknessRecord | null
}

export function MarkRecoveredWizard({ open, onClose, onSuccess, record }: MarkRecoveredWizardProps) {
  const { updateRecordStatus } = useStaffSicknessStore()
  const [dateReturned, setDateReturned] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize date when record changes
  useEffect(() => {
    if (record) {
      setDateReturned(record.dateReturned ? formatDateToDDMMYYYY(record.dateReturned) : formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))
    }
  }, [record])

  const handleClose = () => {
    setDateReturned('')
    onClose()
  }

  const handleSave = async () => {
    if (!record) return

    setIsSubmitting(true)

    try {
      // Create updated record
      const updatedRecord: SicknessRecord = {
        ...record,
        dateReturned: formatDateToISO(dateReturned),
        status: 'returned',
      }

      // Save to Google Sheets
      const saveResult = await saveSicknessToGoogleSheets(updatedRecord)

      if (!saveResult.success) {
        console.warn('⚠️ Failed to save to Google Sheets:', saveResult.error)
        // Continue anyway - data is saved locally
      }

      // Update local store
      updateRecordStatus(record.id, formatDateToISO(dateReturned))

      // Success - close wizard
      handleClose()

      // Notify parent
      onSuccess?.()
    } catch (error) {
      console.error('❌ Error updating record:', error)
      alert('Error updating record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <div className="text-lg font-semibold">Updating record...</div>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            {record?.status === 'returned' ? 'Edit Return Date' : 'Mark as Recovered'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Staff Info */}
          <div className="p-4 bg-muted rounded-lg border">
            <div className="text-sm text-muted-foreground">Staff Member</div>
            <div className="font-semibold text-lg">{record.staffName}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Sick since {new Date(record.dateSick).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Return Date */}
          <div className="space-y-2">
            <Label htmlFor="returnDate" className="text-base">
              When did they return to work?
            </Label>
            <DatePicker
              value={dateReturned}
              onChange={setDateReturned}
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-12 flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !dateReturned}
            className="h-12 flex-1"
          >
            {isSubmitting ? 'Updating...' : record?.status === 'returned' ? 'Update Return Date' : 'Mark as Recovered'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
