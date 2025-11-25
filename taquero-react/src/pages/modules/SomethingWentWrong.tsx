import { useState, useEffect } from 'react'
import { Plus, Loader2, AlertTriangle, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useIncidentsStore, deleteIncidentRecordFromGoogleSheets } from '@/store/incidentsStore'
import { AddIncidentWizard } from '@/components/incidents/AddIncidentWizard'
import { IncidentRecord, IncidentSeverity, IncidentCategory } from '@/types'
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

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

export function SomethingWentWrong() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useIncidentsStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<IncidentRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<IncidentRecord | null>(null)

  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

  const handleRecordAdded = () => {
    addToast('Incident report saved successfully!')
    fetchFromGoogleSheets()
  }

  const handleEditClick = (record: IncidentRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: IncidentRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      await deleteIncidentRecordFromGoogleSheets(recordToDelete)
      deleteRecord(recordToDelete.id)
      addToast('Incident report deleted successfully!')
      setDeleteConfirmOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting incident report:', error)
      addToast('Error deleting incident report', 'error')
    }
  }

  const handleMarkResolved = async (record: IncidentRecord) => {
    try {
      const { updateRecord } = useIncidentsStore.getState()
      const { saveIncidentRecordToGoogleSheets } = await import('@/store/incidentsStore')

      const updatedRecord: IncidentRecord = {
        ...record,
        incidentStatus: 'resolved',
        updatedAt: new Date().toISOString()
      }

      await saveIncidentRecordToGoogleSheets(updatedRecord)
      updateRecord(record.id, { incidentStatus: 'resolved', updatedAt: updatedRecord.updatedAt })
      addToast('Incident marked as resolved!')
      await fetchFromGoogleSheets()
    } catch (error) {
      console.error('Error marking incident as resolved:', error)
      addToast('Error updating incident status', 'error')
    }
  }

  const toggleRowExpanded = (recordId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(recordId)) {
        newSet.delete(recordId)
      } else {
        newSet.add(recordId)
      }
      return newSet
    })
  }

  const handleWizardClose = () => {
    setShowAddWizard(false)
    setEditingRecord(null)
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'minor':
        return 'bg-green-500'
      case 'moderate':
        return 'bg-yellow-500'
      case 'major':
        return 'bg-red-500'
    }
  }

  const getSeverityLabel = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'minor':
        return 'Minor'
      case 'moderate':
        return 'Moderate'
      case 'major':
        return 'Major'
    }
  }

  const getCategoryLabel = (category: IncidentCategory) => {
    const labels: Record<IncidentCategory, string> = {
      'equipment-failure': 'Equipment Failure',
      'temperature-issue': 'Temperature Issue',
      'contamination': 'Contamination',
      'supplier-problem': 'Supplier Problem',
      'staff-error': 'Staff Error',
      'facility-issue': 'Facility Issue',
      'other': 'Other',
    }
    return labels[category]
  }

  // Get active records and show last 30
  const activeRecords = records.filter((r) => r.status === 'active').slice(0, 30)

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          When Something Goes Wrong
        </h2>
        <p className="text-muted-foreground text-lg">
          Critical incident log for food safety issues and corrective actions
        </p>
      </div>

      {/* Report Incident Button */}
      <Button
        size="lg"
        onClick={() => setShowAddWizard(true)}
        variant="destructive"
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Report Incident
      </Button>

      {/* Add/Edit Wizard Dialog */}
      <Dialog open={showAddWizard} onOpenChange={(open) => !open && handleWizardClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              {editingRecord ? 'Edit' : 'Report'} Incident
            </DialogTitle>
          </DialogHeader>
          <AddIncidentWizard
            onComplete={() => {
              handleWizardClose()
              handleRecordAdded()
            }}
            onCancel={handleWizardClose}
          />
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading incidents</p>
        </div>
      )}

      {/* Incidents Accordion */}
      {!isLoading && activeRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRecords.map((record, index) => {
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
                        onClick={() => toggleRowExpanded(record.id)}
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isExpanded ? 'bg-red-500 text-white' : 'bg-red-500/10'
                          }`}
                        >
                          <AlertTriangle className={`h-5 w-5 ${isExpanded ? '' : 'text-red-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg truncate">
                              {getCategoryLabel(record.category)}
                            </h3>
                            {record.followUpDate && (
                              <Badge
                                variant={record.incidentStatus === 'resolved' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {record.incidentStatus === 'resolved' ? '✓ Resolved' : 'Open'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.incidentDate)} • {getSeverityLabel(record.severity)}
                          </p>
                        </div>
                        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${getSeverityColor(record.severity)}`} />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(record)
                          }}
                          className="h-9 w-9 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
                          onClick={() => toggleRowExpanded(record.id)}
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
                        {/* What Went Wrong */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            What Went Wrong
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.whatWentWrong}</p>
                        </div>

                        {/* What Did to Fix */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Corrective Action Taken
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.whatDidToFix}</p>
                        </div>

                        {/* Preventive Action */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Preventive Action
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.preventiveAction}</p>
                        </div>

                        {/* Person Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Person Responsible
                            </h4>
                            <p className="text-sm">{record.personResponsible}</p>
                          </div>
                          {record.staffInvolved && (
                            <div>
                              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                                Staff Involved
                              </h4>
                              <p className="text-sm">{record.staffInvolved}</p>
                            </div>
                          )}
                        </div>

                        {/* Follow-up Date & Resolution */}
                        {record.followUpDate && (
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                                Follow-up Date
                              </h4>
                              <p className="text-sm">{formatDate(record.followUpDate)}</p>
                            </div>
                            {record.incidentStatus !== 'resolved' && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkResolved(record)
                                }}
                                variant="default"
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                ✓ Mark Follow-up Complete
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {record.notes && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Notes
                            </h4>
                            <p className="text-sm whitespace-pre-line leading-relaxed">{record.notes}</p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                          <p>Reported: {formatDate(record.createdAt)}</p>
                          {record.updatedAt && <p>Last updated: {formatDate(record.updatedAt)}</p>}
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
      {!isLoading && activeRecords.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No incident reports yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Report incidents to track issues, fixes, and preventive actions
            </p>
            <Button onClick={() => setShowAddWizard(true)} variant="destructive">
              <Plus className="mr-2 h-5 w-5" />
              Report First Incident
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incident Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this incident report.
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

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
