import { useState } from 'react'
import { TrainingRecord } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { formatDateNZ } from '@/lib/dateUtils'
import { Trash2 } from 'lucide-react'

interface TrainingHistoryTableProps {
  staffId: string
  staffName: string
  records: TrainingRecord[]
}

export function TrainingHistoryTable({ staffId, staffName, records }: TrainingHistoryTableProps) {
  const { deleteTrainingRecord } = useStaffTrainingStore()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<TrainingRecord | null>(null)

  const handleDeleteClick = (record: TrainingRecord) => {
    setRecordToDelete(record)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return

    try {
      await deleteTrainingRecord(staffId, recordToDelete.id)
      toast({
        title: 'Training Record Deleted',
        description: `Removed training record for ${staffName}`,
      })
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting training record:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete training record. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-md bg-card">
        <p className="text-base">No training records yet</p>
        <p className="text-sm mt-2">Click "Log Training Record" to add a new entry</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">
                Topic <span className="text-xs text-muted-foreground">(Part of plan covered)</span>
              </TableHead>
              <TableHead className="font-semibold text-center w-32">Trainer Initials</TableHead>
              <TableHead className="font-semibold w-32">Date</TableHead>
              <TableHead className="font-semibold text-center w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className="min-h-[60px]">
                <TableCell className="font-medium">
                  <div className="py-2">
                    {record.topic.split('(')[0].trim()}
                    {record.topic.includes('(') && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ({record.topic.split('(')[1]}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono font-semibold">
                  {record.trainerInitials}
                </TableCell>
                <TableCell>{formatDateNZ(record.date)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(record)}
                    className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                    style={{
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training record for <strong>{staffName}</strong>?
              {recordToDelete && (
                <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                  <div><strong>Topic:</strong> {recordToDelete.topic}</div>
                  <div className="mt-1"><strong>Date:</strong> {formatDateNZ(recordToDelete.date)}</div>
                  <div className="mt-1"><strong>Trainer:</strong> {recordToDelete.trainerInitials}</div>
                </div>
              )}
              <p className="mt-3 text-destructive font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
