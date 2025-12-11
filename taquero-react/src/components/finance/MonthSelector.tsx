import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface MonthSelectorProps {
  availableMonths: string[]
  selectedMonths: string[]
  onSelectionChange: (months: string[]) => void
}

export function MonthSelector({ availableMonths, selectedMonths, onSelectionChange }: MonthSelectorProps) {
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const toggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      // Remove if already selected
      onSelectionChange(selectedMonths.filter(m => m !== month))
    } else {
      // Add to selection
      onSelectionChange([...selectedMonths, month])
    }
  }

  const selectAll = () => {
    onSelectionChange(availableMonths)
  }

  const selectNone = () => {
    onSelectionChange([])
  }

  const selectLastMonth = () => {
    if (availableMonths.length > 0) {
      onSelectionChange([availableMonths[0]])
    }
  }

  const selectLast3Months = () => {
    onSelectionChange(availableMonths.slice(0, 3))
  }

  const selectLast6Months = () => {
    onSelectionChange(availableMonths.slice(0, 6))
  }

  if (availableMonths.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Period:</span>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={selectLastMonth}
              className={selectedMonths.length === 1 && selectedMonths[0] === availableMonths[0] ? 'bg-foreground/10' : ''}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectLast3Months}
              className={selectedMonths.length === 3 && availableMonths.slice(0, 3).every(m => selectedMonths.includes(m)) ? 'bg-foreground/10' : ''}
            >
              Last 3 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectLast6Months}
            >
              Last 6 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className={selectedMonths.length === availableMonths.length ? 'bg-foreground/10' : ''}
            >
              All Time
            </Button>
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

          {/* Selected Months Display */}
          {selectedMonths.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <span className="text-xs text-muted-foreground">Viewing:</span>
              {selectedMonths.sort((a, b) => b.localeCompare(a)).slice(0, 3).map(month => (
                <Badge key={month} variant="outline" className="cursor-pointer" onClick={() => toggleMonth(month)}>
                  {formatMonth(month)} ×
                </Badge>
              ))}
              {selectedMonths.length > 3 && (
                <Badge variant="outline">
                  +{selectedMonths.length - 3} more
                </Badge>
              )}
            </div>
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
