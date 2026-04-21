"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Button } from "./button"
import { Card } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Badge } from "./badge"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Grid3x3, List, Search, Filter, X, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { DateTimePicker } from "./date-time-picker"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
  publicEvent?: boolean
}

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Omit<Event, "id">) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  categories?: string[]
  colors?: { name: string; value: string; bg: string; text: string }[]
  defaultView?: "month" | "week" | "day" | "list"
  className?: string
  availableTags?: string[]
  isAdmin?: boolean
}

const defaultColors = [
  { name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Purple", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Orange", value: "orange", bg: "bg-primary", text: "text-primary-foreground" },
  { name: "Pink", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Red", value: "red", bg: "bg-destructive", text: "text-destructive-foreground" },
]

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Meeting", "Task", "Reminder", "Personal"],
  colors = defaultColors,
  defaultView = "month",
  className,
  availableTags = ["Important", "Urgent", "Work", "Personal", "Team", "Client"],
  isAdmin = false,
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "list">(defaultView)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    color: colors[0].value,
    category: categories[0],
    tags: [],
    publicEvent: false,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const filteredEvents = useMemo(() => {
    return (initialEvents.length > 0 ? initialEvents : events).filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query))

        if (!matchesSearch) return false
      }

      // Color filter
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = event.tags?.some((tag) => selectedTags.includes(tag))
        if (!hasMatchingTag) return false
      }

      // Category filter
      if (selectedCategories.length > 0 && event.category && !selectedCategories.includes(event.category)) {
        return false
      }

      return true
    })
  }, [events, initialEvents, searchQuery, selectedColors, selectedTags, selectedCategories])

  const hasActiveFilters = selectedColors.length > 0 || selectedTags.length > 0 || selectedCategories.length > 0

  const clearFilters = () => {
    setSelectedColors([])
    setSelectedTags([])
    setSelectedCategories([])
    setSearchQuery("")
  }

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return

    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
      publicEvent: newEvent.publicEvent,
    }

    setEvents((prev) => [...prev, event])
    onEventCreate?.(event)
    setIsDialogOpen(false)
    setIsCreating(false)
    setNewEvent({
      title: "",
      description: "",
      color: colors[0].value,
      category: categories[0],
      tags: [],
      publicEvent: false,
    })
  }, [newEvent, colors, categories, onEventCreate])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? selectedEvent : e)))
    onEventUpdate?.(selectedEvent.id, selectedEvent)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDeleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      onEventDelete?.(id)
      setIsDialogOpen(false)
      setSelectedEvent(null)
    },
    [onEventDelete],
  )

  const handleDragStart = useCallback((event: Event) => {
    setDraggedEvent(event)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null)
  }, [])

  const handleDrop = useCallback(
    (date: Date, hour?: number) => {
      if (!draggedEvent) return

      const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
      const newStartTime = new Date(date)
      if (hour !== undefined) {
        newStartTime.setHours(hour, 0, 0, 0)
      }
      const newEndTime = new Date(newStartTime.getTime() + duration)

      const updatedEvent = {
        ...draggedEvent,
        startTime: newStartTime,
        endTime: newEndTime,
      }

      setEvents((prev) => prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)))
      onEventUpdate?.(draggedEvent.id, updatedEvent)
      setDraggedEvent(null)
    },
    [draggedEvent, onEventUpdate],
  )

  const navigateDate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (view === "month") {
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
        } else if (view === "week") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
        } else if (view === "day") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
        }
        return newDate
      })
    },
    [view],
  )

  const getColorClasses = useCallback(
    (colorValue: string) => {
      const color = colors.find((c) => c.value === colorValue)
      return color || colors[0]
    },
    [colors],
  )

  const toggleTag = (tag: string, isCreating: boolean) => {
    if (isCreating) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
      }))
    } else {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
            }
          : null,
      )
    }
  }

  return (
    <div className={cn("flex flex-col gap-4 text-foreground", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {view === "month" &&
              currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            {view === "week" &&
              `Week of ${currentDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}`}
            {view === "day" &&
              currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            {view === "list" && "All Events"}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-8 w-8 bg-card border-border hover:bg-accent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="bg-card border-border hover:bg-accent">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-8 w-8 bg-card border-border hover:bg-accent">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Mobile: Select dropdown */}
          <div className="sm:hidden">
            <Select value={view} onValueChange={(value: string) => setView(value as "month" | "week" | "day" | "list")}>
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Month View
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Week View
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Day View
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className={cn("h-8 px-3 rounded-md", view === "month" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Calendar className="h-4 w-4" />
              <span className="ml-1.5">Month</span>
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className={cn("h-8 px-3 rounded-md", view === "week" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="ml-1.5">Week</span>
            </Button>
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className={cn("h-8 px-3 rounded-md", view === "day" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Clock className="h-4 w-4" />
              <span className="ml-1.5">Day</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className={cn("h-8 px-3 rounded-md", view === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="h-4 w-4" />
              <span className="ml-1.5">List</span>
            </Button>
          </div>

          <Button
            onClick={() => {
              setIsCreating(true)
              setIsDialogOpen(true)
            }}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-border text-foreground"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile: Horizontal scroll with full-length buttons */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Color Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap flex-shrink-0 bg-transparent border-border text-foreground">
                  <Filter className="h-4 w-4" />
                  Colors
                  {selectedColors.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary text-primary-foreground border-transparent">
                      {selectedColors.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
                <DropdownMenuLabel className="text-foreground">Filter by Color</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {colors.map((color) => (
                  <DropdownMenuCheckboxItem
                    key={color.value}
                    checked={selectedColors.includes(color.value)}
                    onCheckedChange={(checked: boolean) => {
                      setSelectedColors((prev) =>
                        checked ? [...prev, color.value] : prev.filter((c) => c !== color.value),
                      )
                    }}
                    className="text-muted-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded", color.bg)} />
                      {color.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tag Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap flex-shrink-0 bg-transparent border-border text-foreground">
                  <Filter className="h-4 w-4" />
                  Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary text-primary-foreground border-transparent">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
                <DropdownMenuLabel className="text-foreground">Filter by Tag</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={(checked: boolean) => {
                      setSelectedTags((prev) => (checked ? [...prev, tag] : prev.filter((t) => t !== tag)))
                    }}
                    className="text-muted-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap flex-shrink-0 bg-transparent border-border text-foreground">
                  <Filter className="h-4 w-4" />
                  Categories
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary text-primary-foreground border-transparent">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
                <DropdownMenuLabel className="text-foreground">Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked: boolean) => {
                      setSelectedCategories((prev) =>
                        checked ? [...prev, category] : prev.filter((c) => c !== category),
                      )
                    }}
                    className="text-muted-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 whitespace-nowrap flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Color Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent border-border text-foreground hover:bg-accent">
                <Filter className="h-4 w-4" />
                Colors
                {selectedColors.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1 bg-primary text-primary-foreground border-transparent">
                    {selectedColors.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
              <DropdownMenuLabel className="text-foreground">Filter by Color</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {colors.map((color) => (
                <DropdownMenuCheckboxItem
                  key={color.value}
                  checked={selectedColors.includes(color.value)}
                  onCheckedChange={(checked: boolean) => {
                    setSelectedColors((prev) =>
                      checked ? [...prev, color.value] : prev.filter((c) => c !== color.value),
                    )
                  }}
                  className="text-muted-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded", color.bg)} />
                    {color.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tag Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent border-border text-foreground hover:bg-accent">
                <Filter className="h-4 w-4" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1 bg-primary text-primary-foreground border-transparent">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
              <DropdownMenuLabel className="text-foreground">Filter by Tag</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={(checked: boolean) => {
                    setSelectedTags((prev) => (checked ? [...prev, tag] : prev.filter((t) => t !== tag)))
                  }}
                  className="text-muted-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent border-border text-foreground hover:bg-accent">
                <Filter className="h-4 w-4" />
                Categories
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1 bg-primary text-primary-foreground border-transparent">
                    {selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
              <DropdownMenuLabel className="text-foreground">Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={(checked: boolean) => {
                    setSelectedCategories((prev) =>
                      checked ? [...prev, category] : prev.filter((c) => c !== category),
                    )
                  }}
                  className="text-muted-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedColors.map((colorValue) => {
            const color = getColorClasses(colorValue)
            return (
              <Badge key={colorValue} variant="secondary" className="gap-1 bg-accent text-accent-foreground border-transparent">
                <div className={cn("h-2 w-2 rounded-full", color.bg)} />
                {color.name}
                <button
                  onClick={() => setSelectedColors((prev) => prev.filter((c) => c !== colorValue))}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 bg-accent text-accent-foreground border-transparent">
              {tag}
              <button
                onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1 bg-accent text-accent-foreground border-transparent">
              {category}
              <button
                onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== category))}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Calendar Views - Pass filteredEvents instead of events */}
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsCreating(false)
            setIsDialogOpen(true)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsCreating(false)
            setIsDialogOpen(true)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsCreating(false)
            setIsDialogOpen(true)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "list" && (
        <ListView
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsCreating(false)
            setIsDialogOpen(true)
          }}
          getColorClasses={getColorClasses}
        />
      )}

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-background border-border text-foreground p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold">{isCreating ? "Create Event" : "Event Details"}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {isCreating ? "Add a new event to your community calendar" : "View and edit event details"}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-2 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Title</Label>
              <Input
                id="title"
                value={isCreating ? newEvent.title : selectedEvent?.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (isCreating) {
                    setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                  } else {
                    setSelectedEvent((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                }}
                placeholder="Enter event title..."
                className="bg-muted border-border text-foreground focus:ring-primary/50 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Description</Label>
              <Textarea
                id="description"
                value={isCreating ? newEvent.description : selectedEvent?.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  if (isCreating) {
                    setNewEvent((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  } else {
                    setSelectedEvent((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                }}
                placeholder="Add more details about this event..."
                rows={2}
                className="bg-muted border-border text-foreground focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
              {/* Start Time Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-primary" />
                  <Label className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest">Starts</Label>
                </div>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left bg-muted border-border text-foreground h-10 hover:bg-accent px-2.5">
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[11px] font-bold text-primary">
                          {format(isCreating ? (newEvent.startTime || new Date()) : (selectedEvent?.startTime || new Date()), "MMM d, yyyy")}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {format(isCreating ? (newEvent.startTime || new Date()) : (selectedEvent?.startTime || new Date()), "HH:mm")}
                        </span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-none bg-transparent" align="start" side="bottom">
                    <DateTimePicker 
                      value={isCreating ? newEvent.startTime : selectedEvent?.startTime}
                      onChange={(date) => {
                        if (isCreating) {
                          setNewEvent(prev => ({ ...prev, startTime: date }));
                        } else {
                          setSelectedEvent(prev => prev ? { ...prev, startTime: date } : null);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Time Section */}
              <div className="space-y-2 border-l border-border pl-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <Label className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest">Ends</Label>
                </div>
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left bg-muted border-border text-foreground h-10 hover:bg-accent px-2.5">
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[11px] font-bold text-foreground">
                          {format(isCreating ? (newEvent.endTime || new Date()) : (selectedEvent?.endTime || new Date()), "MMM d, yyyy")}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {format(isCreating ? (newEvent.endTime || new Date()) : (selectedEvent?.endTime || new Date()), "HH:mm")}
                        </span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-none bg-transparent" align="end" side="bottom">
                    <DateTimePicker 
                      value={isCreating ? newEvent.endTime : selectedEvent?.endTime}
                      onChange={(date) => {
                        if (isCreating) {
                          setNewEvent(prev => ({ ...prev, endTime: date }));
                        } else {
                          setSelectedEvent(prev => prev ? { ...prev, endTime: date } : null);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest">Category</Label>
                <Select
                  value={isCreating ? newEvent.category : selectedEvent?.category}
                  onValueChange={(value: string) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, category: value }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, category: value } : null))
                  }
                >
                  <SelectTrigger id="category" className="bg-muted border-border text-foreground h-10">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-foreground focus:bg-accent text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest">Color</Label>
                <Select
                  value={isCreating ? newEvent.color : selectedEvent?.color}
                  onValueChange={(value: string) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, color: value }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, color: value } : null))
                  }
                >
                  <SelectTrigger id="color" className="bg-muted border-border text-foreground h-10">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="text-foreground focus:bg-accent text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", color.bg)} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5 flex-1">
                <Label className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest mb-2 block">Tags</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent h-10">
                      <div className="flex gap-1 overflow-hidden">
                        {(isCreating ? newEvent.tags : selectedEvent?.tags)?.length ? (
                          (isCreating ? newEvent.tags : selectedEvent?.tags)?.map(t => (
                            <Badge key={t} className="bg-primary text-primary-foreground border-transparent text-[9px] h-4 px-1.5">{t}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Add tags...</span>
                        )}
                      </div>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] bg-popover border-border">
                    <DropdownMenuLabel className="text-foreground text-xs">Select Tags</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {availableTags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={(isCreating ? newEvent.tags : selectedEvent?.tags)?.includes(tag)}
                        onCheckedChange={() => toggleTag(tag, isCreating)}
                        className="text-muted-foreground focus:bg-accent focus:text-foreground text-xs"
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0 sm:min-w-[140px]">
                <Label className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest mb-1">Visibility</Label>
                <div className="flex items-center gap-2 h-10 px-3 bg-muted rounded-md border border-border">
                  <input 
                    type="checkbox" 
                    id="publicEvent"
                    checked={isCreating ? newEvent.publicEvent : selectedEvent?.publicEvent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.checked;
                        if (isCreating) {
                            setNewEvent(prev => ({ ...prev, publicEvent: val }));
                        } else {
                            setSelectedEvent(prev => prev ? { ...prev, publicEvent: val } : null);
                        }
                    }}
                    className="w-3.5 h-3.5 rounded border-border bg-background accent-primary cursor-pointer"
                  />
                  <Label htmlFor="publicEvent" className="cursor-pointer text-[10px] text-foreground font-medium">
                    {isAdmin ? "Make Public" : "Request Public"}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/50 p-4 border-t border-border">
            {!isCreating && (
              <Button variant="destructive" onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)} className="bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 h-9 text-xs">
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                className="border-border text-muted-foreground hover:text-foreground hover:bg-accent h-9 text-xs px-4"
                onClick={() => {
                  setIsDialogOpen(false)
                  setIsCreating(false)
                  setSelectedEvent(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={isCreating ? handleCreateEvent : handleUpdateEvent} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 text-xs px-6 shadow-lg shadow-primary/20 transition-all active:scale-95">
                {isCreating ? (isAdmin ? "Create Event" : "Submit Request") : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// EventCard component with hover effect
function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = "default",
}: {
  event: Event
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  getColorClasses: (color: string) => { bg: string; text: string }
  variant?: "default" | "compact" | "detailed"
}) {
  const [isHovered, setIsHovered] = useState(false)
  const colorClasses = getColorClasses(event.color)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDuration = () => {
    const diff = event.endTime.getTime() - event.startTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (variant === "compact") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer"
      >
        <div
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium transition-all duration-300",
            colorClasses.bg,
            "text-white truncate animate-in fade-in slide-in-from-top-1",
            isHovered && "scale-105 shadow-lg z-10",
          )}
        >
          {event.title}
        </div>
        {isHovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border-2 p-3 shadow-xl bg-popover border-border">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight text-foreground">{event.title}</h4>
                  <div className={cn("h-3 w-3 rounded-full flex-shrink-0", colorClasses.bg)} />
                </div>
                {event.description && <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-[10px] h-5 bg-accent text-accent-foreground border-transparent">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px] h-5 border-border text-muted-foreground">
                      {tag}
                    </Badge>
                  ))}
                  {event.publicEvent && (
                    <Badge className="text-[10px] h-5 bg-primary/20 text-primary border-transparent font-bold">
                      Public
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variant === "detailed") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "cursor-pointer rounded-lg p-3 transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-2",
          isHovered && "scale-[1.03] shadow-2xl ring-2 ring-primary-foreground/50",
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description && <div className="mt-1 text-sm opacity-90 line-clamp-2">{event.description}</div>}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
        {(isHovered || event.publicEvent) && (
          <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            {event.category && (
              <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground border-transparent">
                {event.category}
              </Badge>
            )}
            {event.publicEvent && (
              <Badge className="text-xs bg-primary text-primary-foreground border-transparent font-bold">
                Public
              </Badge>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-1",
          isHovered && "scale-105 shadow-lg z-10",
        )}
      >
        <div className="truncate">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 p-4 shadow-xl bg-popover border-border">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight text-foreground">{event.title}</h4>
                <div className={cn("h-4 w-4 rounded-full flex-shrink-0", colorClasses.bg)} />
              </div>
              {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground border-transparent">
                      {event.category}
                    </Badge>
                  )}
                  {event.publicEvent && (
                    <Badge className="text-xs bg-primary/20 text-primary border-transparent font-bold">
                      Public
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const days = []
  const currentDay = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  return (
    <Card className="overflow-hidden bg-card border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="border-r border-border p-2 text-center text-xs font-bold last:border-r-0 sm:text-sm text-muted-foreground uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-1 transition-colors last:border-r-0 sm:min-h-[120px] sm:p-2",
                !isCurrentMonth && "bg-muted/30",
                "hover:bg-accent/50",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
            >
              <div
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs sm:h-7 sm:w-7 sm:text-sm",
                  isToday && "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20",
                  !isToday && (isCurrentMonth ? "text-foreground" : "text-muted-foreground opacity-30")
                )}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 4).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                  />
                ))}
                {dayEvents.length > 4 && (
                  <div className="text-[10px] text-muted-foreground sm:text-xs pl-1 font-medium">+{dayEvents.length - 4} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Week View Component
function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      const eventHour = eventDate.getHours()
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventHour === hour
      )
    })
  }

  return (
    <Card className="overflow-auto bg-card border-border scrollbar-thin scrollbar-thumb-border">
      <div className="grid grid-cols-8 border-b border-border bg-muted/50 sticky top-0 z-10">
        <div className="border-r border-border p-2 text-center text-xs font-bold sm:text-sm text-muted-foreground uppercase tracking-tighter">Time</div>
        {weekDays.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-border p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm",
                isToday && "bg-primary/5"
              )}
            >
              <div className={cn("hidden sm:block", isToday ? "text-primary font-bold" : "text-foreground")}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={cn("sm:hidden", isToday ? "text-primary font-bold" : "text-foreground")}>
                {day.toLocaleDateString("en-US", { weekday: "narrow" })}
              </div>
              <div className={cn("text-[10px] sm:text-xs", isToday ? "text-primary/80" : "text-muted-foreground")}>
                {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div
              className="border-b border-r border-border p-1 text-[10px] text-muted-foreground text-center font-medium bg-muted/30"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour)
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-[60px] border-b border-r border-border p-0.5 transition-colors hover:bg-accent/50 last:border-r-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        getColorClasses={getColorClasses}
                        variant="default"
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  )
}

// Day View Component
function DayView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      const eventHour = eventDate.getHours()
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventHour === hour
      )
    })
  }

  return (
    <Card className="overflow-auto bg-card border-border scrollbar-thin scrollbar-thumb-border">
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)
          return (
            <div
              key={hour}
              className="flex border-b border-border last:border-b-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(currentDate, hour)}
            >
              <div className="w-16 flex-shrink-0 border-r border-border p-3 text-xs text-muted-foreground font-bold bg-muted/30 text-center">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="min-h-[80px] flex-1 p-2 transition-colors hover:bg-accent/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {hourEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventClick={onEventClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      getColorClasses={getColorClasses}
                      variant="detailed"
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// List View Component
function ListView({
  events,
  onEventClick,
  getColorClasses,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  const groupedEvents = sortedEvents.reduce(
    (acc, event) => {
      const dateKey = event.startTime.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  return (
    <Card className="p-3 sm:p-6 bg-card border-border">
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-4">
               <h3 className="text-sm font-bold text-primary uppercase tracking-widest">{date}</h3>
               <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-3">
              {dateEvents.map((event) => {
                const colorClasses = getColorClasses(event.color)
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="group cursor-pointer rounded-xl border border-border bg-muted/50 p-4 transition-all hover:bg-accent/50 hover:border-border hover:shadow-xl hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("mt-1.5 h-3 w-3 rounded-full shadow-lg", colorClasses.bg)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-bold text-base group-hover:text-primary transition-colors text-foreground">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            {event.publicEvent && (
                               <Badge className="bg-primary text-primary-foreground border-transparent font-bold">Public</Badge>
                            )}
                            {event.category && (
                              <Badge variant="secondary" className="bg-accent text-accent-foreground border-transparent">
                                {event.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            <span className="font-medium">
                              {event.startTime.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {event.endTime.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {event.tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="h-5 border-border text-muted-foreground font-normal">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {sortedEvents.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Calendar className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground font-medium">No events found in this period</p>
          </div>
        )}
      </div>
    </Card>
  )
}
