import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, eachDayOfInterval } from 'date-fns'
import { enNZ } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  ArrowLeft,
  Plus,
  CalendarDays,
  CalendarIcon,
  List,
  MapPin,
  DollarSign,
  Zap,
  Search,
  Trash2,
  ChevronRight,
  ArrowUpDown,
  X,
} from 'lucide-react'

import {
  CaravanEvent,
  CaravanEventStatus,
  CaravanEventType,
  RecurrencePattern,
} from '@/types'
import {
  useCaravanEventsStore,
  STATUS_LABELS,
  STATUS_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_EMOJIS,
} from '@/store/caravanEventsStore'

// Setup date-fns localizer for react-big-calendar
const locales = { 'en-NZ': enNZ }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

// Status progression order for the pipeline
const STATUS_ORDER: CaravanEventStatus[] = [
  'discovered',
  'interested',
  'applied',
  'accepted',
  'paid',
  'confirmed',
  'active',
  'completed',
]

const TERMINAL_STATUSES: CaravanEventStatus[] = [
  'denied',
  'cancelled_by_us',
  'cancelled_by_organizer',
  'postponed',
]

// Empty event template
const createEmptyEvent = (): Omit<CaravanEvent, 'id' | 'createdAt'> => ({
  name: '',
  location: '',
  eventType: 'festival',
  isRecurring: true,
  recurrencePattern: 'annual',
  dates: [],
  year: new Date().getFullYear(),
  status: 'discovered',
  feePaid: false,
  generatorNeeded: false,
  tentProvided: false, // Keep for data compatibility
})

