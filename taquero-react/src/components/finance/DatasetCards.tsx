import { useState } from 'react'
import { Building2, Trash2, Calendar, FileText, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import type { CompanyDataset } from '@/types/finance'
import { deleteCompanyDataset } from '@/lib/finance/storage'
import { formatDistanceToNow } from 'date-fns'

interface DatasetCardsProps {
  dataset: CompanyDataset | null
  onDatasetDeleted: () => void
}

export function DatasetCards({ dataset, onDatasetDeleted }: DatasetCardsProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCompanyDataset()
      onDatasetDeleted()
      setDeleteConfirm(false)
    } catch (err) {
      console.error('Failed to delete dataset:', err)
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!dataset) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No dataset uploaded yet. Upload CSV files to get started.
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base mb-1">Mexi-Can Limited</h4>

              <div className="space-y-2">
                {/* Last Updated */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Updated {formatDistanceToNow(new Date(dataset.uploadedAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-medium">{formatCurrency(dataset.stats.totalRevenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Files:</span>
                    <span className="font-medium">{dataset.files.length}</span>
                  </div>
                </div>

                {/* Data Range */}
                <div className="text-xs text-muted-foreground">
                  {dataset.data.dateRange.start && dataset.data.dateRange.end ? (
                    <span>{dataset.data.dateRange.start} - {dataset.data.dateRange.end}</span>
                  ) : (
                    <span>Date range not available</span>
                  )}
                </div>

                {/* File List */}
                <div className="text-xs text-muted-foreground pt-1">
                  <div className="font-medium mb-1">Uploaded files:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {dataset.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
                className="h-8 w-8 p-0"
                title="Delete dataset"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the company dataset? This action cannot be undone.
              All uploaded financial data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
