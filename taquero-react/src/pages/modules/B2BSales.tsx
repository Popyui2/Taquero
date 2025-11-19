import { useState, useEffect } from 'react'
import { Plus, Loader2, Building2, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useB2BSalesStore, deleteB2BSaleFromGoogleSheets } from '@/store/b2bSalesStore'
import { AddB2BSaleWizard } from '@/components/b2bSales/AddB2BSaleWizard'
import { B2BSaleRecord } from '@/types'
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

export function B2BSales() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useB2BSalesStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<B2BSaleRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<B2BSaleRecord | null>(null)

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

  const handleSaleAdded = () => {
    addToast('B2B sale recorded successfully!')
    fetchFromGoogleSheets()
  }

  const handleEditClick = (record: B2BSaleRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: B2BSaleRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      await deleteB2BSaleFromGoogleSheets(recordToDelete)
      deleteRecord(recordToDelete.id)
      addToast('B2B sale deleted successfully!')
      setDeleteConfirmOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting B2B sale:', error)
      addToast('Error deleting B2B sale', 'error')
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

  // Get recent sales (last 20 records)
  const recentSales = [...records]
    .filter((r) => r.status !== 'deleted')
    .sort((a, b) => new Date(b.dateSupplied).getTime() - new Date(a.dateSupplied).getTime())
    .slice(0, 20)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Selling Food to Other Businesses</h2>
        <p className="text-muted-foreground text-lg">
          Track food supplied to business customers for traceability and recall purposes
        </p>
      </div>

      <Button size="lg" className="w-full md:w-auto" onClick={() => setShowAddWizard(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Record Business Sale
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Recent B2B Sales
            {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No B2B sales recorded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Record Business Sale" to add your first sale to a business customer
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Date</th>
                    <th className="text-left p-3 font-semibold text-sm">Business</th>
                    <th className="text-left p-3 font-semibold text-sm">Product</th>
                    <th className="text-left p-3 font-semibold text-sm">Quantity</th>
                    <th className="text-left p-3 font-semibold text-sm">Done By</th>
                    <th className="text-right p-3 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((record) => (
                    <>
                      <tr
                        key={record.id}
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleRowExpanded(record.id)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {expandedRows.has(record.id) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{formatDate(record.dateSupplied)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{record.businessName}</p>
                        </td>
                        <td className="p-3">
                          <p className="truncate max-w-[200px]">{record.productSupplied}</p>
                        </td>
                        <td className="p-3">
                          {record.quantity} {record.unit}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{record.taskDoneBy}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(record)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(record)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {expandedRows.has(record.id) && (
                        <tr className="bg-muted/30">
                          <td colSpan={6} className="p-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                                Sale Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <strong className="text-sm">Contact Details:</strong>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                                    {record.contactDetails}
                                  </p>
                                </div>
                                {record.notes && (
                                  <div>
                                    <strong className="text-sm">Notes:</strong>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                                      {record.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2 border-t text-xs text-muted-foreground">
                                <p>Recorded: {formatDateTime(record.createdAt)}</p>
                                {record.updatedAt && <p>Last updated: {formatDateTime(record.updatedAt)}</p>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddB2BSaleWizard
        open={showAddWizard}
        onClose={handleWizardClose}
        onSuccess={handleSaleAdded}
        editingRecord={editingRecord}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete B2B Sale Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this B2B sale record? This action cannot be undone.
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
