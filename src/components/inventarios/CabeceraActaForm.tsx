export interface CabeceraActa {
  agencia_aduanas: string
  codigo_agencia: string
  representante_legal: string
  mandato: string
  deposito: string
  direccion_deposito: string
  documento_transporte: string
  manifiesto: string
  fecha_manifiesto: string
  transportadora: string
  consignatario: string
  no_bultos: number | null
  peso: number | null
  precintos_retira: string
  precintos_coloca: string
}

interface CabeceraActaFormProps {
  valores: Partial<CabeceraActa>
  onChange: (campo: keyof CabeceraActa, valor: string | number | null) => void
}

interface FieldConfig {
  campo: keyof CabeceraActa
  label: string
  placeholder?: string
  type?: 'text' | 'number' | 'date'
  colSpan?: boolean
}

interface SeccionFormProps {
  titulo: string
  campos: FieldConfig[]
  valores: Partial<CabeceraActa>
  onChange: (campo: keyof CabeceraActa, valor: string | number | null) => void
}

function SeccionForm({ titulo, campos, valores, onChange }: SeccionFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-[10px] uppercase tracking-widest text-white/30 font-['DM_Sans'] pb-1 border-b border-white/5">
        {titulo}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campos.map(({ campo, label, placeholder, type = 'text', colSpan }) => {
          const rawValue = valores[campo]
          const value = rawValue == null ? '' : String(rawValue)

          return (
            <div key={campo} className={colSpan ? 'sm:col-span-2' : ''}>
              <label className="block text-[10px] uppercase tracking-wide text-white/40 font-['DM_Sans'] mb-1">
                {label}
              </label>
              <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={e => {
                  if (type === 'number') {
                    const num = parseFloat(e.target.value)
                    onChange(campo, isNaN(num) ? null : num)
                  } else {
                    onChange(campo, e.target.value)
                  }
                }}
                className="w-full bg-[var(--navy)] border border-white/10 rounded-[var(--radius-input)] px-3 py-2 text-[var(--off-white)] placeholder-white/20 text-sm font-['DM_Sans'] focus:outline-none focus:border-[var(--signal)]/50 transition-colors"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const seccionAgencia: FieldConfig[] = [
  { campo: 'agencia_aduanas',    label: 'Agencia de Aduanas', placeholder: 'Nombre de la agencia', colSpan: true },
  { campo: 'codigo_agencia',     label: 'Código',             placeholder: 'Código DIAN' },
  { campo: 'representante_legal',label: 'Representante Legal',placeholder: 'Nombre completo' },
  { campo: 'mandato',            label: 'Mandato',            placeholder: 'No. de mandato' },
]

const seccionDeposito: FieldConfig[] = [
  { campo: 'deposito',           label: 'Depósito',           placeholder: 'Nombre del depósito' },
  { campo: 'direccion_deposito', label: 'Dirección',          placeholder: 'Dirección completa', colSpan: true },
]

const seccionTransporte: FieldConfig[] = [
  { campo: 'documento_transporte', label: 'Doc. de Transporte', placeholder: 'BL / AWB / Carta de porte' },
  { campo: 'manifiesto',           label: 'Manifiesto',         placeholder: 'No. manifiesto' },
  { campo: 'fecha_manifiesto',     label: 'Fecha Manifiesto',   type: 'date' },
  { campo: 'transportadora',       label: 'Transportadora',     placeholder: 'Nombre transportadora' },
  { campo: 'consignatario',        label: 'Consignatario',      placeholder: 'Empresa / Persona', colSpan: true },
]

const seccionMercancia: FieldConfig[] = [
  { campo: 'no_bultos',        label: 'No. Bultos',         type: 'number', placeholder: '0' },
  { campo: 'peso',             label: 'Peso (kg)',          type: 'number', placeholder: '0.00' },
  { campo: 'precintos_retira', label: 'Precintos Retira',   placeholder: 'Nos. de precintos que se retiran' },
  { campo: 'precintos_coloca', label: 'Precintos Coloca',   placeholder: 'Nos. de precintos que se colocan' },
]

export function CabeceraActaForm({ valores, onChange }: CabeceraActaFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <SeccionForm titulo="Agencia" campos={seccionAgencia} valores={valores} onChange={onChange} />
      <SeccionForm titulo="Depósito" campos={seccionDeposito} valores={valores} onChange={onChange} />
      <SeccionForm titulo="Transporte" campos={seccionTransporte} valores={valores} onChange={onChange} />
      <SeccionForm titulo="Mercancía" campos={seccionMercancia} valores={valores} onChange={onChange} />
    </div>
  )
}
