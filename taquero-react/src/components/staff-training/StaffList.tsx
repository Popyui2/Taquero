import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { User, Plus } from 'lucide-react'
import { AllStaffMPIRecord } from './AllStaffMPIRecord'

export function StaffList() {
  const navigate = useNavigate()
  const { staffMembers } = useStaffTrainingStore()

  const handleStaffClick = (staffId: string) => {
    navigate(`/module/staff-training/${staffId}`)
  }

  const handleAddStaff = () => {
    navigate('/module/staff-training/add')
  }

  // Empty state
  if (staffMembers.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="text-center space-y-6 py-12">
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">No Staff Members Yet</h3>
            <p className="text-muted-foreground text-base">
              Get started by adding your first team member
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleAddStaff}
            className="h-14 px-8 text-base font-medium min-h-[56px] w-full sm:w-auto"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>
    )
  }

  // Staff grid
  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 print:max-w-full">
      {/* Header with Add button */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-semibold">Staff Members</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {staffMembers.length} team member{staffMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleAddStaff}
          className="h-12 px-6 min-h-[48px]"
          style={{
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {staffMembers.map((staff) => (
          <Card
            key={staff.id}
            onClick={() => handleStaffClick(staff.id)}
            className="p-6 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-h-[80px]"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{staff.name}</h3>
                <p className="text-muted-foreground text-sm truncate">{staff.position}</p>
                {staff.trainingRecords.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {staff.trainingRecords.length} training record
                    {staff.trainingRecords.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* MPI Training Records - All Staff */}
      <AllStaffMPIRecord />
    </div>
  )
}
