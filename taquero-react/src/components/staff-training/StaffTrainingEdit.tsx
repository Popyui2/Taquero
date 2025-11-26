import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'

const formatDateToDDMMYYYY = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const formatDateToISO = (ddmmyyyy: string) => {
  const [day, month, year] = ddmmyyyy.split('/')
  return `${year}-${month}-${day}`
}

interface StaffTrainingEditProps {
  staffId: string | null
  onBack: () => void
  onSelectStaff: (staffId: string | null) => void
}

const TRAINING_TOPICS = [
  'Wash hands (with soap, 20 sec, dry thoroughly, know when to wash them)',
  'Protecting food from contamination by staff (managing sickness, clean clothing)',
  'Separating Food (raw vs cooked, allergy awareness, managing chemicals)',
  'Cleaning up (what to clean, when and how)',
]

export function StaffTrainingEdit({ staffId, onBack: _onBack, onSelectStaff }: StaffTrainingEditProps) {
  const { staffMembers, addStaffMember, updateStaffMember, addTrainingRecord, deleteTrainingRecord, fetchFromGoogleSheets } =
    useStaffTrainingStore()

  // Fetch data from Google Sheets on mount
  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const currentStaff = staffId ? staffMembers.find((s) => s.id === staffId) : null

  // Staff info form
  const [name, setName] = useState(currentStaff?.name || '')
  const [initials, setInitials] = useState(currentStaff?.initials || '')
  const [position, setPosition] = useState(currentStaff?.position || '')

  // Training record form
  const [topic, setTopic] = useState('')
  const [trainerInitials, setTrainerInitials] = useState('')
  const [trainingDate, setTrainingDate] = useState(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))

  // Delete confirmation
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null)

  useEffect(() => {
    if (currentStaff) {
      setName(currentStaff.name)
      setInitials(currentStaff.initials)
      setPosition(currentStaff.position)
    }
  }, [currentStaff])

  const handleSaveStaffInfo = () => {
    if (!name || !initials || !position) {
      return
    }

    try {
      if (staffId) {
        updateStaffMember(staffId, {
          name,
          initials,
          position,
        })
      } else {
        addStaffMember({
          name,
          initials,
          position,
        })
        // Get the newly added staff member and select it
        setTimeout(() => {
          const newStaff = staffMembers.find((s) => s.name === name)
          if (newStaff) {
            onSelectStaff(newStaff.id)
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error saving staff:', error)
    }
  }

  const handleAddTrainingRecord = () => {
    if (!staffId || !topic || !trainerInitials || !trainingDate) {
      return
    }

    // Validate trainer initials (2 uppercase letters)
    const initialsUpper = trainerInitials.toUpperCase()
    if (initialsUpper.length !== 2 || !/^[A-Z]{2}$/.test(initialsUpper)) {
      return
    }

    addTrainingRecord(staffId, {
      topic,
      trainerInitials: initialsUpper,
      date: new Date(formatDateToISO(trainingDate)).toISOString(),
    })

    // Clear form
    setTopic('')
    setTrainerInitials('')
    setTrainingDate(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]))
  }

  const handleDeleteRecord = () => {
    if (deleteRecordId && staffId) {
      deleteTrainingRecord(staffId, deleteRecordId)
      setDeleteRecordId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Staff Information</h2>
        <p className="text-muted-foreground text-lg">Add or update staff details and training records</p>
      </div>

      {/* Staff Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={staffId || 'new'}
            onValueChange={(value) => onSelectStaff(value === 'new' ? null : value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select a staff member or create new" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">+ Create New Staff Member</SelectItem>
              {staffMembers.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name} - {staff.position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Staff Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Staff Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Staff member name"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Initials *</label>
              <Input
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="e.g., JD"
                maxLength={2}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Position *</label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Kitchen Hand"
                className="h-12"
              />
            </div>
          </div>
          <div className="pt-4">
            <button
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveStaffInfo()
              }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-14 px-8 w-full"
              type="button"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                pointerEvents: 'auto',
                cursor: 'pointer',
                minHeight: '56px'
              }}
            >
              {staffId ? 'Update' : 'Save'} Staff Information
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Training Records Section */}
      {staffId && (
        <>
          {/* Add Training Record Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Training Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Training Topic *</label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select training topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAINING_TOPICS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trainer Initials *</label>
                  <Input
                    value={trainerInitials}
                    onChange={(e) => setTrainerInitials(e.target.value.toUpperCase())}
                    placeholder="GW"
                    maxLength={2}
                    className="h-12 uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date *</label>
                  <DatePicker
                    value={trainingDate}
                    onChange={setTrainingDate}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddTrainingRecord}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  handleAddTrainingRecord()
                }}
                className="w-full md:w-auto touch-manipulation"
                size="lg"
                type="button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Training
              </Button>
            </CardContent>
          </Card>

          {/* Training Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Training Records</CardTitle>
            </CardHeader>
            <CardContent>
              {currentStaff && currentStaff.trainingRecords.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white hover:bg-white">
                        <TableHead className="font-semibold text-black">Topic</TableHead>
                        <TableHead className="font-semibold text-black">Trainer Initials</TableHead>
                        <TableHead className="font-semibold text-black">Date</TableHead>
                        <TableHead className="font-semibold text-black w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStaff.trainingRecords.map((record) => (
                        <TableRow key={record.id} className="h-16">
                          <TableCell className="font-medium">{record.topic}</TableCell>
                          <TableCell>{record.trainerInitials}</TableCell>
                          <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteRecordId(record.id)}
                              className="h-10 w-10"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No training records yet. Add a training record above to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRecordId} onOpenChange={(open) => !open && setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this training record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteRecordId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRecord}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
