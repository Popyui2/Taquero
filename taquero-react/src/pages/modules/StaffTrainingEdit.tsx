import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StaffTrainingEdit as StaffTrainingEditComponent } from '@/components/staff-training/StaffTrainingEdit'

export function StaffTrainingEditPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [staffId, setStaffId] = useState<string | null>(searchParams.get('staffId'))

  const handleBack = () => {
    navigate('/module/staff-training')
  }

  const handleSelectStaff = (id: string | null) => {
    setStaffId(id)
    if (id) {
      setSearchParams({ staffId: id })
    } else {
      setSearchParams({})
    }
  }

  return (
    <StaffTrainingEditComponent
      staffId={staffId}
      onBack={handleBack}
      onSelectStaff={handleSelectStaff}
    />
  )
}
