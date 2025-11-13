import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  if (!open) return null

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <Card className={cn(
        'relative z-50 max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95'
      )}>
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-yellow-500/10 p-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
          >
            Continue Anyway
          </Button>
        </div>
      </Card>
    </div>
  )
}
