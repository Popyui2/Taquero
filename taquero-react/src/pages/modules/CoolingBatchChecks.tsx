import { useState, useEffect } from 'react'
import { Plus, Loader2, Box } from 'lucide-react'
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

  // Recent records (last 50)
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Box className="h-8 w-8" />Cooling Batch Checks
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

      {/* All Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Box className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Batch Check Records</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                All cooling batch check records
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
                Click "Add Batch Check" to add your first entry
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Food Type</th>
                    <th className="pb-3 font-medium">Date Cooked</th>
                    <th className="pb-3 font-medium">Start</th>
                    <th className="pb-3 font-medium">2nd Check</th>
                    <th className="pb-3 font-medium">3rd Check</th>
                    <th className="pb-3 font-medium">Cooling Method</th>
                    <th className="pb-3 font-medium">Completed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentRecords.map((record) => (
                    <tr key={record.id} className="text-sm">
                      <td className="py-3 font-medium">{record.foodType}</td>
                      <td className="py-3">
                        {new Date(record.dateCooked).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">{record.startTime}</div>
                          <div className="font-medium">{record.startTemp}°C</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">{record.secondTimeCheck}</div>
                          <div className="font-medium">{record.secondTempCheck}°C</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="space-y-0.5">
                          <div className="text-xs text-muted-foreground">{record.thirdTimeCheck}</div>
                          <div className="font-medium">{record.thirdTempCheck}°C</div>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground max-w-[250px] truncate">
                        {record.coolingMethod}
                      </td>
                      <td className="py-3">{record.completedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
