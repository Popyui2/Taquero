import { useState, useEffect } from 'react'
import { Plus, Loader2, Utensils, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAllergensStore, deleteAllergenFromGoogleSheets } from '@/store/allergensStore'
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

  const handleDeleteConfirm = async () => {
    if (recordToDelete) {
      // Mark as deleted in Google Sheets
      await deleteAllergenFromGoogleSheets(recordToDelete)

      // Mark as deleted locally
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
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Utensils className="h-8 w-8" />
          Allergens in My Food
        </h2>
        <p className="text-muted-foreground text-lg">
          Track allergens in your dishes to help inform customers
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
        Add Allergen Record
      </Button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching Data</p>
        </div>
      )}

      {/* Allergen Records Accordion */}
      {!isLoading && recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allergen Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRecords.map((record, index) => {
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
                          <Utensils className={`h-5 w-5 ${isExpanded ? '' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{record.dishName}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.allergens.slice(0, 3).map((allergen, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              >
                                {allergen}
                              </span>
                            ))}
                            {record.allergens.length > 3 && (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                                +{record.allergens.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(record)
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
                        {/* Ingredients */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Ingredients
                          </h4>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {record.ingredients}
                          </p>
                        </div>

                        {/* All Allergens */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            All Allergens ({record.allergens.length})
                          </h4>
                          <ul className="space-y-1.5">
                            {record.allergens.map((allergen, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span className="leading-relaxed">{allergen}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Created By</p>
                            <p className="text-sm font-medium mt-1">{record.createdBy}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
                            <p className="text-sm font-medium mt-1">
                              {new Date(record.createdAt).toLocaleDateString('en-NZ', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {record.updatedAt && (
                          <div className="text-xs text-muted-foreground pt-2">
                            Last updated: {new Date(record.updatedAt).toLocaleDateString('en-NZ', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
      {!isLoading && recentRecords.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Utensils className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No allergen records yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking allergens in your dishes to inform customers
            </p>
            <Button onClick={() => setShowAddWizard(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add First Allergen Record
            </Button>
          </CardContent>
        </Card>
      )}

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
