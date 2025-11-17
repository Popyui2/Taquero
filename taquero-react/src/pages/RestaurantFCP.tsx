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
  Timer,
  Snowflake,
  Box,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react'

export function RestaurantFCP() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">
          Restaurant FCP Records
        </h2>
        <p className="text-muted-foreground text-lg">
          Food Control Plan compliance modules
        </p>
      </div>

      {/* Shared Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Shared Records
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            id="staff-training"
            title="Staff Training Records"
            description="Training logs & certifications"
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
            description="Daily cleaning schedules"
            icon={Sparkles}
            onClick={() => navigate('/module/cleaning-closing')}
          />
          <ModuleCard
            id="equipment-maintenance"
            title="Equipment Maintenance"
            description="Facilities & water supply records"
            icon={Wrench}
            onClick={() => navigate('/module/equipment-maintenance')}
          />
        </div>
      </div>

      {/* Restaurant-Only Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Restaurant-Specific Records
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
            title="Proving the Method"
            description="Method validation records"
            icon={Timer}
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
            id="something-wrong"
            title="When Something Goes Wrong"
            description="Incident reports & corrective actions"
            icon={AlertTriangle}
            onClick={() => navigate('/module/something-wrong')}
          />
          <ModuleCard
            id="customer-complaints"
            title="Customer Complaints"
            description="Complaint tracking & resolution"
            icon={MessageSquare}
            onClick={() => navigate('/module/customer-complaints')}
          />
        </div>
      </div>
    </div>
  )
}
