import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin, Loader2 } from 'lucide-react'

// Leaflet marker icon — bypass the Vite asset URL issue usando CDN
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export interface LatLng {
  lat: number
  lng: number
}

interface LocationPickerProps {
  value: LatLng | null
  onChange: (coords: LatLng) => void
}

const COLOMBIA_CENTER: [number, number] = [4.5709, -74.2973]

// Mueve el mapa cuando el usuario selecciona una sugerencia
function FlyController({ target }: { target: LatLng | null }) {
  const map = useMap()
  const prev = useRef<LatLng | null>(null)
  useEffect(() => {
    if (target && target !== prev.current) {
      prev.current = target
      map.flyTo([target.lat, target.lng], 16, { duration: 1 })
    }
  }, [target, map])
  return null
}

// Captura clicks en el mapa
function ClickHandler({ onMove }: { onMove: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMove({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setSearching(true)
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('q', q)
      url.searchParams.set('format', 'json')
      url.searchParams.set('limit', '5')
      url.searchParams.set('countrycodes', 'co')
      const res = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'es' },
      })
      const data: NominatimResult[] = await res.json()
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch {
      // error silencioso — el usuario puede igualmente hacer clic en el mapa
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Cierra sugerencias si se hace clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function selectSuggestion(result: NominatimResult) {
    const coords: LatLng = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    setFlyTarget(coords)
    onChange(coords)
    setQuery(result.display_name.split(',').slice(0, 2).join(','))
    setShowSuggestions(false)
    setSuggestions([])
  }

  function handleMapMove(coords: LatLng) {
    onChange(coords)
    setFlyTarget(null) // no volar si el usuario mueve el marcador manualmente
  }

  const markerPos: [number, number] | null = value ? [value.lat, value.lng] : null
  const initialCenter: [number, number] = value ? [value.lat, value.lng] : COLOMBIA_CENTER
  const initialZoom = value ? 16 : 6

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Buscar dirección, barrio o lugar..."
            autoComplete="off"
            className="w-full pl-9 pr-9 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] rounded-[var(--radius-input)] text-sm text-[var(--off-white)] font-dm outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all placeholder:text-[var(--muted)]"
          />
          {searching && (
            <Loader2 className="absolute right-3 w-4 h-4 text-[var(--muted)] animate-spin pointer-events-none" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="absolute z-[9999] w-full mt-1 glass-card overflow-hidden divide-y divide-white/5"
          >
            {suggestions.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(r) }}
                  className="w-full text-left px-4 py-2.5 flex items-start gap-2 hover:bg-white/5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[var(--signal)] shrink-0 mt-0.5" />
                  <span className="text-xs text-[var(--off-white)] font-dm line-clamp-2">
                    {r.display_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="rounded-[12px] overflow-hidden border border-[rgba(0,212,255,0.15)] h-64 relative z-0">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMove={handleMapMove} />
          <FlyController target={flyTarget} />
          {markerPos && (
            <Marker
              position={markerPos}
              icon={defaultIcon}
              draggable
              eventHandlers={{
                dragend(e) {
                  const ll = (e.target as L.Marker).getLatLng()
                  handleMapMove({ lat: ll.lat, lng: ll.lng })
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coords display */}
      <p className="text-xs font-mono text-right" style={{ color: 'var(--muted)' }}>
        {value
          ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`
          : 'Haz clic en el mapa o busca una dirección para colocar el marcador'}
      </p>
    </div>
  )
}
