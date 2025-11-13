import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

const toastTimeouts = new Map<string, NodeJS.Timeout>()

let toastCount = 0
const listeners = new Set<(toasts: Toast[]) => void>()
let memoryToasts: Toast[] = []

function addToast(toast: Omit<Toast, 'id'>) {
  const id = `toast-${++toastCount}`
  const newToast: Toast = { ...toast, id }

  memoryToasts = [...memoryToasts, newToast]
  listeners.forEach((listener) => listener(memoryToasts))

  // Auto-dismiss after 4 seconds
  const timeout = setTimeout(() => {
    dismissToast(id)
  }, 4000)

  toastTimeouts.set(id, timeout)
}

function dismissToast(id: string) {
  const timeout = toastTimeouts.get(id)
  if (timeout) {
    clearTimeout(timeout)
    toastTimeouts.delete(id)
  }

  memoryToasts = memoryToasts.filter((t) => t.id !== id)
  listeners.forEach((listener) => listener(memoryToasts))
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryToasts)

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  // Subscribe to toast changes
  useState(() => {
    const unsubscribe = subscribe(setToasts)
    return unsubscribe
  })

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    addToast(props)
  }, [])

  const dismiss = useCallback((id: string) => {
    dismissToast(id)
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}
