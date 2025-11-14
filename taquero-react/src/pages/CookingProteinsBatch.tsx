import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, AlertTriangle, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BatchCheckWizard } from '@/components/batch-check/BatchCheckWizard'
import { useBatchCheckStore } from '@/store/batchCheckStore'
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

export function CookingProteinsBatch() {
  const { batchChecks, deleteBatchCheck } = useBatchCheckStore()
  const [showWizard, setShowWizard] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    deleteBatchCheck(id)
    setDeleteId(null)
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
                Latest temperature records
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {batchChecks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No batch checks recorded yet</p>
              <p className="text-sm mt-2">
                Click "Add Batch Check" to create your first record
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {batchChecks.map((check, idx) => (
                <div
                  key={check.id}
                  className="border rounded-lg p-4 space-y-3 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:scale-[1.01]"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold">
                          {new Date(check.date + 'T00:00').toLocaleDateString('en-NZ', {
                            weekday: 'short',
                            month: 'short',
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(check.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
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
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-xs text-muted-foreground">Status</div>
                      {check.isSafe ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Unsafe
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard Modal */}
      <BatchCheckWizard open={showWizard} onClose={() => setShowWizard(false)} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch Check?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this batch check record. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
