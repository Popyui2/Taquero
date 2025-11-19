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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Equipment Maintenance
          </h1>
          <p className="text-muted-foreground mt-2">
            Track equipment and facility maintenance including water supply
          </p>
        </div>
        <Button onClick={() => setShowAddWizard(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Add Maintenance Record
        </Button>
      </div>

      {/* Add/Edit Wizard Dialog */}
      {showAddWizard && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>{editingRecord ? 'Edit' : 'Add'} Maintenance Record</CardTitle>
          </CardHeader>
          <CardContent>
            <AddMaintenanceRecordWizard
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
            <CardTitle>Recent Maintenance Records (Last 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Equipment/Item</th>
                    <th className="text-left p-3 font-semibold">Performed By</th>
                    <th className="text-left p-3 font-semibold">Frequency</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecords.map((record) => {
                    const isExpanded = expandedRows.has(record.id)
                    return (
                      <>
                        <tr key={record.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{formatDate(record.dateCompleted)}</td>
                          <td className="p-3 font-medium">{record.equipmentName}</td>
                          <td className="p-3">{record.performedBy}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {record.checkingFrequency || 'N/A'}
                          </td>
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
                            <td colSpan={5} className="p-4">
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-semibold">Maintenance Description:</span>
                                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                                    {record.maintenanceDescription}
                                  </p>
                                </div>
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
