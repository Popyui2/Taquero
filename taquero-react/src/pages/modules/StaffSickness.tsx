import { useState, useEffect } from 'react'
import { Plus, AlertCircle, CheckCircle2, Loader2, HeartPulse, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStaffSicknessStore } from '@/store/staffSicknessStore'
import { Toast, ToastContainer } from '@/components/ui/toast'
import { AddSicknessRecordWizard } from '@/components/staff-sickness/AddSicknessRecordWizard'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function StaffSickness() {
  const { records, isLoading, fetchFromGoogleSheets } = useStaffSicknessStore()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showAddWizard, setShowAddWizard] = useState(false)

  // Fetch data from Google Sheets on mount
  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleRecordAdded = () => {
    showToast('Sickness record added successfully', 'success')
  }

  // Calculate stats
  const sickRecords = records.filter(r => r.status === 'sick')
  const returnedRecords = records.filter(r => r.status === 'returned')
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthRecords = records.filter(r => {
    const date = new Date(r.dateSick)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })

  // Recent records (last 20)
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Staff Sickness
        </h2>
        <p className="text-muted-foreground text-lg">
          Track staff health, sickness, and return to work records
        </p>
      </div>

      {/* Add Record Button */}
      <Button
        size="lg"
        onClick={() => setShowAddWizard(true)}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Record Staff Sickness
      </Button>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Sick</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sickRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              Staff members off work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              Total sickness records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned to Work</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnedRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              All-time recovered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currently Sick Staff */}
      {sickRecords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Currently Off Work</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Staff members currently sick
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sickRecords.map((record) => (
                <div
                  key={record.id}
                  className="border rounded-lg p-4 space-y-2 bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{record.staffName}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Off since {new Date(record.dateSick).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {record.symptoms && (
                    <div className="text-sm">
                      <span className="font-medium">Symptoms:</span> {record.symptoms}
                    </div>
                  )}

                  {record.actionTaken && (
                    <div className="text-sm">
                      <span className="font-medium">Action:</span> {record.actionTaken}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Checked by {record.checkedBy}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Sickness Records</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last 20 records
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No records yet</p>
              <p className="text-sm mt-2">
                Click "Record Staff Sickness" to add your first entry
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Symptoms</th>
                    <th className="pb-3 font-medium">Date Sick</th>
                    <th className="pb-3 font-medium">Date Returned</th>
                    <th className="pb-3 font-medium">Action Taken</th>
                    <th className="pb-3 font-medium">Checked By</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentRecords.map((record) => (
                    <tr key={record.id} className="text-sm">
                      <td className="py-3 font-medium">{record.staffName}</td>
                      <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                        {record.symptoms || '-'}
                      </td>
                      <td className="py-3">
                        {new Date(record.dateSick).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3">
                        {record.dateReturned
                          ? new Date(record.dateReturned).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                        {record.actionTaken || '-'}
                      </td>
                      <td className="py-3">{record.checkedBy}</td>
                      <td className="py-3">
                        {record.status === 'sick' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Sick
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Returned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Sickness Record Wizard */}
      <AddSicknessRecordWizard
        open={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={handleRecordAdded}
      />

      {/* Toast Notifications */}
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
