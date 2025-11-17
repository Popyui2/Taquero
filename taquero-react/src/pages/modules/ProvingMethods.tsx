import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Loader2, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useProvingMethodStore } from '@/store/provingMethodStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { NewMethodWizard } from '@/components/proving-method/NewMethodWizard'
import { AddBatchWizard } from '@/components/proving-method/AddBatchWizard'
import { ProvingMethod } from '@/types'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function ProvingMethods() {
  const { methods, isLoading, fetchFromGoogleSheets } = useProvingMethodStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showNewMethodWizard, setShowNewMethodWizard] = useState(false)
  const [showAddBatchWizard, setShowAddBatchWizard] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<ProvingMethod | null>(null)

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

  const handleMethodCreated = () => {
    showToast('Method created with Batch 1! Record 2 more batches to prove it works.', 'success')
  }

  const handleAddBatch = (method: ProvingMethod) => {
    setSelectedMethod(method)
    setShowAddBatchWizard(true)
  }

  const handleBatchAdded = (isProven: boolean) => {
    if (isProven) {
      showToast('🎉 Method proven! You have completed 3 successful batches.', 'success')
    } else {
      showToast(`Batch recorded! ${selectedMethod ? 3 - selectedMethod.batches.length - 1 : 0} more batch${selectedMethod && 3 - selectedMethod.batches.length - 1 === 1 ? '' : 'es'} to go.`, 'success')
    }
    setSelectedMethod(null)
  }

  // Show only last 10 methods
  const recentMethods = methods.slice(0, 10)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Proving Your Method
        </h2>
        <p className="text-muted-foreground text-lg">
          Validate cooking methods with 3 consecutive successful batches
        </p>
      </div>

      {/* Create New Method Button */}
      <Button
        size="lg"
        onClick={() => setShowNewMethodWizard(true)}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create New Method
      </Button>

      {/* Methods List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Your Methods</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last 10 methods (in-progress and proven)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentMethods.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No methods created yet</p>
              <p className="text-sm mt-2">
                Click "Create New Method" to validate your first cooking method
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMethods.map((method, idx) => (
                <div
                  key={method.id}
                  className="border rounded-lg p-4 space-y-4 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:scale-[1.01]"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Header with status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{method.itemDescription}</h3>
                        {method.status === 'proven' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Method Proven
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-background border text-foreground text-xs font-medium">
                            {method.batches.length}/3 Batches
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {method.cookingMethod}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <Progress value={(method.batches.length / 3) * 100} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {method.batches.length === 3
                          ? `Proven on ${new Date(method.provenAt!).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : `${method.batches.length}/3 batches complete`}
                      </span>
                    </div>
                  </div>

                  {/* Batch history */}
                  <div className="space-y-2">
                    {[1, 2, 3].map((batchNum) => {
                      const batch = method.batches.find((b) => b.batchNumber === batchNum)
                      if (batch) {
                        return (
                          <div
                            key={batchNum}
                            className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{batchNum}{batchNum === 1 ? 'st' : batchNum === 2 ? 'nd' : 'rd'}:</span>
                              <span>
                                {new Date(batch.date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="font-mono">{batch.temperature}°C</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{batch.timeAtTemp}</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{batch.completedBy}</span>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div
                            key={batchNum}
                            className="flex items-center gap-3 text-sm p-2 text-muted-foreground"
                          >
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                            <span>{batchNum}{batchNum === 1 ? 'st' : batchNum === 2 ? 'nd' : 'rd'}: Not recorded yet</span>
                          </div>
                        )
                      }
                    })}
                  </div>

                  {/* Action button for in-progress methods */}
                  {method.status === 'in-progress' && (
                    <Button
                      onClick={() => handleAddBatch(method)}
                      className="w-full"
                      size="lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Next Batch ({method.batches.length + 1}/3)
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Method Wizard */}
      <NewMethodWizard
        open={showNewMethodWizard}
        onClose={() => setShowNewMethodWizard(false)}
        onSuccess={handleMethodCreated}
      />

      {/* Add Batch Wizard */}
      {selectedMethod && (
        <AddBatchWizard
          open={showAddBatchWizard}
          onClose={() => {
            setShowAddBatchWizard(false)
            setSelectedMethod(null)
          }}
          onSuccess={handleBatchAdded}
          method={selectedMethod}
        />
      )}

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
