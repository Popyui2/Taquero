import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText } from 'lucide-react'
import { formatDateNZ, getCurrentDateTimeNZ } from '@/lib/dateUtils'

export function AllStaffMPIRecord() {
  const { staffMembers } = useStaffTrainingStore()

  if (staffMembers.length === 0) {
    return null
  }

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Training Records - All Staff</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Official records for health inspector review
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="space-y-4 pb-8 border-b last:border-0 last:pb-0">
                {/* Staff Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{staff.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {staff.trainingRecords.length} training record
                      {staff.trainingRecords.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Staff Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Position:</span>{' '}
                      <span className="font-medium">{staff.position}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>{' '}
                      <span className="font-medium">
                        {staff.createdAt ? formatDateNZ(staff.createdAt) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      <span className="font-medium">{staff.email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{' '}
                      <span className="font-medium">{staff.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Training Records Table */}
                {staff.trainingRecords.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50%]">
                            Topic (Part of plan covered)
                          </TableHead>
                          <TableHead className="text-center w-[20%]">Staff's name</TableHead>
                          <TableHead className="text-center w-[15%]">Trainer initials</TableHead>
                          <TableHead className="text-center w-[15%]">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.trainingRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{record.topic.split('(')[0].trim()}</div>
                                {record.topic.includes('(') && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    ({record.topic.split('(')[1]}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-mono font-bold text-lg">
                                {staff.initials}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-mono font-bold text-base">
                                {record.trainerInitials}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {formatDateNZ(record.date)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    No training records yet
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t text-xs text-muted-foreground">
            <p>Generated: {getCurrentDateTimeNZ()}</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
