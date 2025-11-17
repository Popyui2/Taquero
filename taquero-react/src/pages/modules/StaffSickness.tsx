import { useState, useEffect } from 'react'
import { Plus, Loader2, HeartPulse } from 'lucide-react'
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

  // Recent records (last 50)
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Staff Sickness
        </h2>
        <p className="text-muted-foreground text-lg">
          Track staff health and sickness records
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
                All staff sickness records
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
