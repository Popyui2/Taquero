import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TemperatureWizard } from '@/components/temperature/TemperatureWizard'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTemperatureStore } from '@/store/temperatureStore'
import { useAppStore } from '@/store/appStore'
import { Loader2, Thermometer } from 'lucide-react'
import { format } from 'date-fns'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function FridgeTemps() {
  const navigate = useNavigate()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [wizardActive, setWizardActive] = useState(false)

  const { temperatureRecords, isLoading, fetchFromGoogleSheets, getTodayRecord } = useTemperatureStore()
  const { markTaskCompleted, recordUserSubmission } = useAppStore()

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      await fetchFromGoogleSheets()

      // Check if today's record exists and mark as completed
      const todayRecord = getTodayRecord()
      if (todayRecord) {
        markTaskCompleted('fridge-temps')
        recordUserSubmission('fridge-temps', todayRecord.user)
      }
    }
    loadData()
  }, [fetchFromGoogleSheets, getTodayRecord, markTaskCompleted, recordUserSubmission])

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleComplete = () => {
    // Refresh data after submission
    fetchFromGoogleSheets()
    setWizardActive(false)
    navigate(-1)
  }

  const handleWizardStart = () => {
    setWizardActive(true)
  }

  // Get the last 5 records for display
  const recentRecords = temperatureRecords.slice(0, 5)

  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Thermometer className="h-8 w-8" />
            Fridge/Chiller Temperature Checks
          </h2>
          <p className="text-muted-foreground text-lg">
            Daily temperature monitoring for all chillers and freezer
          </p>
        </div>

        <TemperatureWizard
          onComplete={handleComplete}
          onShowToast={showToast}
          onWizardStart={handleWizardStart}
        />

        {/* Recent Temperature Records - Hidden when wizard is active */}
        {!wizardActive && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Thermometer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Recent Temperature Checks</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last 5 temperature records
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No temperature records found
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRecords.map((record, idx) => {
                    // Helper to safely parse dates
                    const safeParseDate = (dateStr: string) => {
                      if (!dateStr) return new Date()
                      // Handle DD/MM/YYYY format
                      if (dateStr.includes('/')) {
                        const [day, month, year] = dateStr.split('/')
                        return new Date(`${year}-${month}-${day}`)
                      }
                      // Handle ISO format
                      return new Date(dateStr)
                    }

                    const recordDate = safeParseDate(record.date)
                    const recordTimestamp = safeParseDate(record.timestamp || record.date)

                    return (
                      <div
                        key={record.id || idx}
                        className="border rounded-lg p-4 space-y-3 transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:scale-[1.01] animate-in fade-in slide-in-from-left-4"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {isNaN(recordDate.getTime()) ? record.date : format(recordDate, 'EEEE, MMMM d, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Recorded by {record.user}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isNaN(recordTimestamp.getTime()) ? '' : format(recordTimestamp, 'h:mm a')}
                          </div>
                        </div>

                      {/* Temperature Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {record.chillers.map((chiller, chillerIdx) => (
                          <div key={chillerIdx} className="text-center p-2 bg-muted/50 rounded">
                            <div className="text-xs text-muted-foreground">{chiller.unit}</div>
                            <div className="font-mono font-semibold">
                              {chiller.temperature}°C
                            </div>
                          </div>
                        ))}
                        {record.freezer && (
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="text-xs text-muted-foreground">{record.freezer.unit}</div>
                            <div className="font-mono font-semibold">
                              {record.freezer.temperature}°C
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

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
    </>
  )
}
