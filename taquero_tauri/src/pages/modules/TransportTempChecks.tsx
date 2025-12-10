import { useState, useEffect } from 'react'
import { Plus, Loader2, Truck, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransportTempChecksStore, deleteTransportTempCheckFromGoogleSheets } from '@/store/transportTempChecksStore'
import { AddTransportTempCheckWizard } from '@/components/transportTempChecks/AddTransportTempCheckWizard'
import { TransportTempCheckRecord } from '@/types'
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

export function TransportTempChecks() {
  const { records, isLoading, fetchFromGoogleSheets, deleteRecord } = useTransportTempChecksStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TransportTempCheckRecord | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<TransportTempCheckRecord | null>(null)

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

  const handleCheckAdded = () => {
    addToast('Temperature check saved successfully!')
    fetchFromGoogleSheets()
  }

  const handleEditClick = (record: TransportTempCheckRecord) => {
    setEditingRecord(record)
    setShowAddWizard(true)
  }

  const handleDeleteClick = (record: TransportTempCheckRecord) => {
    setRecordToDelete(record)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      await deleteTransportTempCheckFromGoogleSheets(recordToDelete)
      deleteRecord(recordToDelete.id)
      addToast('Temperature check deleted successfully!')
      setDeleteConfirmOpen(false)
      setRecordToDelete(null)
    } catch (error) {
      console.error('Error deleting temp check:', error)
      addToast('Error deleting temperature check', 'error')
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

  // Get temperature status (for color indicator)
  const getTempStatus = (temp: number): 'safe' | 'borderline' | 'unsafe' => {
    if (temp <= 5) return 'safe'
    if (temp <= 8) return 'borderline'
    return 'unsafe'
  }

  const getTempBadgeColor = (status: 'safe' | 'borderline' | 'unsafe') => {
    switch (status) {
      case 'safe':
        return 'bg-green-500'
      case 'borderline':
        return 'bg-yellow-500'
      case 'unsafe':
        return 'bg-red-500'
    }
  }

  // Get recent checks (last 20 records)
  const recentChecks = [...records]
    .filter((r) => r.status !== 'deleted')
    .sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime())
    .slice(0, 20)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Truck className="h-8 w-8" />Transported Food Temperature Checks</h2>
        <p className="text-muted-foreground text-lg">
          Record temperature checks for food transported for more than 4 hours
        </p>
      </div>

      <Button size="lg" className="w-full md:w-auto" onClick={() => setShowAddWizard(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Record Temperature Check
      </Button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading temperature checks</p>
        </div>
      )}

      {/* Temperature Checks Accordion */}
      {!isLoading && recentChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Temperature Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentChecks.map((record, index) => {
                const isExpanded = expandedRows.has(record.id)
                const tempStatus = getTempStatus(record.temperature)
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
                            isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                          }`}
                        >
                          <Truck className={`h-5 w-5 ${isExpanded ? '' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            Transport from {formatDate(record.checkDate)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {record.typeOfFood} • {record.temperature}°C
                          </p>
                        </div>
                        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${getTempBadgeColor(tempStatus)}`} />
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
                        {/* Food Items */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Food Items
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.typeOfFood}</p>
                        </div>

                        {/* Temperature Check */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Temperature
                            </h4>
                            <p className="text-sm">{record.temperature}°C</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Status
                            </h4>
                            <p className="text-sm">
                              {tempStatus === 'safe' && 'Safe (≤5°C)'}
                              {tempStatus === 'borderline' && 'Borderline (5-8°C)'}
                              {tempStatus === 'unsafe' && 'Unsafe (>8°C) - Should be discarded'}
                            </p>
                          </div>
                        </div>

                        {/* Checked By */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Checked By
                          </h4>
                          <p className="text-sm">{record.taskDoneBy}</p>
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
                        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                          <p>Recorded: {formatDateTime(record.createdAt)}</p>
                          {record.updatedAt && <p>Last updated: {formatDateTime(record.updatedAt)}</p>}
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
      {!isLoading && recentChecks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Truck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No temperature checks yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking transported food temperature checks
            </p>
            <Button onClick={() => setShowAddWizard(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add First Check
            </Button>
          </CardContent>
        </Card>
      )}

      <AddTransportTempCheckWizard
        open={showAddWizard}
        onClose={handleWizardClose}
        onSuccess={handleCheckAdded}
        editingRecord={editingRecord}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Temperature Check?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this temperature check record? This action cannot be undone.
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
