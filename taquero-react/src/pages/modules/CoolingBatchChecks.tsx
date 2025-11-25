import { useState, useEffect } from 'react'
import { Plus, Loader2, Snowflake, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCoolingBatchCheckStore } from '@/store/coolingBatchCheckStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { AddBatchCheckWizard } from '@/components/cooling-batch/AddBatchCheckWizard'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function CoolingBatchChecks() {
  const { records, isLoading, fetchFromGoogleSheets } = useCoolingBatchCheckStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

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
    showToast('Batch check record added successfully', 'success')
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
          <Snowflake className="h-8 w-8" />Cooling Batch Checks
        </h2>
        <p className="text-muted-foreground text-lg">
          Weekly cooling checks for freshly cooked food
        </p>
      </div>

      {/* Add Record Button */}
      <Button
        size="lg"
        onClick={() => setShowAddWizard(true)}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Batch Check
      </Button>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Fetching Data</p>
        </div>
      )}

      {/* Batch Check Records Accordion */}
      {!isLoading && recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Batch Checks</CardTitle>
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
                          <Snowflake className={`h-5 w-5 ${isExpanded ? '' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {record.foodType}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.dateCooked)} • {record.startTemp}°C → {record.secondTempCheck}°C → {record.thirdTempCheck}°C
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
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
                        {/* Temperature Checks */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              Start Check
                            </h4>
                            <p className="text-sm">
                              <span className="font-mono font-semibold">{record.startTemp}°C</span>
                              <span className="text-muted-foreground ml-2">at {record.startTime}</span>
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              2nd Check
                            </h4>
                            <p className="text-sm">
                              <span className="font-mono font-semibold">{record.secondTempCheck}°C</span>
                              <span className="text-muted-foreground ml-2">at {record.secondTimeCheck}</span>
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                              3rd Check
                            </h4>
                            <p className="text-sm">
                              <span className="font-mono font-semibold">{record.thirdTempCheck}°C</span>
                              <span className="text-muted-foreground ml-2">at {record.thirdTimeCheck}</span>
                            </p>
                          </div>
                        </div>

                        {/* Cooling Method */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Cooling Method
                          </h4>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{record.coolingMethod}</p>
                        </div>

                        {/* Completed By */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Completed By
                          </h4>
                          <p className="text-sm">{record.completedBy}</p>
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
      {!isLoading && recentRecords.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Snowflake className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No batch checks yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start tracking your cooling batch checks
            </p>
            <Button onClick={() => setShowAddWizard(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add First Check
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Batch Check Wizard */}
      <AddBatchCheckWizard
        open={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={handleRecordAdded}
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
