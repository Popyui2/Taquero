import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cooking Proteins - Batch
          </h2>
          <p className="text-muted-foreground text-lg mt-1">
            Temperature batch checks for chicken, beef, and pork
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setShowWizard(true)}
          className="h-12 px-6 min-h-[48px]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Batch Check
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="animate-in fade-in slide-in-from-top-4 duration-500">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 animate-in fade-in zoom-in duration-300" style={{ animationDelay: '100ms' }}>
              <div className="text-2xl font-bold">{batchChecks.length}</div>
              <div className="text-sm text-muted-foreground">Total Checks</div>
            </div>
            <div className="space-y-1 animate-in fade-in zoom-in duration-300" style={{ animationDelay: '200ms' }}>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {batchChecks.filter((c) => c.isSafe).length}
              </div>
              <div className="text-sm text-muted-foreground">Safe</div>
            </div>
            <div className="space-y-1 animate-in fade-in zoom-in duration-300" style={{ animationDelay: '300ms' }}>
              <div className="text-2xl font-bold text-destructive">
                {batchChecks.filter((c) => !c.isSafe).length}
              </div>
              <div className="text-sm text-muted-foreground">Unsafe</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Checks Table */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <CardHeader>
          <CardTitle>Batch Check Records</CardTitle>
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Food</TableHead>
                    <TableHead>Check Type</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Time at Temp</TableHead>
                    <TableHead>Completed By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>
                        {new Date(check.date + 'T00:00').toLocaleDateString('en-NZ')}
                      </TableCell>
                      <TableCell>{check.time}</TableCell>
                      <TableCell>
                        {check.foodType === 'Other' ? check.customFood : check.foodType}
                      </TableCell>
                      <TableCell>{getCheckTypeLabel(check.checkType)}</TableCell>
                      <TableCell className="font-mono">{check.temperature}°C</TableCell>
                      <TableCell>{check.timeAtTemperature}</TableCell>
                      <TableCell>{check.completedBy}</TableCell>
                      <TableCell>
                        {check.isSafe ? (
                          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Safe
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            Unsafe
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(check.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
