import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react'
import { TrainingHistoryTable } from './TrainingHistoryTable'
import { LogTrainingModal } from './LogTrainingModal'
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
import { useToast } from '@/components/ui/use-toast'

export function StaffDetail() {
  const navigate = useNavigate()
  const { staffId } = useParams<{ staffId: string }>()
  const { getStaffMember, updateStaffMember, deleteStaffMember } = useStaffTrainingStore()
  const { toast } = useToast()

  const staff = staffId ? getStaffMember(staffId) : null

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(staff?.name || '')
  const [initials, setInitials] = useState(staff?.initials || '')
  const [position, setPosition] = useState(staff?.position || '')
  const [email, setEmail] = useState(staff?.email || '')
  const [phone, setPhone] = useState(staff?.phone || '')

  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!staff || !staffId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Staff Member Not Found</h2>
        <Button onClick={() => navigate('/module/staff-training')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff List
        </Button>
      </div>
    )
  }

  const handleSave = async () => {
    if (!name.trim() || !position.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Name and position are required',
        variant: 'destructive',
      })
      return
    }

    if (!initials.trim() || initials.trim().length !== 2) {
      toast({
        title: 'Invalid Initials',
        description: 'Staff initials must be exactly 2 letters',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateStaffMember(staffId, {
        name: name.trim(),
        initials: initials.trim().toUpperCase(),
        position: position.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      toast({
        title: 'Saved',
        description: 'Staff information updated successfully',
      })

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to update staff information',
        variant: 'destructive',
      })
    }
  }

  const handleCancelEdit = () => {
    setName(staff.name)
    setInitials(staff.initials)
    setPosition(staff.position)
    setEmail(staff.email || '')
    setPhone(staff.phone || '')
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteStaffMember(staffId)

      toast({
        title: 'Deleted',
        description: `${staff.name} has been removed`,
      })

      navigate('/module/staff-training')
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete staff member',
        variant: 'destructive',
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/module/staff-training')}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{staff.name}</h1>
          <p className="text-sm text-muted-foreground">{staff.position}</p>
        </div>
      </div>

      {/* Staff Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Staff Information</CardTitle>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-10 px-4"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              {isEditing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Staff member name"
                  className="h-11"
                />
              ) : (
                <div className="h-11 px-3 py-2 border rounded-md bg-muted/30">
                  {staff.name}
                </div>
              )}
            </div>

            {/* Staff Initials */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Staff Initials <span className="text-destructive">*</span>
              </label>
              {isEditing ? (
                <Input
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  placeholder="e.g., HV"
                  maxLength={2}
                  className="h-11 font-mono uppercase"
                />
              ) : (
                <div className="h-11 px-3 py-2 border rounded-md bg-muted/30 font-mono font-bold text-lg">
                  {staff.initials}
                </div>
              )}
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Position <span className="text-destructive">*</span>
              </label>
              {isEditing ? (
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Kitchen Hand"
                  className="h-11"
                />
              ) : (
                <div className="h-11 px-3 py-2 border rounded-md bg-muted/30">
                  {staff.position}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (optional)</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-11"
                />
              ) : (
                <div className="h-11 px-3 py-2 border rounded-md bg-muted/30">
                  {staff.email || <span className="text-muted-foreground">Not set</span>}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone (optional)</label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+64 21 XXX XXXX"
                  className="h-11"
                />
              ) : (
                <div className="h-11 px-3 py-2 border rounded-md bg-muted/30">
                  {staff.phone || <span className="text-muted-foreground">Not set</span>}
                </div>
              )}
            </div>
          </div>

          {/* Edit mode buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                className="h-12 px-6 min-h-[48px] flex-1"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="h-12 px-6 min-h-[48px]"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Delete button (always visible at bottom) */}
          {!isEditing && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="h-11 px-6"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Staff Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Records Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Training History</CardTitle>
            <Button
              onClick={() => setShowTrainingModal(true)}
              className="h-11 px-5 min-h-[44px]"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Training
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TrainingHistoryTable
            staffId={staffId}
            staffName={staff.name}
            records={staff.trainingRecords}
          />
        </CardContent>
      </Card>

      {/* Log Training Modal */}
      <LogTrainingModal
        staffId={staffId}
        staffName={staff.name}
        open={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{staff.name}</strong> and all their training
              records ({staff.trainingRecords.length} record
              {staff.trainingRecords.length !== 1 ? 's' : ''}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
