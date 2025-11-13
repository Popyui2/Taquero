import { TrainingRecord } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateNZ } from '@/lib/dateUtils'

interface TrainingHistoryTableProps {
  records: TrainingRecord[]
}

export function TrainingHistoryTable({ records }: TrainingHistoryTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-md bg-card">
        <p className="text-base">No training records yet</p>
        <p className="text-sm mt-2">Click "Log Training Record" to add a new entry</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">
              Topic <span className="text-xs text-muted-foreground">(Part of plan covered)</span>
            </TableHead>
            <TableHead className="font-semibold text-center w-32">Trainer Initials</TableHead>
            <TableHead className="font-semibold w-32">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className="min-h-[60px]">
              <TableCell className="font-medium">
                <div className="py-2">
                  {record.topic.split('(')[0].trim()}
                  {record.topic.includes('(') && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ({record.topic.split('(')[1]}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center font-mono font-semibold">
                {record.trainerInitials}
              </TableCell>
              <TableCell>{formatDateNZ(record.date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
