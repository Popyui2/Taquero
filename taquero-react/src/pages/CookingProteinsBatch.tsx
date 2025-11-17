import { useState, useEffect } from 'react'
import { Plus, Flame, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BatchCheckWizard } from '@/components/batch-check/BatchCheckWizard'
import { useBatchCheckStore } from '@/store/batchCheckStore'
import { Toast, ToastContainer } from '@/components/ui/toast'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function CookingProteinsBatch() {
  const { batchChecks, fetchFromGoogleSheets, isLoading } = useBatchCheckStore()
  const [showWizard, setShowWizard] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // Fetch data on mount
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

  const handleSuccess = () => {
    // Refresh data from Google Sheets
    fetchFromGoogleSheets()
    // Show success toast
    showToast('Batch check saved to Google Sheets!', 'success')
  }

  const getCheckTypeLabel = (type: string): string => {
    switch (type) {
      case 'initial':
        return 'Initial probe'
      case 'weekly':
        return 'Weekly batch check'
      case 'confirm':
        return 'Confirm method'
      case 'doner':
        return 'Doner kebabs'
      default:
        return type
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Cooking Proteins - Batch
        </h2>
        <p className="text-muted-foreground text-lg">
          Temperature batch checks for chicken, beef, and pork
        </p>
      </div>

      <Button
        size="lg"
        onClick={() => setShowWizard(true)}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Batch Check
      </Button>

      {/* Recent Batch Checks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Recent Batch Checks</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last 10 temperature records
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : batchChecks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No batch checks recorded yet</p>
              <p className="text-sm mt-2">
                Click "Add Batch Check" to create your first record
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {batchChecks.slice(0, 10).map((check, idx) => (
                <div
                  key={check.id}
                  className="border rounded-lg p-4 space-y-3 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:scale-[1.01]"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold">
                        {new Date(check.date + 'T00:00').toLocaleDateString('en-NZ', {
                          weekday: 'short',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <div className="text-sm text-muted-foreground">{check.time}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {check.completedBy} • {getCheckTypeLabel(check.checkType)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Food</div>
                      <div className="font-medium">
                        {check.foodType === 'Other' ? check.customFood : check.foodType}
                      </div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Temp</div>
                      <div className="font-mono font-semibold">{check.temperature}°C</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div className="font-medium">{check.timeAtTemperature}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard Modal */}
      <BatchCheckWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleSuccess}
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
