"use client"

import * as React from "react"
import { Calendar } from "./calendar"
import { Button } from "./button"
import { cn } from "../../lib/utils"
import { format, setHours, setMinutes } from "date-fns"
import { Clock } from "lucide-react"

export interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date) => void
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value || new Date())
  
  // Time slots from 00:00 to 23:45 every 15 mins
  const timeSlots = Array.from({ length: 96 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  })

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return
    
    // Preserve current time if existing
    const baseDate = date || new Date()
    const hours = baseDate.getHours()
    const minutes = baseDate.getMinutes()
    
    const updatedDate = setMinutes(setHours(newDate, hours), minutes)
    setDate(updatedDate)
    onChange?.(updatedDate)
  }

  const handleTimeSelect = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number)
    const baseDate = date || new Date()
    const updatedDate = setMinutes(setHours(baseDate, h), m)
    setDate(updatedDate)
    onChange?.(updatedDate)
  }

  const selectedTime = date ? format(date, "HH:mm") : null

  return (
    <div className="flex flex-col md:flex-row bg-card rounded-lg overflow-hidden border border-border shadow-2xl">
      <div className="p-1.5 border-r border-border">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className="bg-transparent"
        />
      </div>
      <div className="flex flex-col w-full md:w-20 bg-muted/30">
        <div className="p-2 border-b border-border flex items-center justify-center gap-2 text-muted-foreground font-bold text-[9px] uppercase tracking-widest bg-muted/50">
          <Clock className="h-2.5 w-2.5" />
          <span>Time</span>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[220px] p-1 no-scrollbar">
          <div className="grid grid-cols-4 md:grid-cols-1 gap-1">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant="ghost"
                size="sm"
                onClick={() => handleTimeSelect(time)}
                className={cn(
                  "h-7 text-[10px] justify-center font-medium transition-colors px-1",
                  selectedTime === time 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
