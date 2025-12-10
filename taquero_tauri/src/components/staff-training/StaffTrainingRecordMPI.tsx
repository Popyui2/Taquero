import { useParams, useNavigate } from 'react-router-dom'
import { useStaffTrainingStore } from '@/store/staffTrainingStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export function StaffTrainingRecordMPI() {
  const { staffId } = useParams<{ staffId: string }>()
  const navigate = useNavigate()
  const { getStaffMember } = useStaffTrainingStore()

  const staff = staffId ? getStaffMember(staffId) : null

  if (!staff || !staffId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Staff Member Not Found</h2>
        <Button onClick={() => navigate('/module/staff-training')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff List
        </Button>
      </div>
    )
  }

  const startDate = staff.createdAt ? format(new Date(staff.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')

  return (
    <div className="min-h-screen">
      {/* Controls */}
      <div className="max-w-6xl mx-auto px-4 py-4 bg-background sticky top-0 z-10 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/module/staff-training/${staffId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff Detail
        </Button>
      </div>

      {/* MPI Format Document */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* MPI Logo placeholder - you can add actual logo */}
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold print:bg-blue-700">
                MPI
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 print:text-black" style={{ fontFamily: 'Tw Cen MT, sans-serif' }}>
                  Staff training records
                </h1>
                <p className="text-lg text-gray-700 mt-1">{staff.name}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-600">See the "Training and</p>
              <p className="text-gray-600">competency" dark blue</p>
              <p className="text-gray-600">card in SS&S</p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 print:bg-gray-100 print:border-gray-800">
            <p className="text-sm text-gray-800 print:text-black">
              <strong>Staff</strong> could include volunteers, family, friends, owner/operators, and managers, who may carry
              out food related tasks in your business or operation. You do not need to keep training records if you are a sole
              operator and do not need to keep training records.
            </p>
          </div>

          {/* Staff Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Position*</label>
              <div className="border-2 border-gray-300 rounded px-3 py-2 bg-white print:bg-white">
                {staff.position}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start date*</label>
              <div className="border-2 border-gray-300 rounded px-3 py-2 bg-white print:bg-white">
                {startDate}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email*</label>
              <div className="border-2 border-gray-300 rounded px-3 py-2 bg-white print:bg-white">
                {staff.email || 'Not provided'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone number*</label>
              <div className="border-2 border-gray-300 rounded px-3 py-2 bg-white print:bg-white">
                {staff.phone || 'Not provided'}
              </div>
            </div>
          </div>
        </div>

        {/* Training Records Table */}
        <div className="border-2 border-gray-800 print:border-black">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-blue-700 text-white print:bg-blue-800 print:text-white">
            <div className="col-span-6 p-3 border-r-2 border-white print:border-white font-semibold">
              Topic (Part of the plan that has been covered)
            </div>
            <div className="col-span-2 p-3 border-r-2 border-white print:border-white font-semibold text-center">
              Staff's name
            </div>
            <div className="col-span-2 p-3 border-r-2 border-white print:border-white font-semibold text-center">
              Trainer initials
            </div>
            <div className="col-span-2 p-3 font-semibold text-center">
              Date
            </div>
          </div>

          {/* Table Rows - Training Records */}
          {staff.trainingRecords.map((record, index) => (
            <div
              key={record.id}
              className={`grid grid-cols-12 border-t-2 border-gray-800 print:border-black ${
                index % 2 === 0 ? 'bg-blue-50 print:bg-gray-50' : 'bg-white print:bg-white'
              }`}
            >
              <div className="col-span-6 p-3 border-r-2 border-gray-300 print:border-gray-400">
                <div className="font-semibold text-gray-900 print:text-black mb-1">
                  {record.topic.split('(')[0].trim()}
                </div>
                {record.topic.includes('(') && (
                  <div className="text-sm text-gray-600 print:text-gray-700 italic">
                    ({record.topic.split('(')[1]}
                  </div>
                )}
              </div>
              <div className="col-span-2 p-3 border-r-2 border-gray-300 print:border-gray-400 text-center flex items-center justify-center">
                <span className="font-medium">{staff.name}</span>
              </div>
              <div className="col-span-2 p-3 border-r-2 border-gray-300 print:border-gray-400 text-center flex items-center justify-center">
                <span className="font-mono font-bold text-lg">{record.trainerInitials}</span>
              </div>
              <div className="col-span-2 p-3 text-center flex items-center justify-center">
                <span>{format(new Date(record.date), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          ))}

          {/* Empty rows to match MPI format (minimum 8 total rows) */}
          {Array.from({ length: Math.max(8 - staff.trainingRecords.length, 0) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className={`grid grid-cols-12 border-t-2 border-gray-800 print:border-black ${
                (staff.trainingRecords.length + index) % 2 === 0 ? 'bg-blue-50 print:bg-gray-50' : 'bg-white print:bg-white'
              }`}
            >
              <div className="col-span-6 p-3 border-r-2 border-gray-300 print:border-gray-400 h-16">
                &nbsp;
              </div>
              <div className="col-span-2 p-3 border-r-2 border-gray-300 print:border-gray-400 h-16">
                &nbsp;
              </div>
              <div className="col-span-2 p-3 border-r-2 border-gray-300 print:border-gray-400 h-16">
                &nbsp;
              </div>
              <div className="col-span-2 p-3 h-16">
                &nbsp;
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-500 print:text-gray-600">
          <p>Generated by Taquero - Food Safety Management System</p>
          <p>Printed: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</p>
          <p className="mt-2">This document complies with MPI Food Control Plan requirements for staff training record keeping.</p>
        </div>
      </div>
    </div>
  )
}
