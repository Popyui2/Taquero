import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value: string // DD/MM/YYYY format
  onChange: (value: string) => void // Returns DD/MM/YYYY format
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  // Sync input value when prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Convert DD/MM/YYYY to Date object
  const parseDisplayDate = (dateString: string): Date | undefined => {
    if (!dateString || dateString.length < 10) return undefined

    const parts = dateString.split('/')
    if (parts.length !== 3) return undefined

    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)

    if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return undefined

    const date = new Date(year, month - 1, day)

    // Validate the date is actually valid (e.g., not 31/02/2024)
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return undefined
    }

    return date
  }

  // Convert Date object to DD/MM/YYYY
  const formatDateToDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Get selected date for calendar
  const selectedDate = parseDisplayDate(inputValue)

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDateToDisplay(date)
      setInputValue(formattedDate)
      onChange(formattedDate)
      setOpen(false)
    }
  }

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Remove non-numeric and non-slash characters
    newValue = newValue.replace(/[^\d/]/g, '')

    // Auto-add slashes as user types
    if (newValue.length === 2 && inputValue.length === 1) {
      newValue = newValue + '/'
    } else if (newValue.length === 5 && inputValue.length === 4) {
      newValue = newValue + '/'
    }

    // Limit to DD/MM/YYYY format (10 characters)
    if (newValue.length > 10) {
      newValue = newValue.substring(0, 10)
    }

    setInputValue(newValue)

    // Only call onChange if we have a complete, valid date
    if (newValue.length === 10) {
      const parsedDate = parseDisplayDate(newValue)
      if (parsedDate) {
        onChange(newValue)
      }
    }
  }

  // Handle input blur - validate and format
  const handleInputBlur = () => {
    if (inputValue.length === 10) {
      const parsedDate = parseDisplayDate(inputValue)
      if (parsedDate) {
        // Ensure proper formatting
        const formattedDate = formatDateToDisplay(parsedDate)
        setInputValue(formattedDate)
        onChange(formattedDate)
      }
    }
  }

  return (
    <div className={cn('relative flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex-1 relative">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-12 h-16 text-xl"
            pattern="\d{2}/\d{2}/\d{4}"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-14 w-14"
              disabled={disabled}
            >
              <CalendarIcon className="h-6 w-6" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            selected={selectedDate}
            onSelect={handleCalendarSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
