import { useState, useEffect } from 'react'
import { Plus, Loader2, Wrench, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEquipmentMaintenanceStore, deleteMaintenanceRecordFromGoogleSheets } from '@/store/equipmentMaintenanceStore'
import { AddMaintenanceRecordWizard } from '@/components/equipmentMaintenance/AddMaintenanceRecordWizard'
import { MaintenanceRecord } from '@/types'
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

export function EquipmentMaintenance() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useEquipmentMaintenanceStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null)

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
    addToast('Maintenance record saved successfully!')
    fetchFromGoogleSheets()
  }

  const handleEditClick = (record: MaintenanceRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: MaintenanceRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      await deleteMaintenanceRecordFromGoogleSheets(recordToDelete)
      deleteRecord(recordToDelete.id)
      addToast('Maintenance record deleted successfully!')
      setDeleteConfirmOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting maintenance record:', error)
      addToast('Error deleting maintenance record', 'error')
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

  // Get active records and show last 20
  const activeRecords = records.filter((r) => r.status === 'active').slice(0, 20)

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wrench className="h-8 w-8" />
          Equipment Maintenance
        </h1>
        <p className="text-muted-foreground text-lg">
          Equipment repair Records
        </p>
      </div>

      {/* Add Maintenance Record Button */}
      <Button
        size="lg"
        onClick={() => setShowAddWizard(true)}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Maintenance Record
      </Button>

      {/* Add/Edit Wizard Dialog */}
      <AddMaintenanceRecordWizard
        open={showAddWizard}
        onClose={handleWizardClose}
        onSuccess={handleRecordAdded}
        editingRecord={editingRecord}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching Data</p>
        </div>
      )}

      {/* Maintenance Records Accordion */}
      {!isLoading && activeRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Records</CardTitle>
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
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer bg-card hover:bg-muted/50 transition-colors"
                      onClick={() => toggleRowExpanded(record.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                          }`}
                        >
                          <Wrench className={`h-5 w-5 ${isExpanded ? '' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{record.equipmentName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.dateCompleted)} • {record.performedBy}
                            {record.checkingFrequency && ` • ${record.checkingFrequency}`}
                          </p>
                        </div>
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
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
                        {/* Maintenance Description */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Maintenance Description
                          </h4>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {record.maintenanceDescription}
                          </p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {record.checkingFrequency && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Checking Frequency</p>
                              <p className="text-sm font-medium mt-1">{record.checkingFrequency}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Performed By</p>
                            <p className="text-sm font-medium mt-1">{record.performedBy}</p>
                          </div>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Additional Notes
                            </h4>
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                          </div>
                        )}
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
            <Wrench className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No maintenance records yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking equipment maintenance to ensure food safety
            </p>
            <Button onClick={() => setShowAddWizard(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add First Maintenance Record
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the maintenance record for "{recordToDelete?.equipmentName}".
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
