'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const presets = [
  { label: 'Hoje', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Esta Semana', getValue: () => ({ from: startOfWeek(new Date(), { locale: ptBR }), to: endOfWeek(new Date(), { locale: ptBR }) }) },
  { label: 'Este Mês', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Mês Passado', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Últimos 3 Meses', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) }) },
]

export function CalendarioFinanceiro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: dataInicio ? new Date(dataInicio) : undefined,
    to: dataFim ? new Date(dataFim) : undefined,
  })

  const hasDateFilter = dataInicio || dataFim

  function applyDateRange(from: Date | undefined, to: Date | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    
    if (from) {
      params.set('data_inicio', format(from, 'yyyy-MM-dd'))
    } else {
      params.delete('data_inicio')
    }
    
    if (to) {
      params.set('data_fim', format(to, 'yyyy-MM-dd'))
    } else {
      params.delete('data_fim')
    }
    
    router.push(`/dashboard/financeiro?${params.toString()}`)
    setOpen(false)
  }

  function clearDateFilter() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('data_inicio')
    params.delete('data_fim')
    setDateRange({ from: undefined, to: undefined })
    router.push(`/dashboard/financeiro?${params.toString()}`)
  }

  function handlePreset(preset: typeof presets[0]) {
    const { from, to } = preset.getValue()
    setDateRange({ from, to })
    applyDateRange(from, to)
  }

  const displayText = dateRange.from 
    ? dateRange.to 
      ? `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
      : format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size={hasDateFilter ? "default" : "icon"} className={hasDateFilter ? "gap-2" : "h-10 w-10"}>
          <CalendarDays className="h-5 w-5" />
          {displayText && <span className="text-sm">{displayText}</span>}
          <span className="sr-only">Calendário</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r border-border p-3 space-y-1">
            <Label className="text-xs text-muted-foreground px-2">Períodos</Label>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm bg-transparent"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
            {hasDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-destructive bg-transparent"
                onClick={clearDateFilter}
              >
                Limpar
              </Button>
            )}
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange({ from: range?.from, to: range?.to })
                if (range?.from && range?.to) {
                  applyDateRange(range.from, range.to)
                }
              }}
              locale={ptBR}
              numberOfMonths={1}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
