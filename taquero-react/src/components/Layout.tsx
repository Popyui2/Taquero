import { ReactNode } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
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

interface BreadcrumbSegment {
  label: string
  path?: string
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

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = (): BreadcrumbSegment[] => {
    const path = location.pathname
    const breadcrumbs: BreadcrumbSegment[] = []

    // Always start with Home if not on home page
    if (path !== '/') {
      breadcrumbs.push({ label: 'Home', path: '/' })
    }

    // Restaurant paths
    if (path.startsWith('/restaurant')) {
      if (path === '/restaurant') {
        breadcrumbs.push({ label: 'Restaurant Dashboard' })
      } else if (path === '/restaurant/fcp') {
        breadcrumbs.push({ label: 'Restaurant Dashboard', path: '/restaurant' })
        breadcrumbs.push({ label: 'FCP Records' })
      } else if (path === '/restaurant/inventory') {
        breadcrumbs.push({ label: 'Restaurant Dashboard', path: '/restaurant' })
        breadcrumbs.push({ label: 'Inventory Management' })
      } else if (path === '/restaurant/financial') {
        breadcrumbs.push({ label: 'Restaurant Dashboard', path: '/restaurant' })
        breadcrumbs.push({ label: 'Financial Data' })
      } else if (path === '/restaurant/events') {
        breadcrumbs.push({ label: 'Restaurant Dashboard', path: '/restaurant' })
        breadcrumbs.push({ label: 'Caravan Events' })
      }
    }
    // Manufacturing paths
    else if (path.startsWith('/manufacturing')) {
      if (path === '/manufacturing') {
        breadcrumbs.push({ label: 'Manufacturing Dashboard' })
      } else if (path === '/manufacturing/fcp') {
        breadcrumbs.push({ label: 'Manufacturing Dashboard', path: '/manufacturing' })
        breadcrumbs.push({ label: 'FCP Records' })
      } else if (path === '/manufacturing/traceability') {
        breadcrumbs.push({ label: 'Manufacturing Dashboard', path: '/manufacturing' })
        breadcrumbs.push({ label: 'Traceability System' })
      } else if (path === '/manufacturing/b2b') {
        breadcrumbs.push({ label: 'Manufacturing Dashboard', path: '/manufacturing' })
        breadcrumbs.push({ label: 'B2B Sales Tracking' })
      }
    }
    // Module paths
    else if (path.startsWith('/module/')) {
      breadcrumbs.push({ label: 'FCP Modules', path: '/restaurant/fcp' })

      if (path === '/module/fridge-temps') {
        breadcrumbs.push({ label: 'Fridge/Chiller Temperature Checks' })
      } else if (path === '/module/staff-training') {
        breadcrumbs.push({ label: 'Staff Training Records' })
      } else if (path === '/module/personal-hygiene') {
        breadcrumbs.push({ label: 'Personal Hygiene' })
      } else if (path === '/module/cleaning-closing') {
        breadcrumbs.push({ label: 'Cleaning & Closing' })
      } else if (path === '/module/equipment-maintenance') {
        breadcrumbs.push({ label: 'Equipment Maintenance' })
      } else if (path === '/module/cooking-poultry-batch') {
        breadcrumbs.push({ label: 'Cooking Poultry - Batch Checks' })
      } else if (path === '/module/proving-method') {
        breadcrumbs.push({ label: 'Proving the Method' })
      } else if (path === '/module/proving-reheating') {
        breadcrumbs.push({ label: 'Proving Reheating Method' })
      } else if (path === '/module/proving-time-temp') {
        breadcrumbs.push({ label: 'Proving Time/Temp Cooking' })
      } else if (path === '/module/proving-cooling') {
        breadcrumbs.push({ label: 'Proving Cooling Method' })
      } else if (path === '/module/cooling-batch') {
        breadcrumbs.push({ label: 'Cooling Food - Batch Checks' })
      } else if (path === '/module/something-wrong') {
        breadcrumbs.push({ label: 'When Something Goes Wrong' })
      } else if (path === '/module/customer-complaints') {
        breadcrumbs.push({ label: 'Customer Complaints' })
      } else if (path === '/module/processes-controls') {
        breadcrumbs.push({ label: 'Processes & Controls' })
      } else if (path === '/module/selling-to-businesses') {
        breadcrumbs.push({ label: 'Selling to Businesses' })
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()
  const showBreadcrumbs = breadcrumbs.length > 0

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
