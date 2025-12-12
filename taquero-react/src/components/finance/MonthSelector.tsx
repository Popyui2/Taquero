import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

interface MonthSelectorProps {
  availableMonths: string[]
  selectedMonths: string[]
  onSelectionChange: (months: string[]) => void
  selectedPeriod?: string
  onPeriodChange?: (period: string) => void
}

export function MonthSelector({ availableMonths, selectedMonths, onSelectionChange, selectedPeriod, onPeriodChange }: MonthSelectorProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const toggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      onSelectionChange(selectedMonths.filter(m => m !== month))
    } else {
      onSelectionChange([...selectedMonths, month])
    }
  }

  const selectAll = () => {
    onSelectionChange(availableMonths)
    onPeriodChange?.('all-time')
  }

  const selectNone = () => {
    onSelectionChange([])
    onPeriodChange?.('none')
  }

  const selectLastWeek = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const monthsInRange = availableMonths.filter(month => {
      const [year, monthNum] = month.split('-')
      const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1)
      return monthDate >= oneWeekAgo
    })
    onSelectionChange(monthsInRange.length > 0 ? monthsInRange : availableMonths.slice(0, 1))
    onPeriodChange?.('last-week')
  }

  const selectLastMonth = () => {
    if (availableMonths.length > 0) {
      onSelectionChange([availableMonths[0]])
    }
    onPeriodChange?.('last-month')
  }

  const selectLast3Months = () => {
    onSelectionChange(availableMonths.slice(0, 3))
    onPeriodChange?.('last-3-months')
  }

  const selectLast6Months = () => {
    onSelectionChange(availableMonths.slice(0, 6))
    onPeriodChange?.('last-6-months')
  }

  const selectLastYear = () => {
    onSelectionChange(availableMonths.slice(0, 12))
    onPeriodChange?.('last-year')
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      // Filter months that fall within the selected date range
      const monthsInRange = availableMonths.filter(month => {
        const [year, monthNum] = month.split('-')
        const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        return monthDate >= range.from! && monthDate <= range.to!
      })
      onSelectionChange(monthsInRange)
      onPeriodChange?.('custom')
      setCalendarOpen(false)
    }
  }

  const getCurrentSelection = () => {
    // Use selectedPeriod if available
    if (selectedPeriod === 'last-week') return 'Last Week'
    if (selectedPeriod === 'last-month') return 'Last Month'
    if (selectedPeriod === 'last-3-months') return 'Last 3 Months'
    if (selectedPeriod === 'last-6-months') return 'Last 6 Months'
    if (selectedPeriod === 'last-year') return 'Last Year'
    if (selectedPeriod === 'all-time') return 'All Time'
    if (selectedPeriod === 'custom') return 'Custom Range'

    // Fallback to count-based selection if no period is set
    if (selectedMonths.length === 1) return 'Last Month'
    if (selectedMonths.length === 3) return 'Last 3 Months'
    if (selectedMonths.length === 6) return 'Last 6 Months'
    if (selectedMonths.length === 12) return 'Last Year'
    if (selectedMonths.length === availableMonths.length) return 'All Time'
    if (selectedMonths.length === 0) return 'Select Period'
    return `${selectedMonths.length} months`
  }

  if (availableMonths.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Period:</span>
          </div>

          {/* Period Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
                {getCurrentSelection()}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={selectLastWeek}>
                Last Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={selectLastMonth}>
                Last Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={selectLast3Months}>
                Last 3 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={selectLast6Months}>
                Last 6 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={selectLastYear}>
                Last Year
              </DropdownMenuItem>
              <DropdownMenuItem onClick={selectAll}>
                All Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Date Range Picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Custom Range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
              <Calendar
                mode="range"
                selectedRange={dateRange}
                onRangeSelect={(range) => {
                  setDateRange(range)
                  if (range?.from && range?.to) {
                    handleDateRangeSelect(range)
                  }
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Clear Button */}
          {selectedMonths.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={selectNone}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Month Grid - Show if more than 6 months */}
        {availableMonths.length > 6 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {availableMonths.map(month => (
                <Button
                  key={month}
                  variant={selectedMonths.includes(month) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleMonth(month)}
                  className="text-xs"
                >
                  {formatMonth(month).split(' ')[0]} {formatMonth(month).split(' ')[1]?.slice(-2)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
