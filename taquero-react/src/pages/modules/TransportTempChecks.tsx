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
        <h2 className="text-3xl font-bold tracking-tight">Transported Food Temperature Checks</h2>
        <p className="text-muted-foreground text-lg">
          Record temperature checks for food transported for more than 4 hours
        </p>
      </div>

      <Button size="lg" className="w-full md:w-auto" onClick={() => setShowAddWizard(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Record Temperature Check
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Recent Temperature Checks
            {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentChecks.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No temperature checks yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Record Temperature Check" to add your first check
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Date</th>
                    <th className="text-left p-3 font-semibold text-sm">Type of Food</th>
                    <th className="text-left p-3 font-semibold text-sm">Temperature</th>
                    <th className="text-left p-3 font-semibold text-sm">Checked By</th>
                    <th className="text-right p-3 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChecks.map((record) => {
                    const tempStatus = getTempStatus(record.temperature)
                    return (
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
                              <span className="font-medium">{formatDate(record.checkDate)}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="truncate max-w-[200px]">{record.typeOfFood}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${getTempBadgeColor(tempStatus)}`} />
                              <span className="font-medium">{record.temperature}°C</span>
                            </div>
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
                            <td colSpan={5} className="p-6">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                                  Check Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <strong className="text-sm">Temperature Status:</strong>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {tempStatus === 'safe' && '✓ Safe (≤5°C)'}
                                      {tempStatus === 'borderline' && '⚠️ Borderline (5-8°C)'}
                                      {tempStatus === 'unsafe' && '✗ Unsafe (>8°C) - Should be discarded'}
                                    </p>
                                  </div>
                                  {record.notes && (
                                    <div className="md:col-span-2">
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
