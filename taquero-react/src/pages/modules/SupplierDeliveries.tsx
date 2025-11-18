import { useState, useEffect } from 'react'
import { Plus, Loader2, Truck, Pencil, Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDeliveriesStore, deleteDeliveryFromGoogleSheets } from '@/store/deliveriesStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { AddDeliveryWizard } from '@/components/deliveries/AddDeliveryWizard'
import { DeliveryRecord } from '@/types'
import { format } from 'date-fns'
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
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function SupplierDeliveries() {
  const { records, isLoading, fetchFromGoogleSheets, deleteDelivery } = useDeliveriesStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DeliveryRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<DeliveryRecord | null>(null)

  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleDeliveryAdded = () => {
    showToast('Delivery record saved successfully!', 'success')
    setEditingRecord(null)
  }

  const handleEdit = (record: DeliveryRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: DeliveryRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      const result = await deleteDeliveryFromGoogleSheets(recordToDelete)
      if (result.success) {
        deleteDelivery(recordToDelete.id)
        showToast('Delivery record deleted successfully', 'success')
      } else {
        showToast(`Error: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('Failed to delete record', 'error')
    } finally {
      setDeleteConfirmOpen(false)
      setRecordToDelete(null)
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

  const getTempStatus = (record: DeliveryRecord): 'ok' | 'warning' | 'none' => {
    if (!record.requiresTempCheck) return 'none'
    if (record.temperature === undefined || record.temperature === null) return 'none'

    // Safe ranges: ≤5°C (cold/chilled and frozen) OR ≥60°C (hot)
    if (record.temperature <= 5 || record.temperature >= 60) return 'ok'

    // Danger zone: 5°C to 60°C
    return 'warning'
  }

  const getTempStatusColor = (status: 'ok' | 'warning' | 'none') => {
    switch (status) {
      case 'ok':
        return 'text-green-500'
      case 'warning':
        return 'text-red-500'
      case 'none':
        return 'text-gray-500'
    }
  }

  const getTempStatusIcon = (status: 'ok' | 'warning' | 'none') => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'none':
        return null
    }
  }

  // Recent records (last 20)
  const recentRecords = [...records]
    .filter((r) => r.status !== 'deleted')
    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
    .slice(0, 20)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Supplier Deliveries</h2>
        <p className="text-muted-foreground text-lg">
          Record all deliveries from suppliers for food safety compliance and traceability
        </p>
      </div>

      <Button size="lg" onClick={() => setShowAddWizard(true)} className="w-full sm:w-auto">
        <Plus className="h-5 w-5 mr-2" />
        Record Delivery
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Recent Deliveries</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Last 20 delivery records</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No delivery records found. Click "Record Delivery" to add your first record.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Supplier</th>
                    <th className="text-left p-3 font-semibold">Food Type</th>
                    <th className="text-left p-3 font-semibold">Quantity</th>
                    <th className="text-left p-3 font-semibold">Temp</th>
                    <th className="text-left p-3 font-semibold">By</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((record) => {
                    const isExpanded = expandedRows.has(record.id)
                    const tempStatus = getTempStatus(record)

                    return (
                      <>
                        <tr key={record.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            {format(new Date(record.deliveryDate), 'MMM d, yyyy')}
                          </td>
                          <td className="p-3 font-medium">{record.supplierName}</td>
                          <td className="p-3">{record.typeOfFood}</td>
                          <td className="p-3">
                            {record.quantity} {record.unit}
                          </td>
                          <td className="p-3">
                            {record.requiresTempCheck ? (
                              <div className={`flex items-center gap-1 ${getTempStatusColor(tempStatus)}`}>
                                {getTempStatusIcon(tempStatus)}
                                <span className="font-mono">
                                  {record.temperature !== undefined ? `${record.temperature}°C` : 'N/A'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="p-3">{record.taskDoneBy}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
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
                                onClick={() => handleEdit(record)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(record)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-muted/30">
                            <td colSpan={7} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-semibold">Supplier Contact:</span>{' '}
                                  {record.supplierContact}
                                </div>
                                <div>
                                  <span className="font-semibold">Batch/Lot ID:</span>{' '}
                                  {record.batchLotId || 'Not provided'}
                                </div>
                                <div>
                                  <span className="font-semibold">Temperature Check Required:</span>{' '}
                                  {record.requiresTempCheck ? 'Yes' : 'No'}
                                </div>
                                {record.requiresTempCheck && record.temperature !== undefined && (
                                  <div>
                                    <span className="font-semibold">Temperature:</span>{' '}
                                    <span className={getTempStatusColor(tempStatus)}>
                                      {record.temperature}°C
                                      {tempStatus === 'warning' && ' ⚠️ Out of safe range'}
                                      {tempStatus === 'ok' && ' ✓ Safe'}
                                    </span>
                                  </div>
                                )}
                                {record.notes && (
                                  <div className="md:col-span-2">
                                    <span className="font-semibold">Notes:</span>{' '}
                                    {record.notes}
                                  </div>
                                )}
                                <div className="md:col-span-2 text-xs text-muted-foreground">
                                  Recorded by {record.createdBy} on{' '}
                                  {format(new Date(record.createdAt), 'MMMM d, yyyy h:mm a')}
                                </div>
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
          )}
        </CardContent>
      </Card>

      <AddDeliveryWizard
        open={showAddWizard}
        onClose={() => {
          setShowAddWizard(false)
          setEditingRecord(null)
        }}
        onSuccess={handleDeliveryAdded}
        editingRecord={editingRecord}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the delivery record as deleted. This action cannot be undone.
              {recordToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <div><strong>Supplier:</strong> {recordToDelete.supplierName}</div>
                  <div><strong>Food:</strong> {recordToDelete.typeOfFood}</div>
                  <div><strong>Date:</strong> {format(new Date(recordToDelete.deliveryDate), 'MMMM d, yyyy')}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </div>
  )
}
