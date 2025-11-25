import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { User, Users, Plus, Loader2, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { AllStaffMPIRecord } from './AllStaffMPIRecord'
import { formatDateNZ } from '@/lib/dateUtils'
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

export function StaffList() {
  const navigate = useNavigate()
  const { staffMembers, isLoading, fetchFromGoogleSheets, deleteStaffMember } = useStaffTrainingStore()
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<{ id: string; name: string } | null>(null)

  // Fetch data from Google Sheets on mount
  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const handleStaffClick = (staffId: string) => {
    navigate(`/module/staff-training/${staffId}`)
  }

  const handleAddStaff = () => {
    navigate('/module/staff-training/add')
  }

  const toggleStaffExpanded = (staffId: string) => {
    setExpandedStaff((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(staffId)) {
        newSet.delete(staffId)
      } else {
        newSet.add(staffId)
      }
      return newSet
    })
  }

  const handleAddTraining = (staffId: string) => {
    navigate(`/module/staff-training/${staffId}`)
  }

  const handleEditStaff = (staffId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/module/staff-training/${staffId}`)
  }

  const handleDeleteStaff = (staffId: string, staffName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStaffToDelete({ id: staffId, name: staffName })
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return

    try {
      await deleteStaffMember(staffToDelete.id)
      setDeleteConfirmOpen(false)
      setStaffToDelete(null)
      // Refresh data to show the change
      await fetchFromGoogleSheets()
    } catch (error) {
      console.error('Error deleting staff member:', error)
      alert('Error deleting staff member. Please try again.')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Fetching Data</p>
      </div>
    )
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

  // Staff accordion list
  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
      {/* Header with Add button */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8" />
          Staff Training Records
        </h2>
        <p className="text-muted-foreground text-lg">
          {staffMembers.length} team member{staffMembers.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Button
        size="lg"
        onClick={handleAddStaff}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Staff Member
      </Button>

      {/* Staff Accordion List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staffMembers.map((staff, index) => {
              const isExpanded = expandedStaff.has(staff.id)
              return (
                <div
                  key={staff.id}
                  className="border rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/50"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Collapsed Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer bg-card hover:bg-muted/50 transition-colors"
                    onClick={() => toggleStaffExpanded(staff.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                        }`}
                      >
                        <User className={`h-5 w-5 ${isExpanded ? '' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {staff.position} • {staff.trainingRecords.length} training record{staff.trainingRecords.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEditStaff(staff.id, e)}
                        className="h-9 w-9 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteStaff(staff.id, staff.name, e)}
                        className="h-9 w-9 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Staff Details */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                          <p className="text-sm font-medium">{staff.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                          <p className="text-sm font-medium">{staff.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      {/* Training Records */}
                      <div>
                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                          Training Records
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddTraining(staff.id)}
                            className="h-8 px-3"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Record
                          </Button>
                        </h4>

                        {staff.trainingRecords.length > 0 ? (
                          <div className="space-y-2">
                            {staff.trainingRecords.map((record) => (
                              <div
                                key={record.id}
                                className="bg-background rounded-md p-3 border"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">
                                      {record.topic.split('(')[0].trim()}
                                    </p>
                                    {record.topic.includes('(') && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        ({record.topic.split('(')[1]}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      <span>Trainer: {record.trainerInitials}</span>
                                      <span>•</span>
                                      <span>{formatDateNZ(record.date)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4 bg-background rounded-md border">
                            No training records yet
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* MPI Training Records - All Staff */}
      <AllStaffMPIRecord />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{staffToDelete?.name}" and all their training records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
