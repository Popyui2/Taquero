import { useNavigate } from 'react-router-dom'
import { ModuleCard } from '@/components/dashboard/ModuleCard'

export function RestaurantDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Restaurant Dashboard
        </h2>
        <p className="text-muted-foreground text-lg">
          Hot Like A Mexican - Wellington, NZ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleCard
          id="restaurant-fcp"
          title="FCP Recordkeeping"
          description="All 13 food control plan sections"
          icon="📋"
          onClick={() => navigate('/restaurant/fcp')}
        />

        <ModuleCard
          id="inventory"
          title="Inventory Management"
          description="Stocktaking & shopping lists"
          icon="📦"
          onClick={() => navigate('/restaurant/inventory')}
        />

        <ModuleCard
          id="financial"
          title="Financial Data"
          description="CSV intake & data visualization"
          icon="💰"
          onClick={() => navigate('/restaurant/financial')}
        />

        <ModuleCard
          id="events"
          title="Caravan Events"
          description="Event management & scheduling"
          icon="🚐"
          onClick={() => navigate('/restaurant/events')}
        />
      </div>
    </div>
  )
}
