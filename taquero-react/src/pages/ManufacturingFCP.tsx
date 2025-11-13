import { useNavigate } from 'react-router-dom'
import { ModuleCard } from '@/components/dashboard/ModuleCard'

export function ManufacturingFCP() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Manufacturing FCP Records
        </h2>
        <p className="text-muted-foreground text-lg">
          Food Control Plan compliance modules
        </p>
      </div>

      {/* Shared Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-muted-foreground">
          Shared Records
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            id="staff-training"
            title="Staff Training Records"
            description="Training logs & certifications"
            icon="👥"
            onClick={() => navigate('/module/staff-training')}
          />
          <ModuleCard
            id="personal-hygiene"
            title="Personal Hygiene"
            description="Hygiene management & records"
            icon="🧼"
            onClick={() => navigate('/module/personal-hygiene')}
          />
          <ModuleCard
            id="fridge-temps"
            title="Fridge/Chiller Temps"
            description="Temperature monitoring logs"
            icon="🌡️"
            onClick={() => navigate('/module/fridge-temps')}
          />
          <ModuleCard
            id="cleaning-closing"
            title="Cleaning & Closing"
            description="Daily cleaning schedules"
            icon="🧹"
            onClick={() => navigate('/module/cleaning-closing')}
          />
          <ModuleCard
            id="equipment-maintenance"
            title="Equipment Maintenance"
            description="Facilities & water supply records"
            icon="🔧"
            onClick={() => navigate('/module/equipment-maintenance')}
          />
        </div>
      </div>

      {/* Manufacturing-Only Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-muted-foreground">
          Manufacturing-Specific Records
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            id="cooking-poultry-batch"
            title="Cooking Poultry - Batch Checks"
            description="Batch checks for poultry, minced meat, liver"
            icon="🍗"
            onClick={() => navigate('/module/cooking-poultry-batch')}
          />
          <ModuleCard
            id="proving-method"
            title="Proving the Method"
            description="Method validation records"
            icon="✅"
            onClick={() => navigate('/module/proving-method')}
          />
          <ModuleCard
            id="proving-reheating"
            title="Proving Reheating Method"
            description="Reheating validation"
            icon="♨️"
            onClick={() => navigate('/module/proving-reheating')}
          />
          <ModuleCard
            id="proving-time-temp"
            title="Proving Time/Temp Cooking"
            description="Time/temperature validation"
            icon="⏱️"
            onClick={() => navigate('/module/proving-time-temp')}
          />
          <ModuleCard
            id="proving-cooling"
            title="Proving Cooling Method"
            description="Cooling method validation"
            icon="❄️"
            onClick={() => navigate('/module/proving-cooling')}
          />
          <ModuleCard
            id="cooling-batch"
            title="Cooling Food - Batch Checks"
            description="Freshly cooked food cooling logs"
            icon="🧊"
            onClick={() => navigate('/module/cooling-batch')}
          />
          <ModuleCard
            id="processes-controls"
            title="Processes & Controls"
            description="Knowing your processes and controls"
            icon="⚙️"
            onClick={() => navigate('/module/processes-controls')}
          />
          <ModuleCard
            id="selling-to-businesses"
            title="Selling to Businesses"
            description="B2B sales documentation"
            icon="🏢"
            onClick={() => navigate('/module/selling-to-businesses')}
          />
        </div>
      </div>
    </div>
  )
}
