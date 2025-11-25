import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  useComplaintsStore,
  deleteComplaintRecordFromGoogleSheets,
} from '@/store/complaintsStore'
import { AddComplaintWizard } from '@/components/complaints/AddComplaintWizard'
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, MessageSquare, Loader2, Pencil } from 'lucide-react'
import { ComplaintRecord } from '@/types'
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

export default function CustomerComplaints() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<ComplaintRecord | null>(null)

  const records = useComplaintsStore((state) => state.getRecords())
  const deleteRecord = useComplaintsStore((state) => state.deleteRecord)
  const fetchFromGoogleSheets = useComplaintsStore((state) => state.fetchFromGoogleSheets)
  const isLoading = useComplaintsStore((state) => state.isLoading)

  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const handleDeleteClick = (record: ComplaintRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return
    deleteRecord(recordToDelete.id)
    await deleteComplaintRecordFromGoogleSheets(recordToDelete)
    setDeleteConfirmOpen(false)
    setRecordToDelete(null)
  }

  const toggleRow = (recordId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedRows(newExpanded)
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-red-500" />
          Customer Complaints Information
        </h2>
        <p className="text-muted-foreground text-lg">
          Document complaints that customers expressed to you
        </p>
      </div>

      {/* Add Complaint Button */}
      <Button
        size="lg"
        onClick={() => setIsAddDialogOpen(true)}
        variant="destructive"
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Complaint
      </Button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching Data</p>
        </div>
      )}

      {/* Complaints Accordion */}
      {!isLoading && records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Complaint Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {records.map((record, index) => {
                const isExpanded = expandedRows.has(record.id)
                return (
                  <div
                    key={record.id}
                    className="border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Collapsed Header */}
                    <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors">
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleRow(record.id)}
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isExpanded ? 'bg-red-500 text-white' : 'bg-red-500/10'
                          }`}
                        >
                          <MessageSquare className={`h-5 w-5 ${isExpanded ? '' : 'text-red-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {record.customerName} - {record.foodItem}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.purchaseDate)} • {record.complaintStatus}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(record)
                          }}
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(record.id)}
                          className="h-9 w-9 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Complaint Description */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Complaint
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.complaintDescription}</p>
                        </div>

                        {/* Customer & Purchase Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Customer Contact
                            </h4>
                            <p className="text-sm">{record.customerContact}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Purchase Time
                            </h4>
                            <p className="text-sm">{record.purchaseTime}</p>
                          </div>
                        </div>

                        {record.batchLotNumber && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Batch/Lot Number
                            </h4>
                            <p className="text-sm font-mono">{record.batchLotNumber}</p>
                          </div>
                        )}

                        {/* Investigation */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Investigation & Cause
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.causeInvestigation}</p>
                        </div>

                        {/* Actions Taken */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Immediate Action
                            </h4>
                            <p className="text-sm whitespace-pre-line leading-relaxed">{record.actionTakenImmediate}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Preventive Action
                            </h4>
                            <p className="text-sm whitespace-pre-line leading-relaxed">{record.actionTakenPreventive}</p>
                          </div>
                        </div>

                        {/* Resolution */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Resolved By
                          </h4>
                          <p className="text-sm">{record.resolvedBy} on {formatDate(record.resolutionDate)}</p>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Additional Notes
                            </h4>
                            <p className="text-sm whitespace-pre-line leading-relaxed">{record.notes}</p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                          <p>Recorded: {formatDate(record.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && records.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No complaint records yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start documenting customer complaints for MPI compliance
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} variant="destructive">
              <Plus className="mr-2 h-5 w-5" />
              Add First Complaint
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Complaint Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Customer Complaint</DialogTitle>
            <DialogDescription>
              Document the complaint, investigation, and resolution for MPI compliance
            </DialogDescription>
          </DialogHeader>
          <AddComplaintWizard
            onComplete={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer complaint record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
