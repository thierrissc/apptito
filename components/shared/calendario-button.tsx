'use client'

import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CalendarioButton() {
  return (
    <Button variant="ghost" size="icon" className="h-10 w-10">
      <CalendarDays className="h-5 w-5" />
      <span className="sr-only">Calendário</span>
    </Button>
  )
}
