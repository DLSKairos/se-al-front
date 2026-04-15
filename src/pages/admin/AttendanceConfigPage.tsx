import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import api from '@/lib/api'
import { QK } from '@/lib/queryKeys'
import { AttendanceConfig } from '@/types'
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  useToast,
} from '@/components/ui'

interface ConfigForm {
  is_enabled: boolean
  standard_daily_hours: number
  night_shift_start: string
  night_shift_end: string
  sunday_surcharge: boolean
  holiday_surcharge: boolean
  custom_holidays: string[]
}

function ToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm text-[var(--off-white)] font-['DM_Sans'] font-medium cursor-pointer">
          {label}
        </label>
        {description && (
          <span className="text-xs text-[var(--muted)] font-['DM_Sans']">{description}</span>
        )}
      </div>
      <div className="relative shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <label
          htmlFor={id}
          className="w-11 h-6 bg-white/10 rounded-full cursor-pointer peer-checked:bg-[var(--signal)] transition-colors block"
        />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform pointer-events-none peer-checked:translate-x-5" />
      </div>
    </div>
  )
}

export default function AttendanceConfigPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [newHoliday, setNewHoliday] = useState('')
  const [form, setForm] = useState<ConfigForm>({
    is_enabled: false,
    standard_daily_hours: 8,
    night_shift_start: '22:00',
    night_shift_end: '06:00',
    sunday_surcharge: false,
    holiday_surcharge: false,
    custom_holidays: [],
  })

  const { data: config, isLoading, error } = useQuery({
    queryKey: QK.attendance.config(),
    queryFn: () =>
      api.get<AttendanceConfig>('/attendance/config').then((r) => r.data),
  })

  useEffect(() => {
    if (config) {
      setForm({
        is_enabled: config.is_enabled,
        standard_daily_hours: config.standard_daily_hours,
        night_shift_start: config.night_shift_start,
        night_shift_end: config.night_shift_end,
        sunday_surcharge: config.sunday_surcharge,
        holiday_surcharge: config.holiday_surcharge,
        custom_holidays: config.custom_holidays ?? [],
      })
    }
  }, [config])

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ConfigForm>) =>
      api.patch('/attendance/config', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.attendance.config() })
      toast.success('Configuración guardada correctamente')
    },
    onError: () => toast.error('Error al guardar la configuración'),
  })

  function addHoliday() {
    if (!newHoliday) return
    if (form.custom_holidays.includes(newHoliday)) {
      toast.warning('Esa fecha ya está en la lista')
      return
    }
    setForm((f) => ({
      ...f,
      custom_holidays: [...f.custom_holidays, newHoliday].sort(),
    }))
    setNewHoliday('')
  }

  function removeHoliday(date: string) {
    setForm((f) => ({
      ...f,
      custom_holidays: f.custom_holidays.filter((d) => d !== date),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  if (isLoading) return <LoadingSpinner label="Cargando configuración..." />
  if (error) return <ErrorMessage message="Error al cargar la configuración de asistencia" />

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--off-white)] font-['Syne']">
          Configuración de asistencia
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5 font-['DM_Sans']">
          Define las reglas para el cálculo de horas y recargos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Módulo habilitado */}
        <div className="glass-card p-5">
          <ToggleField
            id="is_enabled"
            label="Habilitar módulo de asistencia"
            description="Permite a los operarios registrar entradas y salidas"
            checked={form.is_enabled}
            onChange={(v) => setForm((f) => ({ ...f, is_enabled: v }))}
          />
        </div>

        {/* Horarios */}
        <div className="glass-card p-5 flex flex-col gap-5">
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            Horarios
          </h2>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="standard_daily_hours"
              className="text-sm text-[var(--muted)] font-['DM_Sans']"
            >
              Horas diarias estándar
            </label>
            <input
              id="standard_daily_hours"
              type="number"
              min={1}
              max={24}
              value={form.standard_daily_hours}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  standard_daily_hours: Number(e.target.value),
                }))
              }
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all w-32"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="night_shift_start"
                className="text-sm text-[var(--muted)] font-['DM_Sans']"
              >
                Inicio turno nocturno
              </label>
              <input
                id="night_shift_start"
                type="time"
                value={form.night_shift_start}
                onChange={(e) =>
                  setForm((f) => ({ ...f, night_shift_start: e.target.value }))
                }
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="night_shift_end"
                className="text-sm text-[var(--muted)] font-['DM_Sans']"
              >
                Fin turno nocturno
              </label>
              <input
                id="night_shift_end"
                type="time"
                value={form.night_shift_end}
                onChange={(e) =>
                  setForm((f) => ({ ...f, night_shift_end: e.target.value }))
                }
                className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Recargos */}
        <div className="glass-card p-5 flex flex-col gap-5">
          <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
            Recargos
          </h2>
          <ToggleField
            id="sunday_surcharge"
            label="Recargo dominical"
            description="Aplica recargo adicional en horas trabajadas los domingos"
            checked={form.sunday_surcharge}
            onChange={(v) => setForm((f) => ({ ...f, sunday_surcharge: v }))}
          />
          <div className="border-t border-white/5" />
          <ToggleField
            id="holiday_surcharge"
            label="Recargo festivos"
            description="Aplica recargo adicional en días festivos"
            checked={form.holiday_surcharge}
            onChange={(v) => setForm((f) => ({ ...f, holiday_surcharge: v }))}
          />
        </div>

        {/* Festivos personalizados */}
        <div className="glass-card p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-['Syne'] font-semibold text-[var(--off-white)] text-base">
              Festivos personalizados
            </h2>
            <p className="text-xs text-[var(--muted)] font-['DM_Sans'] mt-0.5">
              Agrega fechas adicionales que se tratarán como días festivos
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              aria-label="Fecha festivo"
              className="bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] px-4 py-3 text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addHoliday}
              disabled={!newHoliday}
            >
              <Plus className="w-4 h-4" />
              Añadir
            </Button>
          </div>

          {form.custom_holidays.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {form.custom_holidays.map((date) => (
                <li
                  key={date}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-[var(--off-white)] font-['DM_Sans']">
                    {new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHoliday(date)}
                    aria-label={`Eliminar festivo ${date}`}
                    className="text-[var(--muted)] hover:text-red-400 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)] font-['DM_Sans'] text-center py-3">
              Sin festivos personalizados
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={updateMutation.isPending}>
            Guardar configuración
          </Button>
        </div>
      </form>
    </div>
  )
}
