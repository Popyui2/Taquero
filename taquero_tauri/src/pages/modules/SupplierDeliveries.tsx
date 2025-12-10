import { useState, useEffect } from 'react'
import { Plus, Loader2, PackageCheck, Pencil, Trash2, ChevronDown, ChevronUp, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSuppliersDeliveriesStore, deleteDeliveryFromGoogleSheets } from '@/store/suppliersDeliveriesStore'
import { AddSupplierDeliveryWizard } from '@/components/supplierDeliveries/AddSupplierDeliveryWizard'
import { SupplierDeliveryRecord } from '@/types'
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

export function SupplierDeliveries() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useSuppliersDeliveriesStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SupplierDeliveryRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<SupplierDeliveryRecord | null>(null)

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

  const handleDeliveryAdded = () => {
    addToast('Delivery record saved successfully!')
    fetchFromGoogleSheets()
  }

  const handleEditClick = (record: SupplierDeliveryRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: SupplierDeliveryRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      await deleteDeliveryFromGoogleSheets(recordToDelete)
      deleteRecord(recordToDelete.id)
      addToast('Delivery record deleted successfully!')
      setDeleteConfirmOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting delivery:', error)
      addToast('Error deleting delivery record', 'error')
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

  const formatDateTime = (isoTimestamp: string) => {
    const date = new Date(isoTimestamp)
    return date.toLocaleString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get recent deliveries (last 20 records)
  const recentDeliveries = [...records]
    .filter((r) => r.status !== 'deleted')
    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
    .slice(0, 20)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><PackageCheck className="h-8 w-8" />Trusted Supplier Deliveries</h2>
        <p className="text-muted-foreground text-lg">
          Record all deliveries from suppliers for food safety compliance and traceability
        </p>
      </div>

      {/* Add Delivery Button */}
      <Button
        size="lg"
        onClick={() => setShowAddWizard(true)}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Record New Delivery
      </Button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching Data</p>
        </div>
      )}

      {/* Delivery Records Accordion */}
      {!isLoading && recentDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDeliveries.map((record, index) => {
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
                          <PackageCheck className={`h-5 w-5 ${isExpanded ? '' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {record.typeOfFood.length <= 30
                              ? `${record.typeOfFood} from ${record.supplierName}`
                              : `Order from ${record.supplierName}`
                            }
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.deliveryDate)}
                            {record.requiresTempCheck && ` • ${record.temperature}°C`}
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
                        {/* Items Received */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Items Received
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.typeOfFood}</p>
                        </div>

                        {/* Delivery Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Quantity
                            </h4>
                            <p className="text-sm">{record.quantity} {record.unit}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Received By
                            </h4>
                            <p className="text-sm">{record.taskDoneBy}</p>
                          </div>
                        </div>

                        {/* Contact and Batch Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Supplier Contact
                            </h4>
                            <p className="text-sm">{record.supplierContact}</p>
                          </div>
                          {record.batchLotId && (
                            <div>
                              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                                Batch/Lot ID
                              </h4>
                              <p className="text-sm font-mono">{record.batchLotId}</p>
                            </div>
                          )}
                        </div>

                        {/* Temperature Check */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Temperature Check
                          </h4>
                          <p className="text-sm">
                            {record.requiresTempCheck
                              ? `Required: ${record.temperature}°C`
                              : 'Not required'}
                          </p>
                        </div>

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
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            <p>Recorded: {formatDateTime(record.createdAt)}</p>
                            {record.updatedAt && (
                              <p className="mt-1">Last updated: {formatDateTime(record.updatedAt)}</p>
                            )}
                          </div>
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
      {!isLoading && recentDeliveries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <PackageCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No delivery records yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start recording supplier deliveries for traceability
            </p>
            <Button onClick={() => setShowAddWizard(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Record First Delivery
            </Button>
          </CardContent>
        </Card>
      )}

      <AddSupplierDeliveryWizard
        open={showAddWizard}
        onClose={handleWizardClose}
        onSuccess={handleDeliveryAdded}
        editingRecord={editingRecord}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this delivery record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            } animate-in slide-in-from-bottom-5`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
