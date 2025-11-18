import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { UserSelection } from '@/components/auth/UserSelection'
import { Layout } from '@/components/Layout'
import { DashboardSelection } from '@/pages/DashboardSelection'
import { RestaurantDashboard } from '@/pages/RestaurantDashboard'
import { ManufacturingDashboard } from '@/pages/ManufacturingDashboard'
import { RestaurantFCP } from '@/pages/RestaurantFCP'
import { ManufacturingFCP } from '@/pages/ManufacturingFCP'
import { FridgeTemps } from '@/pages/modules/FridgeTemps'
import { ModulePlaceholder } from '@/pages/modules/ModulePlaceholder'
import { CookingProteinsBatch } from '@/pages/CookingProteinsBatch'
import { ProvingMethods } from '@/pages/modules/ProvingMethods'
import { ProvingCooling } from '@/pages/modules/ProvingCooling'
import { ProvingReheating } from '@/pages/modules/ProvingReheating'
import { StaffSickness } from '@/pages/modules/StaffSickness'
import { CoolingBatchChecks } from '@/pages/modules/CoolingBatchChecks'
import { Allergens } from '@/pages/modules/Allergens'
import { MySuppliers } from '@/pages/modules/MySuppliers'
import { StaffList } from '@/components/staff-training/StaffList'
import { StaffDetail } from '@/components/staff-training/StaffDetail'
import { AddStaffForm } from '@/components/staff-training/AddStaffForm'
import { StaffTrainingRecordMPI } from '@/components/staff-training/StaffTrainingRecordMPI'
import { Toast, ToastContainer } from '@/components/ui/toast'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

function App() {
  const { isAuthenticated, login } = useAuthStore()
  const [showUserSelection, setShowUserSelection] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handlePasswordCorrect = () => {
    setShowUserSelection(true)
  }

  const handleUserSelect = (userName: string) => {
    login(userName)
    showToast(`Welcome, ${userName}!`, 'success')
  }

  if (!isAuthenticated) {
    if (showUserSelection) {
      return <UserSelection onUserSelect={handleUserSelect} />
    }
    return (
      <LoginScreen
        onPasswordCorrect={handlePasswordCorrect}
        onError={(message) => showToast(message, 'error')}
      />
    )
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardSelection />} />

          {/* Restaurant Routes */}
          <Route path="/restaurant" element={<RestaurantDashboard />} />
          <Route path="/restaurant/fcp" element={<RestaurantFCP />} />
          <Route
            path="/restaurant/inventory"
            element={
              <ModulePlaceholder
                title="Inventory Management"
                description="Stocktaking & shopping lists"
              />
            }
          />
          <Route
            path="/restaurant/financial"
            element={
              <ModulePlaceholder
                title="Financial Data"
                description="CSV intake & data visualization"
              />
            }
          />
          <Route
            path="/restaurant/events"
            element={
              <ModulePlaceholder
                title="Caravan Events"
                description="Event management & scheduling"
              />
            }
          />

          {/* Manufacturing Routes */}
          <Route path="/manufacturing" element={<ManufacturingDashboard />} />
          <Route path="/manufacturing/fcp" element={<ManufacturingFCP />} />
          <Route
            path="/manufacturing/traceability"
            element={
              <ModulePlaceholder
                title="Traceability System"
                description="Track ingredients & products"
              />
            }
          />
          <Route
            path="/manufacturing/b2b"
            element={
              <ModulePlaceholder
                title="B2B Sales Tracking"
                description="Business-to-business orders"
              />
            }
          />

          {/* FCP Module Routes */}
          <Route path="/module/fridge-temps" element={<FridgeTemps />} />
          <Route path="/module/staff-training" element={<StaffList />} />
          <Route path="/module/staff-training/add" element={<AddStaffForm />} />
          <Route path="/module/staff-training/:staffId" element={<StaffDetail />} />
          <Route path="/module/staff-training/:staffId/mpi-record" element={<StaffTrainingRecordMPI />} />
          <Route
            path="/module/personal-hygiene"
            element={<StaffSickness />}
          />
          <Route
            path="/module/cleaning-closing"
            element={
              <ModulePlaceholder
                title="Cleaning & Closing"
                description="Daily cleaning schedules"
              />
            }
          />
          <Route
            path="/module/equipment-maintenance"
            element={
              <ModulePlaceholder
                title="Equipment Maintenance"
                description="Facilities & water supply records"
              />
            }
          />
          <Route
            path="/module/cooking-poultry-batch"
            element={<CookingProteinsBatch />}
          />
          <Route
            path="/module/proving-method"
            element={
              <ModulePlaceholder
                title="Proving the Method"
                description="Method validation records"
              />
            }
          />
          <Route
            path="/module/proving-reheating"
            element={<ProvingReheating />}
          />
          <Route
            path="/module/proving-time-temp"
            element={<ProvingMethods />}
          />
          <Route
            path="/module/proving-cooling"
            element={<ProvingCooling />}
          />
          <Route
            path="/module/cooling-batch"
            element={<CoolingBatchChecks />}
          />
          <Route
            path="/module/something-wrong"
            element={
              <ModulePlaceholder
                title="When Something Goes Wrong"
                description="Incident reports & corrective actions"
              />
            }
          />
          <Route
            path="/module/customer-complaints"
            element={
              <ModulePlaceholder
                title="Customer Complaints"
                description="Complaint tracking & resolution"
              />
            }
          />
          <Route
            path="/module/allergens"
            element={<Allergens />}
          />
          <Route
            path="/module/suppliers"
            element={<MySuppliers />}
          />
          <Route
            path="/module/processes-controls"
            element={
              <ModulePlaceholder
                title="Processes & Controls"
                description="Knowing your processes and controls"
              />
            }
          />
          <Route
            path="/module/selling-to-businesses"
            element={
              <ModulePlaceholder
                title="Selling to Businesses"
                description="B2B sales documentation"
              />
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </BrowserRouter>
  )
}

export default App