export default function CaravanEvents() {
  const navigate = useNavigate()
  const { events, addEvent, updateEvent, deleteEvent } = useCaravanEventsStore()

  // View state
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CaravanEventStatus | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CaravanEvent | null>(null)
  const [formData, setFormData] = useState<Omit<CaravanEvent, 'id' | 'createdAt'>>(createEmptyEvent())

  // Get unique years from events
  const availableYears = useMemo(() => {
    const years = [...new Set(events.map((e) => e.year))].sort((a, b) => b - a)
    if (!years.includes(new Date().getFullYear())) {
      years.unshift(new Date().getFullYear())
    }
    return years
  }, [events])

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const matchesSearch =
        searchQuery === '' ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      const matchesYear = yearFilter === 'all' || event.year === yearFilter
      return matchesSearch && matchesStatus && matchesYear
    })

    // Sort events
    return filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === 'date') {
        const dateA = a.dates[0] ? new Date(a.dates[0]).getTime() : 0
        const dateB = b.dates[0] ? new Date(b.dates[0]).getTime() : 0
        comparison = dateA - dateB
      } else if (sortBy === 'type') {
        comparison = a.eventType.localeCompare(b.eventType)
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [events, searchQuery, statusFilter, yearFilter, sortBy, sortOrder])

  // Calendar events format
  const calendarEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.dates.length > 0)
      .flatMap((event) =>
        event.dates.map((date) => ({
          id: event.id,
          title: `${EVENT_TYPE_EMOJIS[event.eventType]} ${event.name}`,
          start: new Date(date),
          end: new Date(date),
          allDay: true,
          resource: event,
        }))
      )
  }, [filteredEvents])

  // Stats
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const thisYearEvents = events.filter((e) => e.year === currentYear || e.year === currentYear + 1)
    return {
      total: events.length,
      confirmed: thisYearEvents.filter((e) => ['confirmed', 'paid', 'accepted'].includes(e.status)).length,
      applied: thisYearEvents.filter((e) => e.status === 'applied').length,
      completed: thisYearEvents.filter((e) => e.status === 'completed').length,
      totalRevenue: events
        .filter((e) => e.actualRevenue)
        .reduce((sum, e) => sum + (e.actualRevenue || 0), 0),
    }
  }, [events])

  // Handlers
  const handleAddEvent = () => {
    setFormData(createEmptyEvent())
    setIsAddDialogOpen(true)
  }

  const handleEditEvent = (event: CaravanEvent) => {
    setSelectedEvent(event)
    setFormData({
      name: event.name,
      location: event.location,
      eventType: event.eventType,
      isRecurring: event.isRecurring,
      recurrencePattern: event.recurrencePattern,
      dates: event.dates,
      year: event.year,
      status: event.status,
      organizerName: event.organizerName,
      organizerEmail: event.organizerEmail,
      organizerPhone: event.organizerPhone,
      websiteUrl: event.websiteUrl,
      feeAmount: event.feeAmount,
      feePaid: event.feePaid,
      feePaidDate: event.feePaidDate,
      expectedRevenue: event.expectedRevenue,
      actualRevenue: event.actualRevenue,
      expenses: event.expenses,
      generatorNeeded: event.generatorNeeded,
      generatorNotes: event.generatorNotes,
      powerAvailable: event.powerAvailable,
      tentProvided: event.tentProvided,
      specialNotes: event.specialNotes,
      weatherConditions: event.weatherConditions,
      footTrafficRating: event.footTrafficRating,
      overallRating: event.overallRating,
      participateAgain: event.participateAgain,
      lessonsLearned: event.lessonsLearned,
      notes: event.notes,
      typicalRegistrationWindow: event.typicalRegistrationWindow,
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteEvent = (event: CaravanEvent) => {
    setSelectedEvent(event)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmitAdd = () => {
    addEvent(formData)
    setIsAddDialogOpen(false)
    setFormData(createEmptyEvent())
  }

  const handleSubmitEdit = () => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, formData)
      setIsEditDialogOpen(false)
      setSelectedEvent(null)
    }
  }

  const handleConfirmDelete = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id)
      setIsDeleteDialogOpen(false)
      setSelectedEvent(null)
    }
  }

  const handleCalendarEventClick = (event: { resource: CaravanEvent }) => {
    handleEditEvent(event.resource)
  }

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(amount)

  // Format date for display
  const formatEventDates = (dates: string[]) => {
    if (dates.length === 0) return 'TBD'
    if (dates.length === 1) return format(new Date(dates[0]), 'd MMM yyyy')
    return `${format(new Date(dates[0]), 'd MMM')} - ${format(new Date(dates[dates.length - 1]), 'd MMM yyyy')}`
  }

  return (
    <div className="space-y-6">
      {/* Add Event Button */}
      <Button
        size="lg"
        onClick={handleAddEvent}
        className="h-12 px-6 min-h-[48px] w-full sm:w-auto"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Event
      </Button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.applied}</div>
            <p className="text-xs text-muted-foreground">Applied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CaravanEventStatus | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {[...STATUS_ORDER, ...TERMINAL_STATUSES].map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={yearFilter.toString()}
            onValueChange={(v) => setYearFilter(v === 'all' ? 'all' : parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 border-l pl-4 ml-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'type' | 'name')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Event Type</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'list' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      {activeView === 'list' ? (
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-4">
                    {events.length === 0
                      ? 'Add your first caravan event to get started'
                      : 'Try adjusting your filters'}
                  </p>
                  {events.length === 0 && (
                    <Button onClick={handleAddEvent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleEditEvent(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="text-3xl">{EVENT_TYPE_EMOJIS[event.eventType]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg truncate">{event.name}</h3>
                              <Badge
                                variant="secondary"
                                className={`${STATUS_COLORS[event.status]} text-white text-xs`}
                              >
                                {STATUS_LABELS[event.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatEventDates(event.dates)}
                              </span>
                              {event.feePaid && (
                                <span className="flex items-center gap-1 text-green-500">
                                  <DollarSign className="h-3 w-3" />
                                  Paid
                                </span>
                              )}
                              {event.generatorNeeded && (
                                <span className="flex items-center gap-1 text-yellow-500">
                                  <Zap className="h-3 w-3" />
                                  Generator
                                </span>
                              )}
                            </div>
                            {event.notes && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                {event.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.actualRevenue !== undefined && event.actualRevenue > 0 && (
                            <div className="text-right">
                              <div className="font-semibold text-green-500">
                                {formatCurrency(event.actualRevenue)}
                              </div>
                              <div className="text-xs text-muted-foreground">Revenue</div>
                            </div>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        ) : (
          <Card className="p-4">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleCalendarEventClick}
                views={[Views.MONTH, Views.AGENDA]}
                defaultView={Views.MONTH}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor:
                      STATUS_COLORS[event.resource.status]?.replace('bg-', '#').replace('-500', '') ||
                      '#6366f1',
                  },
                })}
              />
            </div>
          </Card>
        )}

      {/* Add/Edit Event Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
            setSelectedEvent(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddDialogOpen ? 'Add New Event' : 'Edit Event'}</DialogTitle>
            <DialogDescription>
              {isAddDialogOpen
                ? 'Add a new caravan event to your calendar'
                : 'Update event details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Wellington Night Market"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Wellington"
                  />
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(v) => setFormData({ ...formData, eventType: v as CaravanEventType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {EVENT_TYPE_EMOJIS[value]} {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as CaravanEventStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...STATUS_ORDER, ...TERMINAL_STATUSES].map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dates[0]
                          ? format(new Date(formData.dates[0]), 'd MMM yyyy')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center" side="top" sideOffset={5}>
                      <Calendar
                        compact
                        selected={formData.dates[0] ? new Date(formData.dates[0]) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const startDate = format(date, 'yyyy-MM-dd')
                            const endDate = formData.dates[1]
                            if (endDate && new Date(endDate) >= date) {
                              // Generate all dates between start and end
                              const allDates = eachDayOfInterval({
                                start: date,
                                end: new Date(endDate),
                              }).map((d) => format(d, 'yyyy-MM-dd'))
                              setFormData({ ...formData, dates: allDates, year: date.getFullYear() })
                            } else {
                              setFormData({ ...formData, dates: [startDate], year: date.getFullYear() })
                            }
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={!formData.dates[0]}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dates.length > 1
                          ? format(new Date(formData.dates[formData.dates.length - 1]), 'd MMM yyyy')
                          : 'Pick end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center" side="top" sideOffset={5}>
                      <Calendar
                        compact
                        selected={
                          formData.dates.length > 1
                            ? new Date(formData.dates[formData.dates.length - 1])
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date && formData.dates[0]) {
                            const startDate = new Date(formData.dates[0])
                            if (date >= startDate) {
                              const allDates = eachDayOfInterval({
                                start: startDate,
                                end: date,
                              }).map((d) => format(d, 'yyyy-MM-dd'))
                              setFormData({ ...formData, dates: allDates })
                            }
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Organizer Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Organizer</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizerName">Name</Label>
                  <Input
                    id="organizerName"
                    value={formData.organizerName || ''}
                    onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="organizerEmail">Email</Label>
                  <Input
                    id="organizerEmail"
                    type="email"
                    value={formData.organizerEmail || ''}
                    onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="organizerPhone">Phone</Label>
                  <Input
                    id="organizerPhone"
                    value={formData.organizerPhone || ''}
                    onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="websiteUrl">Website</Label>
                  <Input
                    id="websiteUrl"
                    value={formData.websiteUrl || ''}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Financials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feeAmount">Fee Amount (NZD)</Label>
                  <Input
                    id="feeAmount"
                    type="number"
                    value={formData.feeAmount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, feeAmount: parseFloat(e.target.value) || undefined })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="feePaid"
                    checked={formData.feePaid}
                    onCheckedChange={(checked) => setFormData({ ...formData, feePaid: checked })}
                  />
                  <Label htmlFor="feePaid">Fee Paid</Label>
                </div>
                <div>
                  <Label htmlFor="expectedRevenue">Expected Revenue</Label>
                  <Input
                    id="expectedRevenue"
                    type="number"
                    value={formData.expectedRevenue || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedRevenue: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="actualRevenue">Actual Revenue</Label>
                  <Input
                    id="actualRevenue"
                    type="number"
                    value={formData.actualRevenue || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        actualRevenue: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Requirements</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="generatorNeeded"
                    checked={formData.generatorNeeded}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, generatorNeeded: checked })
                    }
                  />
                  <Label htmlFor="generatorNeeded">Generator Needed</Label>
                </div>
                <div>
                  <Label htmlFor="powerAvailable">Power Available</Label>
                  <Select
                    value={formData.powerAvailable || 'unknown'}
                    onValueChange={(v) =>
                      setFormData({ ...formData, powerAvailable: v as 'yes' | 'no' | 'unknown' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {isEditDialogOpen && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  if (selectedEvent) handleDeleteEvent(selectedEvent)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setIsEditDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={isAddDialogOpen ? handleSubmitAdd : handleSubmitEdit}
                disabled={!formData.name || !formData.location}
              >
                {isAddDialogOpen ? 'Add Event' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
