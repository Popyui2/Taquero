import { useNavigate } from 'react-router-dom'
import { ModuleCard } from '@/components/dashboard/ModuleCard'

export function ManufacturingDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Food Manufacturing Dashboard
        </h2>
        <p className="text-muted-foreground text-lg">
          Hot Like A Mexican - Wellington, NZ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleCard
          id="manufacturing-fcp"
          title="FCP Recordkeeping"
          description="All 13 food control plan sections"
          icon="📋"
          onClick={() => navigate('/manufacturing/fcp')}
        />

        <ModuleCard
          id="traceability"
          title="Traceability System"
          description="Track ingredients & products"
          icon="🔍"
          onClick={() => navigate('/manufacturing/traceability')}
        />

        <ModuleCard
          id="b2b-sales"
          title="B2B Sales Tracking"
          description="Business-to-business orders"
          icon="📊"
          onClick={() => navigate('/manufacturing/b2b')}
        />
      </div>
    </div>
  )
}
