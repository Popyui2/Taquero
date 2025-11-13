import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TemperatureWizard } from '@/components/temperature/TemperatureWizard'
import { Toast, ToastContainer } from '@/components/ui/toast'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function FridgeTemps() {
  const navigate = useNavigate()
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleComplete = () => {
    navigate(-1)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Fridge/Chiller Temperature Checks
        </h2>
        <p className="text-muted-foreground text-lg">
          Daily temperature monitoring for all chillers and freezer
        </p>
      </div>

      <TemperatureWizard onComplete={handleComplete} onShowToast={showToast} />

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
