import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  useTraceabilityStore,
  deleteTraceabilityRecordFromGoogleSheets,
} from '@/store/traceabilityStore'
import { AddTraceabilityRecordWizard } from '@/components/traceability/AddTraceabilityRecordWizard'
import { Plus, Trash2, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { TraceabilityRecord } from '@/types'

export default function TraceYourFood() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const records = useTraceabilityStore((state) => state.getRecords())
  const deleteRecord = useTraceabilityStore((state) => state.deleteRecord)
  const fetchFromGoogleSheets = useTraceabilityStore((state) => state.fetchFromGoogleSheets)
  const isLoading = useTraceabilityStore((state) => state.isLoading)

  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const handleDelete = async (record: TraceabilityRecord) => {
    if (window.confirm('Are you sure you want to delete this traceability record?')) {
      deleteRecord(record.id)
      await deleteTraceabilityRecordFromGoogleSheets(record)
    }
  }

  const toggleRow = (recordId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trace Your Food</h1>
          <p className="text-muted-foreground mt-2">
            Document traceability exercises from supplier to customer
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Trace Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traceability Exercise Log</CardTitle>
          <CardDescription>
            MPI requires proof of "one step back, one step forward" traceability for recalls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No traceability records yet</p>
              <p className="text-sm">Start by adding your first trace exercise</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Batch/Lot</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const isExpanded = expandedRows.has(record.id)
                  return (
                    <>
                      <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell onClick={() => toggleRow(record.id)}>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>
                          {new Date(record.traceDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>{record.productType}</TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>{record.brand}</TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>
                          <Badge variant="outline">{record.batchLotInfo}</Badge>
                        </TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>{record.supplierName}</TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>{record.performedBy}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(record)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <TableRow key={`${record.id}-details`}>
                          <TableCell colSpan={8} className="bg-muted/30">
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Supplier Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="text-muted-foreground">Name:</span>{' '}
                                      {record.supplierName}
                                    </p>
                                    <p className="whitespace-pre-wrap">
                                      <span className="text-muted-foreground">Contact:</span>
                                      <br />
                                      {record.supplierContact}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Manufacturer Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="text-muted-foreground">Name:</span>{' '}
                                      {record.manufacturerName}
                                    </p>
                                    <p className="whitespace-pre-wrap">
                                      <span className="text-muted-foreground">Contact:</span>
                                      <br />
                                      {record.manufacturerContact}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {record.dateReceived && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Date Received</h4>
                                  <p className="text-sm">
                                    {new Date(record.dateReceived).toLocaleDateString()}
                                  </p>
                                </div>
                              )}

                              {record.otherInfo && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Other Information</h4>
                                  <p className="text-sm whitespace-pre-wrap">{record.otherInfo}</p>
                                </div>
                              )}

                              <div className="pt-2 border-t text-xs text-muted-foreground">
                                <p>
                                  Record created: {new Date(record.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Traceability Record</DialogTitle>
            <DialogDescription>
              Document a product trace from supplier to customer for MPI compliance
            </DialogDescription>
          </DialogHeader>
          <AddTraceabilityRecordWizard
            onComplete={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
