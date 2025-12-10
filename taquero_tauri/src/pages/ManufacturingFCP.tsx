import { useNavigate } from 'react-router-dom'
import { ModuleCard } from '@/components/dashboard/ModuleCard'
import {
  Users,
  HeartPulse,
  Thermometer,
  Sparkles,
  Wrench,
  UtensilsCrossed,
  Flame,
  Snowflake,
  Box,
  Settings,
  Building2,
  Utensils,
  Truck,
  PackageCheck,
} from 'lucide-react'

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
            description="Training Records and Staff Info"
            icon={Users}
            onClick={() => navigate('/module/staff-training')}
          />
          <ModuleCard
            id="personal-hygiene"
            title="Staff Sickness"
            description="Staff health & sickness records"
            icon={HeartPulse}
            onClick={() => navigate('/module/personal-hygiene')}
          />
          <ModuleCard
            id="fridge-temps"
            title="Fridge/Chiller Temps"
            description="Temperature monitoring logs"
            icon={Thermometer}
            onClick={() => navigate('/module/fridge-temps')}
          />
          <ModuleCard
            id="cleaning-closing"
            title="Cleaning & Closing"
            description="Cleaning and Closing Procedures"
            icon={Sparkles}
            onClick={() => navigate('/module/cleaning-closing')}
          />
          <ModuleCard
            id="equipment-maintenance"
            title="Equipment Maintenance"
            description="Equipment repair Records"
            icon={Wrench}
            onClick={() => navigate('/module/equipment-maintenance')}
          />
          <ModuleCard
            id="allergens"
            title="Allergens in My Food"
            description="Track allergens to inform customers"
            icon={Utensils}
            onClick={() => navigate('/module/allergens')}
          />
          <ModuleCard
            id="suppliers"
            title="My Trusted Suppliers"
            description="Track suppliers for food safety"
            icon={Truck}
            onClick={() => navigate('/module/suppliers')}
          />
          <ModuleCard
            id="supplier-deliveries"
            title="Trusted Supplier Deliveries"
            description="Record deliveries for traceability"
            icon={PackageCheck}
            onClick={() => navigate('/module/supplier-deliveries')}
          />
          <ModuleCard
            id="b2b-sales"
            title="Selling Food to Businesses"
            description="Track B2B sales to other businesses"
            icon={Building2}
            onClick={() => navigate('/module/b2b-sales')}
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
            title="Cooking Proteins - Batch"
            description="Batch checks for chicken, beef, pork"
            icon={UtensilsCrossed}
            onClick={() => navigate('/module/cooking-poultry-batch')}
          />
          <ModuleCard
            id="proving-reheating"
            title="Proving Reheating Method"
            description="Reheating validation"
            icon={Flame}
            onClick={() => navigate('/module/proving-reheating')}
          />
          <ModuleCard
            id="proving-time-temp"
            title="Proving the Cooking Method"
            description="Method validation records"
            icon={Flame}
            onClick={() => navigate('/module/proving-time-temp')}
          />
          <ModuleCard
            id="proving-cooling"
            title="Proving Cooling Method"
            description="Cooling method validation"
            icon={Snowflake}
            onClick={() => navigate('/module/proving-cooling')}
          />
          <ModuleCard
            id="cooling-batch"
            title="Cooling Food - Batch Checks"
            description="Freshly cooked food cooling logs"
            icon={Box}
            onClick={() => navigate('/module/cooling-batch')}
          />
          <ModuleCard
            id="processes-controls"
            title="Processes & Controls"
            description="Knowing your processes and controls"
            icon={Settings}
            onClick={() => navigate('/module/processes-controls')}
          />
          <ModuleCard
            id="selling-to-businesses"
            title="Selling to Businesses"
            description="B2B sales documentation"
            icon={Building2}
            onClick={() => navigate('/module/selling-to-businesses')}
          />
        </div>
      </div>
    </div>
  )
}
