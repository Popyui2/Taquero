import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const bgColor = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-600/20 border-red-500/40 text-red-400',
    info: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
    warning: 'bg-red-600/20 border-red-500/40 text-red-400',
  }

  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border p-4 shadow-lg animate-in slide-in-from-bottom-2',
        bgColor[type]
      )}
    >
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {children}
    </div>
  )
}
