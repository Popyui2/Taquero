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
  useComplaintsStore,
  deleteComplaintRecordFromGoogleSheets,
} from '@/store/complaintsStore'
import { AddComplaintWizard } from '@/components/complaints/AddComplaintWizard'
import { Plus, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { ComplaintRecord } from '@/types'

export default function CustomerComplaints() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const records = useComplaintsStore((state) => state.getRecords())
  const deleteRecord = useComplaintsStore((state) => state.deleteRecord)
  const fetchFromGoogleSheets = useComplaintsStore((state) => state.fetchFromGoogleSheets)
  const isLoading = useComplaintsStore((state) => state.isLoading)

  useEffect(() => {
    fetchFromGoogleSheets()
  }, [fetchFromGoogleSheets])

  const handleDelete = async (record: ComplaintRecord) => {
    if (window.confirm('Are you sure you want to delete this complaint record?')) {
      deleteRecord(record.id)
      await deleteComplaintRecordFromGoogleSheets(record)
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      'Under Investigation': 'default',
      'Resolved - Our Fault': 'destructive',
      'Resolved - Not Our Fault': 'secondary',
      'Resolved - Inconclusive': 'outline',
      'Ongoing': 'default',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Complaints Information</h1>
          <p className="text-muted-foreground mt-2">
            Track and investigate customer complaints for MPI compliance
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Complaint
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaint Log</CardTitle>
          <CardDescription>
            Document complaints, investigations, and resolutions to show MPI you take complaints seriously
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No complaint records yet</p>
              <p className="text-sm">Start by adding your first customer complaint</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Food Item</TableHead>
                  <TableHead>Complaint Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resolved By</TableHead>
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
                          {new Date(record.purchaseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>
                          {record.customerName}
                        </TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>{record.foodItem}</TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>
                          {record.complaintType ? (
                            <Badge variant="outline">{record.complaintType}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>
                          {getStatusBadge(record.complaintStatus)}
                        </TableCell>
                        <TableCell onClick={() => toggleRow(record.id)}>
                          {record.resolvedBy}
                        </TableCell>
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
                                  <h4 className="font-semibold text-sm mb-2">Customer Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="text-muted-foreground">Name:</span>{' '}
                                      {record.customerName}
                                    </p>
                                    <p>
                                      <span className="text-muted-foreground">Contact:</span>{' '}
                                      {record.customerContact}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Purchase Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="text-muted-foreground">Date:</span>{' '}
                                      {new Date(record.purchaseDate).toLocaleDateString()}
                                    </p>
                                    <p>
                                      <span className="text-muted-foreground">Time:</span>{' '}
                                      {record.purchaseTime}
                                    </p>
                                    <p>
                                      <span className="text-muted-foreground">Food:</span>{' '}
                                      {record.foodItem}
                                    </p>
                                    {record.batchLotNumber && (
                                      <p>
                                        <span className="text-muted-foreground">Batch/Lot:</span>{' '}
                                        {record.batchLotNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm mb-2">Complaint</h4>
                                <p className="text-sm whitespace-pre-wrap">
                                  {record.complaintDescription}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm mb-2">
                                  Investigation & Cause
                                </h4>
                                <p className="text-sm whitespace-pre-wrap">
                                  {record.causeInvestigation}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">
                                    Action Taken Immediately
                                  </h4>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {record.actionTakenImmediate}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-sm mb-2">
                                    Action to Prevent Recurrence
                                  </h4>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {record.actionTakenPreventive}
                                  </p>
                                </div>
                              </div>

                              {record.linkedIncidentId && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">
                                    Linked Incident Record
                                  </h4>
                                  <p className="text-sm">
                                    <Badge>{record.linkedIncidentId}</Badge>
                                  </p>
                                </div>
                              )}

                              {record.notes && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Additional Notes</h4>
                                  <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
                                </div>
                              )}

                              <div className="pt-2 border-t text-xs text-muted-foreground">
                                <p>
                                  Resolved: {new Date(record.resolutionDate).toLocaleDateString()}{' '}
                                  by {record.resolvedBy}
                                </p>
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

      {/* Add Complaint Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Customer Complaint</DialogTitle>
            <DialogDescription>
              Document the complaint, investigation, and resolution for MPI compliance
            </DialogDescription>
          </DialogHeader>
          <AddComplaintWizard
            onComplete={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
