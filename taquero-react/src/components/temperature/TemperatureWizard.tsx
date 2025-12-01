import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useTemperatureStore } from '@/store/temperatureStore'
import { Minus, Plus } from 'lucide-react'
import { TemperatureData } from '@/types'

interface TemperatureWizardProps {
  onComplete: () => void
  onShowToast: (message: string, type: 'success' | 'error' | 'warning') => void
  onWizardStart?: () => void
}

const GOOGLE_SHEETS_URL =
  import.meta.env.VITE_TEMPERATURE_SHEET_URL || 'https://script.google.com/macros/s/AKfycbz27gmlc2swJgIXdayBHnP-b3KMIR-TiuY6Ib35piYo8m0TYDD1SzFbEDp2Q1EeywQg/exec'

export function TemperatureWizard({ onComplete, onShowToast, onWizardStart }: TemperatureWizardProps) {
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
  const [showExistingRecordWarning, setShowExistingRecordWarning] = useState(false)

  const currentUser = useAuthStore((state) => state.currentUser)
  const getWhoSubmittedToday = useAppStore((state) => state.getWhoSubmittedToday)
  const recordUserSubmission = useAppStore((state) => state.recordUserSubmission)
  const markTaskCompleted = useAppStore((state) => state.markTaskCompleted)
  const addLocalRecord = useTemperatureStore((state) => state.addLocalRecord)
  const getTodayRecord = useTemperatureStore((state) => state.getTodayRecord)

  const today = new Date()
  const dateString = formatDate(today)

  const adjustTemp = (unit: keyof typeof temps, delta: number) => {
    setTemps((prev) => ({
      ...prev,
      [unit]: Number((prev[unit] + delta).toFixed(1)),
    }))
  }

  const handleStartWizard = () => {
    // Just proceed to wizard
    setCurrentStep(1)
    onWizardStart?.()
  }

  const handleFinish = async () => {
    console.log('🔵 handleFinish called')

    // Check if record already exists for today (from Google Sheets)
    const todayRecord = getTodayRecord()
    console.log('📊 Today record from Google Sheets:', todayRecord)

    if (todayRecord) {
      // Show warning that a record already exists
      console.log('⚠️ Showing existing record warning')
      setShowExistingRecordWarning(true)
      return
    }

    // Also check localStorage for existing submission
    const previousSubmitter = getWhoSubmittedToday('fridge-temps')
    console.log('💾 Previous submitter from localStorage:', previousSubmitter)

    if (previousSubmitter) {
      // Show old duplicate alert
      console.log('⚠️ Showing duplicate alert')
      setDuplicateUser(previousSubmitter)
      setShowDuplicateAlert(true)
      return
    }

    // No duplicate, proceed with submission
    console.log('✅ No duplicates found, proceeding with submission')
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const userName = currentUser?.name || 'Unknown'

    await submitTemperatures(dateString, userName)
  }

  const proceedWithSubmission = async () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const userName = currentUser?.name || 'Unknown'

    await submitTemperatures(dateString, userName)
  }

  const submitTemperatures = async (dateString: string, userName: string) => {
    console.log('🚀 submitTemperatures called with:', { dateString, userName })

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

      // Add to temperature store for immediate display
      addLocalRecord(tempData)

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
          <h3 className="text-2xl font-semibold">Writing Records for:</h3>
          <div className="text-xl text-muted-foreground">{dateString}</div>
          <Button onClick={handleStartWizard} size="lg" className="w-full">
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
      {/* Warning for existing record from Google Sheets */}
      <AlertDialog open={showExistingRecordWarning} onOpenChange={setShowExistingRecordWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              A temperature check has already been completed for today. Creating another record will result in duplicate entries. Do you want to continue anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowExistingRecordWarning(false)
                onShowToast('Temperature check cancelled', 'warning')
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowExistingRecordWarning(false)
                await proceedWithSubmission()
              }}
            >
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Legacy duplicate warning from localStorage */}
      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Entry Warning</AlertDialogTitle>
            <AlertDialogDescription>
              Temperature check already completed for this date by {duplicateUser}. Submitting again will create a duplicate entry in Google Sheets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDuplicateAlert(false)
                onShowToast('Temperature check cancelled', 'warning')
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowDuplicateAlert(false)
                await proceedWithSubmission()
              }}
            >
              Continue Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
