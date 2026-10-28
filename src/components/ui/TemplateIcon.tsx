import {
  ClipboardList, HardHat, Construction, Megaphone, Wrench, Flame, TriangleAlert, Zap, FlaskConical,
  Truck, Package, Car, Stethoscope, Plug, Droplets, ShieldCheck, Hammer, Ruler, Shirt, Siren, Eye, Fuel,
  type LucideIcon,
} from 'lucide-react'

// Los formularios guardan un emoji elegido por el admin; en la interfaz se dibuja
// el pictograma equivalente en un único trazo (nunca el emoji de color).
const MAP: Record<string, LucideIcon> = {
  '🏗': Construction, '🚧': Construction, '🦺': HardHat, '👷': HardHat, '⛑': HardHat,
  '📣': Megaphone, '📢': Megaphone, '🧰': Wrench, '🔧': Wrench, '🛠': Wrench, '🔨': Hammer,
  '🧯': Flame, '🔥': Flame, '⚠': TriangleAlert, '⚡': Zap, '🧪': FlaskConical, '🚜': Truck, '🚚': Truck,
  '📦': Package, '🚗': Car, '🩺': Stethoscope, '🔌': Plug, '💧': Droplets, '🛡': ShieldCheck,
  '📏': Ruler, '🥽': Eye, '👁': Eye, '🚨': Siren, '⛽': Fuel, '👕': Shirt,
}

export function TemplateIcon({ icon, className = 'w-7 h-7' }: { icon?: string | null; className?: string }) {
  const key = icon ? Array.from(icon.replace(/️/g, ''))[0] : ''
  const Icon = (key && MAP[key]) || ClipboardList
  return <Icon className={className} aria-hidden="true" strokeWidth={2.25} />
}
