import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({ children, open, onOpenChange }: PopoverProps) {
  const [isOpen, setIsOpen] = React.useState(open ?? false)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false)
        onOpenChange?.(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside as any)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [isOpen, onOpenChange])

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onOpenChange?.(newState)
  }

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen: handleToggle }}>
      <div className="relative" ref={popoverRef}>
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverContext = React.createContext<{
  isOpen: boolean
  setIsOpen: () => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export function PopoverTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { setIsOpen } = React.useContext(PopoverContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: setIsOpen,
    } as any)
  }

  return <div onClick={setIsOpen}>{children}</div>
}

export function PopoverContent({
  children,
  className,
  align = 'center',
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}) {
  const { isOpen } = React.useContext(PopoverContext)

  if (!isOpen) return null

  const alignClass = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95',
        alignClass[align],
        className
      )}
    >
      {children}
    </div>
  )
}
