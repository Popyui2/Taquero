import { useEffect } from 'react'
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
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { format } from 'date-fns'

interface StaffTrainingViewProps {
  staffId: string | null
  onBack: () => void
  onSelectStaff: (staffId: string | null) => void
}

export function StaffTrainingView({ staffId, onBack: _onBack, onSelectStaff }: StaffTrainingViewProps) {
  const { staffMembers, fetchFromGoogleSheets } = useStaffTrainingStore()

  // Fetch data from Google Sheets on mount
  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const currentStaff = staffId ? staffMembers.find((s) => s.id === staffId) : null

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Training Records</h2>
        <p className="text-muted-foreground text-lg">View training documentation</p>
      </div>

      {/* Staff Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          {staffMembers.length > 0 ? (
            <Select value={staffId || ''} onValueChange={(value) => onSelectStaff(value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a staff member to view" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} - {staff.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No staff members found. Please add staff members first.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Information & Training Records */}
      {currentStaff && (
        <>
          {/* Staff Information Card */}
          <Card>
            <CardHeader className="bg-white">
              <CardTitle className="text-black text-2xl">Staff Training Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Staff Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Staff Name</div>
                  <div className="font-semibold">{currentStaff.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Position</div>
                  <div className="font-semibold">{currentStaff.position}</div>
                </div>
              </div>

              {/* Training Records Table */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Training History</h3>
                {currentStaff.trainingRecords.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white hover:bg-white">
                          <TableHead className="font-semibold text-black">
                            Topic (Part of the plan that has been covered)
                          </TableHead>
                          <TableHead className="font-semibold text-black">Trainer Initials</TableHead>
                          <TableHead className="font-semibold text-black">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentStaff.trainingRecords.map((record) => (
                          <TableRow key={record.id} className="h-16">
                            <TableCell className="font-medium max-w-md">
                              <div className="space-y-1">
                                <div>{record.topic.split('(')[0].trim()}</div>
                                {record.topic.includes('(') && (
                                  <div className="text-xs text-muted-foreground">
                                    ({record.topic.split('(')[1]}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{record.trainerInitials}</TableCell>
                            <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border rounded-md">
                    No training records found for this staff member.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
