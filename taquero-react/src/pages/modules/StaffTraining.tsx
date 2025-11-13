import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { Eye, Edit } from 'lucide-react'

export function StaffTraining() {
  const navigate = useNavigate()
  const { staffMembers } = useStaffTrainingStore()

  const handleViewStaff = () => {
    navigate('/module/staff-training/view')
  }

  const handleEditStaff = () => {
    navigate('/module/staff-training/edit')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Staff Training Records</h2>
        <p className="text-muted-foreground text-lg">
          MPI Food Safety Compliance - Training Documentation
        </p>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Select Action</h3>
            <p className="text-muted-foreground">
              Choose to view existing training records or edit staff information
            </p>
          </div>

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
        </div>
      </Card>
    </div>
  )
}
