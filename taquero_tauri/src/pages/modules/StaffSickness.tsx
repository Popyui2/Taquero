import { useState, useEffect } from 'react'
import { Plus, Loader2, HeartPulse, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useStaffSicknessStore } from '@/store/staffSicknessStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { AddSicknessRecordWizard } from '@/components/staff-sickness/AddSicknessRecordWizard'
import { MarkRecoveredWizard } from '@/components/staff-sickness/MarkRecoveredWizard'
import { SicknessRecord } from '@/types'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function StaffSickness() {
  const { records, isLoading, fetchFromGoogleSheets } = useStaffSicknessStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [showRecoveredWizard, setShowRecoveredWizard] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SicknessRecord | null>(null)
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())

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
    showToast('Sickness record added successfully', 'success')
  }

  const handleMarkRecovered = (record: SicknessRecord, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedRecord(record)
    setShowRecoveredWizard(true)
  }

  const handleRecoveryMarked = () => {
    showToast('Staff member marked as recovered', 'success')
    setSelectedRecord(null)
  }

  const toggleRecordExpanded = (recordId: string) => {
    setExpandedRecords((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(recordId)) {
        newSet.delete(recordId)
      } else {
        newSet.add(recordId)
      }
      return newSet
    })
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Recent records (last 50)
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HeartPulse className="h-8 w-8" />
          Staff Sickness
        </h2>
        <p className="text-muted-foreground text-lg">
          Track staff health and sickness records
        </p>
      </div>

      {/* Add Record Button */}
      <Button
        size="lg"
        onClick={() => setShowAddWizard(true)}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Record Staff Sickness
      </Button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching Data</p>
        </div>
      )}

      {/* Sickness Records Accordion */}
      {!isLoading && recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sickness Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRecords.map((record, index) => {
                const isExpanded = expandedRecords.has(record.id)
                const isReturned = record.status === 'returned'
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
                      onClick={() => toggleRecordExpanded(record.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                          }`}
                        >
                          <HeartPulse className={`h-5 w-5 ${isExpanded ? '' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg truncate">{record.staffName}</h3>
                            <Badge
                              variant={isReturned ? 'default' : 'destructive'}
                              className={isReturned ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                              {isReturned ? 'Returned' : 'Currently Sick'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sick since {formatDate(record.dateSick)}
                            {isReturned && record.dateReturned && ` • Returned ${formatDate(record.dateReturned)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMarkRecovered(record, e)}
                          className="h-9 w-9 p-0"
                          title={isReturned ? 'Edit return date' : 'Mark as recovered'}
                        >
                          <Pencil className="h-4 w-4" />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Symptoms */}
                          {record.symptoms && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Symptoms</p>
                              <p className="text-sm font-medium mt-1">{record.symptoms}</p>
                            </div>
                          )}

                          {/* Checked By */}
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Checked By</p>
                            <p className="text-sm font-medium mt-1">{record.checkedBy}</p>
                          </div>
                        </div>

                        {/* Action Taken */}
                        {record.actionTaken && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Action Taken</p>
                            <p className="text-sm font-medium mt-1 whitespace-pre-wrap">{record.actionTaken}</p>
                          </div>
                        )}

                        {/* Mark as Recovered Button (if not yet returned) */}
                        {!isReturned && (
                          <div className="pt-2 border-t">
                            <Button
                              onClick={(e) => handleMarkRecovered(record, e)}
                              className="w-full sm:w-auto"
                              variant="default"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Mark as Recovered
                            </Button>
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
            <HeartPulse className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sickness records yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking staff health by recording your first sickness entry
            </p>
            <Button onClick={() => setShowAddWizard(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Record Staff Sickness
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Sickness Record Wizard */}
      <AddSicknessRecordWizard
        open={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={handleRecordAdded}
      />

      {/* Mark Recovered Wizard */}
      <MarkRecoveredWizard
        open={showRecoveredWizard}
        onClose={() => {
          setShowRecoveredWizard(false)
          setSelectedRecord(null)
        }}
        onSuccess={handleRecoveryMarked}
        record={selectedRecord}
      />

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
