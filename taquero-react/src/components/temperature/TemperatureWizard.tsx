import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { formatDate, getTodayString } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Minus, Plus, CalendarIcon } from 'lucide-react'
import { TemperatureData } from '@/types'

interface TemperatureWizardProps {
  onComplete: () => void
  onShowToast: (message: string, type: 'success' | 'error' | 'warning') => void
}

const GOOGLE_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbx6oBuAoKUJNsF70DbNTmEg7LwLX_UobFWbc6HahUZwDdUYysuTD01SD0R7iD9KQWSR/exec'

export function TemperatureWizard({ onComplete, onShowToast }: TemperatureWizardProps) {
  const [currentStep, setCurrentStep] = useState<'date' | number>('date')
  const [temps, setTemps] = useState({
    chiller1: 3,
    chiller2: 3,
    chiller3: 3,
    chiller4: 3,
    chiller5: 3,
    chiller6: 3,
    freezer: -18,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false)
  const [duplicateUser, setDuplicateUser] = useState('')

  // Detect if device is touch-enabled (mobile/tablet)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  const currentUser = useAuthStore((state) => state.currentUser)
  const getWhoSubmittedToday = useAppStore((state) => state.getWhoSubmittedToday)
  const recordUserSubmission = useAppStore((state) => state.recordUserSubmission)
  const markTaskCompleted = useAppStore((state) => state.markTaskCompleted)

  const today = new Date()
  const dateString = formatDate(today)

  const adjustTemp = (unit: keyof typeof temps, delta: number) => {
    setTemps((prev) => ({
      ...prev,
      [unit]: Number((prev[unit] + delta).toFixed(1)),
    }))
  }

  const handleFinish = async () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const userName = currentUser?.name || 'Unknown'

    // Check localStorage for existing submission for this date
    const previousSubmitter = getWhoSubmittedToday('fridge-temps')

    if (previousSubmitter) {
      // Show alert asking if they want to continue
      setDuplicateUser(previousSubmitter)
      setShowDuplicateAlert(true)
      return
    }

    // No duplicate, proceed with submission
    await submitTemperatures(dateString, userName)
  }

  const submitTemperatures = async (dateString: string, userName: string) => {

    const tempData: TemperatureData = {
      date: dateString,
      timestamp: new Date().toISOString(),
      user: userName,
      chillers: [
        { unit: 'Chiller #1', temperature: temps.chiller1 },
        { unit: 'Chiller #2', temperature: temps.chiller2 },
        { unit: 'Chiller #3', temperature: temps.chiller3 },
        { unit: 'Chiller #4', temperature: temps.chiller4 },
        { unit: 'Chiller #5', temperature: temps.chiller5 },
        { unit: 'Chiller #6', temperature: temps.chiller6 },
      ],
      freezer: { unit: 'Freezer', temperature: temps.freezer },
    }

    setIsSubmitting(true)

    try {
      // Send to Google Sheets
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempData),
      })

      // Save locally as backup
      const records = JSON.parse(localStorage.getItem('fridge_temp_records') || '[]')
      records.push(tempData)
      localStorage.setItem('fridge_temp_records', JSON.stringify(records))

      // Record completion
      recordUserSubmission('fridge-temps', userName)
      markTaskCompleted('fridge-temps')

      onShowToast('Temperature check saved to Google Sheets!', 'success')
      onComplete()
    } catch (error) {
      console.error('Error saving temperature data:', error)
      onShowToast('Error saving temperature data', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (currentStep === 'date') {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6 text-center">
          <h3 className="text-2xl font-semibold">Today's date is:</h3>
          <div className="text-xl text-muted-foreground">{dateString}</div>
          <Button onClick={() => setCurrentStep(1)} size="lg" className="w-full">
            Continue
          </Button>
        </div>
      </Card>
    )
  }

  if (typeof currentStep === 'number' && currentStep <= 6) {
    const chillerNum = currentStep
    const tempKey = `chiller${chillerNum}` as keyof typeof temps
    const currentTemp = temps[tempKey]

    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="space-y-8">
          <h3 className="text-3xl font-bold text-center">Chiller #{chillerNum}</h3>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => adjustTemp(tempKey, -0.5)}
            >
              <Minus className="h-6 w-6" />
            </Button>

            <div className="text-center min-w-[180px]">
              <div className="text-5xl font-bold inline">
                {currentTemp}
                <span className="text-3xl text-muted-foreground ml-2">°C</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => adjustTemp(tempKey, 0.5)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(chillerNum === 1 ? 'date' : chillerNum - 1)}
              className="flex-1"
            >
              Previous
            </Button>
            <Button onClick={() => setCurrentStep(chillerNum + 1)} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Freezer step (step 7)
  return (
    <>
      <AlertDialog
        open={showDuplicateAlert}
        onOpenChange={setShowDuplicateAlert}
        title="Duplicate Entry Warning"
        description={`Temperature check already completed for this date by ${duplicateUser}. Submitting again will create a duplicate entry in Google Sheets.`}
        onConfirm={async () => {
          const today = new Date()
          const year = today.getFullYear()
          const month = String(today.getMonth() + 1).padStart(2, '0')
          const day = String(today.getDate()).padStart(2, '0')
          const dateString = `${year}-${month}-${day}`
          const userName = currentUser?.name || 'Unknown'
          await submitTemperatures(dateString, userName)
        }}
        onCancel={() => {
          onShowToast('Temperature check cancelled', 'info')
        }}
      />

      <Card className="p-8 max-w-2xl mx-auto">
        <div className="space-y-8">
          <h3 className="text-3xl font-bold text-center">Freezer</h3>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => adjustTemp('freezer', -0.5)}
            >
              <Minus className="h-6 w-6" />
            </Button>

            <div className="text-center min-w-[180px]">
              <div className="text-5xl font-bold inline">
                {temps.freezer}
                <span className="text-3xl text-muted-foreground ml-2">°C</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16"
              onClick={() => adjustTemp('freezer', 0.5)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="text-center text-sm text-muted-foreground">
              Saving temperature check for:
            </div>
            <div className="text-center text-lg font-medium">{dateString}</div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(6)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Previous
            </Button>
            <Button
              onClick={handleFinish}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Finish & Submit'}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}
