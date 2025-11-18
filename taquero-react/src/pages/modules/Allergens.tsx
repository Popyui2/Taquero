import { useState, useEffect } from 'react'
import { Plus, Loader2, Utensils, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAllergensStore } from '@/store/allergensStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { AddAllergenWizard } from '@/components/allergens/AddAllergenWizard'
import { AllergenRecord } from '@/types'
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

export function Allergens() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useAllergensStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AllergenRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<AllergenRecord | null>(null)

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
    showToast('Allergen record added successfully', 'success')
  }

  const handleRecordUpdated = () => {
    showToast('Allergen record updated successfully', 'success')
  }

  const handleEdit = (record: AllergenRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: AllergenRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (recordToDelete) {
      deleteRecord(recordToDelete.id)
      showToast('Allergen record deleted successfully', 'success')
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
          Allergens in My Food
        </h2>
        <p className="text-muted-foreground text-lg">
          Track allergens in your dishes to help inform customers
        </p>
      </div>

      {/* Info Note */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Recording this information is optional but helps your staff know what's in your food.
            Remember to keep this up to date when recipes are changed or updated.
          </p>
        </CardContent>
      </Card>

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
        Add Allergen Record
      </Button>

      {/* All Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Allergen Records</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {recentRecords.length > 0
                  ? `${recentRecords.length} dish${recentRecords.length !== 1 ? 'es' : ''} recorded`
                  : 'No records yet'}
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
              <p className="text-lg font-medium">No records yet</p>
              <p className="text-sm mt-2">
                Click "Add Allergen Record" to add your first dish
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium w-8"></th>
                    <th className="pb-3 font-medium">Dish Name</th>
                    <th className="pb-3 font-medium">Allergens</th>
                    <th className="pb-3 font-medium">Created By</th>
                    <th className="pb-3 font-medium">Date</th>
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
                          <td className="py-3 font-medium">{record.dishName}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {record.allergens.slice(0, 3).map((allergen, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                >
                                  {allergen}
                                </span>
                              ))}
                              {record.allergens.length > 3 && (
                                <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  +{record.allergens.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">{record.createdBy}</td>
                          <td className="py-3">
                            {new Date(record.createdAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(record)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                title="Edit record"
                              >
                                <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(record)}
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                title="Delete record"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${record.id}-expanded`}>
                            <td colSpan={6} className="py-4 px-4 bg-muted/30">
                              <div className="space-y-2">
                                <div>
                                  <strong className="text-sm">Ingredients:</strong>
                                  <p className="text-sm text-muted-foreground mt-1">{record.ingredients}</p>
                                </div>
                                <div>
                                  <strong className="text-sm">All Allergens:</strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {record.allergens.map((allergen, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      >
                                        {allergen}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {record.updatedAt && (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    Last updated: {new Date(record.updatedAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Allergen Wizard */}
      <AddAllergenWizard
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
            <AlertDialogTitle>Delete Allergen Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the allergen record for "{recordToDelete?.dishName}"?
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
