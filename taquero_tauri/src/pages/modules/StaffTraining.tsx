import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { Eye, Edit, RefreshCw, Loader2 } from 'lucide-react'

export function StaffTraining() {
  const navigate = useNavigate()
  const {
    staffMembers,
    isLoading,
    isSyncing,
    lastSyncTime,
    syncError,
    fetchFromGoogleSheets
  } = useStaffTrainingStore()

  // Fetch data from Google Sheets on mount
  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const handleViewStaff = () => {
    navigate('/module/staff-training/view')
  }

  const handleEditStaff = () => {
    navigate('/module/staff-training/edit')
  }

  const handleRefresh = () => {
    fetchFromGoogleSheets()
  }

  const formatLastSync = (time: string | null) => {
    if (!time) return 'Never'
    const date = new Date(time)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Staff Training Records</h2>
            <p className="text-muted-foreground text-lg">
              MPI Food Safety Compliance - Training Documentation
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isSyncing}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isLoading && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading from Google Sheets...</span>
            </>
          )}
          {isSyncing && !isLoading && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Syncing...</span>
            </>
          )}
          {!isLoading && !isSyncing && (
            <span>Last synced: {formatLastSync(lastSyncTime)}</span>
          )}
          {syncError && (
            <span className="text-destructive">• Sync error: {syncError}</span>
          )}
        </div>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Select Action</h3>
            <p className="text-muted-foreground">
              Choose to view existing training records or edit staff information
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">Loading training data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-32 flex flex-col gap-3"
                  onClick={handleViewStaff}
                >
                  <Eye className="h-8 w-8" />
                  <div className="space-y-1">
                    <div className="font-semibold">View Staff</div>
                    <div className="text-xs text-muted-foreground">
                      View training records
                    </div>
                  </div>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-32 flex flex-col gap-3"
                  onClick={handleEditStaff}
                >
                  <Edit className="h-8 w-8" />
                  <div className="space-y-1">
                    <div className="font-semibold">Edit Staff Info</div>
                    <div className="text-xs text-muted-foreground">
                      Add or edit staff & training
                    </div>
                  </div>
                </Button>
              </div>

              {staffMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No staff records yet. Click "Edit Staff Info" to get started.
                </div>
              )}

              {staffMembers.length > 0 && (
                <div className="pt-4">
                  <div className="text-sm text-muted-foreground text-center">
                    {staffMembers.length} staff member{staffMembers.length !== 1 ? 's' : ''} on record
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
