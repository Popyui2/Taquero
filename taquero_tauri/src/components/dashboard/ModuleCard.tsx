import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'
import { Check, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  id: string
  title: string
  description: string
  icon: string | LucideIcon
  onClick?: () => void
  className?: string
}

export function ModuleCard({
  id,
  title,
  description,
  icon,
  onClick,
  className,
}: ModuleCardProps) {
  const isCompleted = useAppStore((state) => state.isTaskCompletedToday(id))
  const IconComponent = typeof icon === 'string' ? null : icon

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 ease-in-out',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
        'hover:scale-[1.02] hover:-translate-y-1',
        'active:scale-[0.98] active:translate-y-0',
        'animate-in fade-in slide-in-from-bottom-4 duration-500',
        'relative group',
        className
      )}
      onClick={onClick}
    >
      {isCompleted && (
        <Badge
          variant="success"
          className="absolute top-3 right-3 gap-1 animate-in zoom-in duration-300"
        >
          <Check className="h-3 w-3" />
          Done
        </Badge>
      )}
      <CardHeader className="space-y-3">
        {IconComponent ? (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
            <IconComponent className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
        ) : (
          <div className="text-4xl transition-transform duration-300 group-hover:scale-110">
            {icon as string}
          </div>
        )}
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
