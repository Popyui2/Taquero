import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

interface ModulePlaceholderProps {
  title: string
  description: string
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-lg">{description}</p>
      </div>

      <Card>
        <CardHeader className="text-center pb-3">
          <Construction className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
          <CardDescription className="text-base">
            This module is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Check back later for updates
        </CardContent>
      </Card>
    </div>
  )
}
