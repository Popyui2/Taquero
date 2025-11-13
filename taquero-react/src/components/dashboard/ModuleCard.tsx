import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  id: string
  title: string
  description: string
  icon: string
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

  return (
    <Card
      className={cn(
        'cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] active:scale-[0.98] relative',
        className
      )}
      onClick={onClick}
    >
      {isCompleted && (
        <Badge
          variant="success"
          className="absolute top-3 right-3 gap-1"
        >
          <Check className="h-3 w-3" />
          Done
        </Badge>
      )}
      <CardHeader className="space-y-3">
        <div className="text-4xl">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
