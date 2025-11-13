import { Button } from '@/components/ui/button'
import { AVAILABLE_USERS } from '@/store/authStore'
import { User, Briefcase, Wrench, Users } from 'lucide-react'

const userIcons = {
  Martin: Briefcase,
  Andres: Users,
  Hugo: Wrench,
  Marcela: Briefcase,
  'Temp Employee': User,
}

interface UserSelectionProps {
  onUserSelect: (userName: string) => void
}

export function UserSelection({ onUserSelect }: UserSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Select Your Name</h1>
          <p className="text-muted-foreground">Who is logging in today?</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {AVAILABLE_USERS.map((userName) => {
            const Icon = userIcons[userName as keyof typeof userIcons]
            return (
              <Button
                key={userName}
                variant="outline"
                size="xl"
                className="h-32 flex-col gap-3 hover:bg-accent"
                onClick={() => onUserSelect(userName)}
              >
                <Icon className="h-10 w-10" />
                <span className="text-lg">{userName}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
