'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FiltroButton() {
  return (
    <Button variant="ghost" size="icon" className="h-10 w-10">
      <SlidersHorizontal className="h-5 w-5" />
      <span className="sr-only">Filtros</span>
    </Button>
  )
}
