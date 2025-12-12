import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  mode?: 'single' | 'range'
  selectedRange?: { from?: Date; to?: Date }
  onRangeSelect?: (range: { from?: Date; to?: Date } | undefined) => void
}

export function Calendar({
  selected,
  onSelect,
  className,
  mode = 'single',
  selectedRange,
  onRangeSelect
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || selectedRange?.from || new Date()
  )

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    )
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )

    if (mode === 'range' && onRangeSelect) {
      if (!selectedRange?.from || (selectedRange.from && selectedRange.to)) {
        // Start new selection
        onRangeSelect({ from: newDate, to: undefined })
      } else {
        // Complete the range
        if (newDate >= selectedRange.from) {
          onRangeSelect({ from: selectedRange.from, to: newDate })
        } else {
          onRangeSelect({ from: newDate, to: selectedRange.from })
        }
      }
    } else {
      onSelect?.(newDate)
    }
  }

  const isSelected = (day: number) => {
    if (mode === 'range' && selectedRange) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      )

      if (selectedRange.from && selectedRange.to) {
        return date >= selectedRange.from && date <= selectedRange.to
      }

      if (selectedRange.from) {
        return (
          date.getDate() === selectedRange.from.getDate() &&
          date.getMonth() === selectedRange.from.getMonth() &&
          date.getFullYear() === selectedRange.from.getFullYear()
        )
      }

      return false
    }

    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    )
  }

  const isRangeStart = (day: number) => {
    if (mode !== 'range' || !selectedRange?.from) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return (
      date.getDate() === selectedRange.from.getDate() &&
      date.getMonth() === selectedRange.from.getMonth() &&
      date.getFullYear() === selectedRange.from.getFullYear()
    )
  }

  const isRangeEnd = (day: number) => {
    if (mode !== 'range' || !selectedRange?.to) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return (
      date.getDate() === selectedRange.to.getDate() &&
      date.getMonth() === selectedRange.to.getMonth() &&
      date.getFullYear() === selectedRange.to.getFullYear()
    )
  }

  const isInRange = (day: number) => {
    if (mode !== 'range' || !selectedRange?.from || !selectedRange?.to) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date > selectedRange.from && date < selectedRange.to
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  return (
    <div className={cn('p-6', className)} style={{ minWidth: '420px' }}>
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevMonth}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="font-semibold text-lg">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="flex items-center justify-center text-sm text-muted-foreground font-medium h-12 w-full"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) =>
          day ? (
            <Button
              key={index}
              variant={isSelected(day) ? 'default' : 'ghost'}
              className={cn(
                'aspect-square w-full p-0 font-normal text-base',
                isToday(day) && !isSelected(day) && 'border border-primary',
                isSelected(day) && 'bg-primary text-primary-foreground',
                mode === 'range' && isInRange(day) && 'bg-accent text-accent-foreground',
                mode === 'range' && (isRangeStart(day) || isRangeEnd(day)) && 'bg-primary text-primary-foreground'
              )}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </Button>
          ) : (
            <div key={index} className="aspect-square w-full" />
          )
        )}
      </div>
    </div>
  )
}
