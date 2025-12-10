import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, LogOut } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuthStore()

  const showBackButton = location.pathname !== '/'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBack = () => {
    const path = location.pathname

    // Smart navigation based on current location
    // Staff training sub-pages -> go to staff training main page
    if (path.startsWith('/module/staff-training/')) {
      navigate('/module/staff-training')
    }
    // Staff training main page -> go to FCP modules
    else if (path === '/module/staff-training') {
      navigate('/restaurant/fcp')
    }
    // Any other module page -> go to FCP modules
    else if (path.startsWith('/module/')) {
      navigate('/restaurant/fcp')
    }
    // FCP pages -> go to respective dashboard
    else if (path === '/restaurant/fcp') {
      navigate('/restaurant')
    }
    else if (path === '/manufacturing/fcp') {
      navigate('/manufacturing')
    }
    // Restaurant sub-pages -> go to restaurant dashboard
    else if (path.startsWith('/restaurant/')) {
      navigate('/restaurant')
    }
    // Manufacturing sub-pages -> go to manufacturing dashboard
    else if (path.startsWith('/manufacturing/')) {
      navigate('/manufacturing')
    }
    // Dashboard pages -> go to home
    else if (path === '/restaurant' || path === '/manufacturing') {
      navigate('/')
    }
    // Default: go to home
    else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-semibold">Taquero</h1>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-white text-black hover:bg-white/90">
                    {currentUser.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
