import { MapPin } from 'lucide-react'

interface GeoFieldProps {
  lat: number | null
  lng: number | null
}

export function GeoField({ lat, lng }: GeoFieldProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-input)] border border-white/10 bg-[var(--navy-mid)]">
      <MapPin className="w-4 h-4 text-[var(--signal)] shrink-0" aria-hidden="true" />
      {lat !== null && lng !== null ? (
        <span className="text-sm text-[var(--muted)] font-['DM_Sans'] font-mono">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
      ) : (
        <span className="text-sm text-[var(--muted)] font-['DM_Sans'] italic">
          Obteniendo ubicacion...
        </span>
      )}
    </div>
  )
}
