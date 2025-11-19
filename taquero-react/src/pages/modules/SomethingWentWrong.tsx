import { useState, useEffect } from 'react'
import { Plus, Loader2, AlertTriangle, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'minor':
        return <Badge className="bg-green-500">🟢 Minor</Badge>
      case 'moderate':
        return <Badge className="bg-yellow-500">🟡 Moderate</Badge>
      case 'major':
        return <Badge className="bg-red-500">🔴 Major</Badge>
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            When Something Goes Wrong
          </h1>
          <p className="text-muted-foreground mt-2">
            Critical incident log for food safety issues and corrective actions
          </p>
        </div>
        <Button onClick={() => setShowAddWizard(true)} size="lg" variant="destructive">
          <Plus className="mr-2 h-5 w-5" />
          Report Incident
        </Button>
      </div>

      {/* Add/Edit Wizard Dialog */}
      {showAddWizard && (
        <Card className="border-2 border-red-500">
          <CardHeader>
            <CardTitle>{editingRecord ? 'Edit' : 'Report'} Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <AddIncidentWizard
              onComplete={() => {
                handleWizardClose()
                handleRecordAdded()
              }}
              onCancel={handleWizardClose}
            />
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Records Table */}
      {!isLoading && activeRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents (Last 30)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Severity</th>
                    <th className="text-left p-3 font-semibold">Category</th>
                    <th className="text-left p-3 font-semibold">What Went Wrong</th>
                    <th className="text-left p-3 font-semibold">Person Responsible</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecords.map((record) => {
                    const isExpanded = expandedRows.has(record.id)
                    return (
                      <>
                        <tr key={record.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{formatDate(record.incidentDate)}</td>
                          <td className="p-3">{getSeverityBadge(record.severity)}</td>
                          <td className="p-3 text-sm">{getCategoryLabel(record.category)}</td>
                          <td className="p-3 font-medium max-w-xs truncate">
                            {record.whatWentWrong}
                          </td>
                          <td className="p-3">{record.personResponsible}</td>
                          <td className="p-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpanded(record.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(record)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(record)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-muted/30">
                            <td colSpan={6} className="p-4">
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="font-semibold">Staff Involved:</span>
                                    <p className="text-muted-foreground">{record.staffInvolved}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold">Status:</span>
                                    <p className="text-muted-foreground capitalize">{record.incidentStatus}</p>
                                  </div>
                                </div>

                                <div>
                                  <span className="font-semibold">What Went Wrong:</span>
                                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                                    {record.whatWentWrong}
                                  </p>
                                </div>

                                <div>
                                  <span className="font-semibold">What Did to Fix:</span>
                                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                                    {record.whatDidToFix}
                                  </p>
                                </div>

                                <div>
                                  <span className="font-semibold">Preventive Action:</span>
                                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                                    {record.preventiveAction}
                                  </p>
                                </div>

                                <div>
                                  <span className="font-semibold">Food Safety Action:</span>
                                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                                    {record.foodSafetyAction}
                                  </p>
                                </div>

                                {record.followUpDate && (
                                  <div>
                                    <span className="font-semibold">Follow-up Date:</span>
                                    <p className="text-muted-foreground">{formatDate(record.followUpDate)}</p>
                                  </div>
                                )}

                                {record.notes && (
                                  <div>
                                    <span className="font-semibold">Notes:</span>
                                    <p className="mt-1 text-muted-foreground">{record.notes}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
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
