import { useState, useEffect } from 'react'
import { Plus, Loader2, Building2, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSuppliersStore, deleteSupplierFromGoogleSheets } from '@/store/suppliersStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { AddSupplierWizard } from '@/components/suppliers/AddSupplierWizard'
import { SupplierRecord } from '@/types'
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

export function MySuppliers() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useSuppliersStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SupplierRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<SupplierRecord | null>(null)

  // Fetch data from Google Sheets on mount
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

  const handleRecordAdded = () => {
    showToast('Supplier added successfully', 'success')
  }

  const handleRecordUpdated = () => {
    showToast('Supplier updated successfully', 'success')
  }

  const handleEdit = (record: SupplierRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: SupplierRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (recordToDelete) {
      // Mark as deleted in Google Sheets
      await deleteSupplierFromGoogleSheets(recordToDelete)

      // Mark as deleted locally
      deleteRecord(recordToDelete.id)
      showToast('Supplier deleted successfully', 'success')
      setRecordToDelete(null)
    }
    setDeleteConfirmOpen(false)
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

  // Recent records (last 50)
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          My Trusted Suppliers
        </h2>
        <p className="text-muted-foreground text-lg">
          Track trusted suppliers for food safety and recall purposes
        </p>
      </div>

      {/* Add Record Button */}
      <Button
        size="lg"
        onClick={() => {
          setEditingRecord(null)
          setShowAddWizard(true)
        }}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Supplier
      </Button>

      {/* All Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Trusted Suppliers</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {recentRecords.length > 0
                  ? `${recentRecords.length} supplier${recentRecords.length !== 1 ? 's' : ''} registered`
                  : 'No suppliers yet'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No suppliers yet</p>
              <p className="text-sm mt-2">
                Click "Add Supplier" to add your first trusted supplier
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium w-8"></th>
                    <th className="pb-3 font-medium">Business Name</th>
                    <th className="pb-3 font-medium">Registration #</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentRecords.map((record) => {
                    const isExpanded = expandedRows.has(record.id)
                    return (
                      <>
                        <tr key={record.id} className="text-sm">
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpanded(record.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                          <td className="py-3 font-medium">{record.businessName}</td>
                          <td className="py-3 font-mono text-xs">{record.siteRegistrationNumber}</td>
                          <td className="py-3">{record.contactPerson}</td>
                          <td className="py-3">{record.phone}</td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(record)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                title="Edit supplier"
                              >
                                <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(record)}
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                title="Delete supplier"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${record.id}-expanded`}>
                            <td colSpan={6} className="py-4 px-4 bg-muted/30">
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <strong className="text-sm">Email:</strong>
                                    <p className="text-sm text-muted-foreground mt-1">{record.email}</p>
                                  </div>
                                  <div>
                                    <strong className="text-sm">Address:</strong>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{record.address}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <strong className="text-sm">Days to place orders:</strong>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {record.orderDays.length > 0 ? (
                                        record.orderDays.map((day, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                          >
                                            {day}
                                          </span>
                                        ))
                                      ) : (
                                        <p className="text-sm text-muted-foreground">N/A</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <strong className="text-sm">Days to receive delivery:</strong>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {record.deliveryDays.length > 0 ? (
                                        record.deliveryDays.map((day, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                          >
                                            {day}
                                          </span>
                                        ))
                                      ) : (
                                        <p className="text-sm text-muted-foreground">N/A</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {record.customArrangement && (
                                  <div>
                                    <strong className="text-sm">Custom arrangement:</strong>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{record.customArrangement}</p>
                                  </div>
                                )}
                                <div>
                                  <strong className="text-sm">Goods supplied:</strong>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{record.goodsSupplied}</p>
                                </div>
                                {record.comments && (
                                  <div>
                                    <strong className="text-sm">Comments:</strong>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{record.comments}</p>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                  Added by {record.createdBy} on {new Date(record.createdAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {record.updatedAt && (
                                    <span> • Last updated: {new Date(record.updatedAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
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

      {/* Add/Edit Supplier Wizard */}
      <AddSupplierWizard
        open={showAddWizard}
        onClose={() => {
          setShowAddWizard(false)
          setEditingRecord(null)
        }}
        onSuccess={editingRecord ? handleRecordUpdated : handleRecordAdded}
        editingRecord={editingRecord}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recordToDelete?.businessName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast Notifications */}
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
