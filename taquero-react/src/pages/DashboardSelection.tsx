import { useNavigate } from 'react-router-dom'
import { ModuleCard } from '@/components/dashboard/ModuleCard'

export function DashboardSelection() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Select Dashboard</h2>
        <p className="text-muted-foreground text-lg">
          Choose which system you want to access
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModuleCard
          id="restaurant-dashboard"
          title="Restaurant"
          description="FCP Records, Inventory, Events & Financial Data"
          icon="🌮"
          onClick={() => navigate('/restaurant')}
        />

        <ModuleCard
          id="manufacturing-dashboard"
          title="Food Manufacturing"
          description="FCP Records, Traceability & B2B Sales"
          icon="🏭"
          onClick={() => navigate('/manufacturing')}
        />
      </div>
    </div>
  )
}
