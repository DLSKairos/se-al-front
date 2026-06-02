# Inventarios Feature — Pendientes de implementación

## 1. Generación del PDF del Acta con el layout original

### Concepto
El PDF de salida debe replicar el mismo documento que el admin subió al crear la plantilla. No es un layout hardcodeado en pdfmake — es el documento original rellenado con los datos de la sesión.

### Cómo funciona el flujo esperado

```
Admin sube "Acta de Inspección Previa.pdf"
  → IA extrae estructura: secciones, campos, posiciones, tablas
  → Se guarda source_file_url en FormTemplate (ya implementado)
  → Se guarda la estructura extraída en FormTemplate.sections (ya implementado)

Inspector llena el acta en SEÑAL
  → Sesión queda en estado "firmado"

Admin/Sistema llama POST /inventarios/sesiones/:id/generar-pdf
  → Backend toma el source_file_url del template de referencia
  → Usa la estructura extraída para mapear los datos a las posiciones del documento original
  → Genera PDF que visualmente es idéntico al original pero con los datos reales
```

### Qué implementar en el backend

**Opción A — pdfmake con estructura extraída (recomendada)**

El servicio `generarPdf` en `inventarios.service.ts` ya existe con un 202. Completarlo:

1. Recuperar la sesión completa con items, fotos y firmas
2. Leer la estructura del template de referencia (`source_file_url` + `sections`)
3. Usar la misma librería `pdfmake` ya instalada (`form-exports.service.ts`) para construir el documento replicando las secciones del original:
   - Página 1: cabecera operacional + tabla de ítems + observaciones + firmas
   - Página 2: tabla de sobrantes/faltantes
   - Páginas 3+: grid de fotos (inicio carga, fin carga, fotos por ítem)
4. Insertar las imágenes de firma como base64 en el PDF
5. Para las fotos: descargar desde Cloudinary, convertir a base64, insertar en grid

```typescript
// En inventarios.service.ts — reemplazar el stub actual:
async generarPdf(orgId: string, id: string): Promise<Buffer> {
  const sesion = await this.obtenerSesion(orgId, id);
  if (sesion.estado !== 'firmado' && sesion.estado !== 'cerrado') {
    throw new BadRequestException('La sesión debe estar firmada antes de generar el PDF');
  }
  return this.pdfBuilder.buildActaInspeccion(sesion);
}
```

**Opción B — pdf-lib para stamping sobre el original**

Si el documento original tiene campos de formulario PDF (AcroForm), usar `pdf-lib` para rellenarlos directamente:
```bash
npm install pdf-lib
```
Descargar el archivo original desde `source_file_url`, usar `pdf-lib` para mapear los valores a los campos por nombre. Más fiel al original pero requiere que el PDF tenga campos nombrados.

**Recomendación:** Opción A con pdfmake. El documento de referencia en el handoff tiene una estructura clara y repetible.

### Layout de referencia (del ACTA_INSPECCION_PREVIA.pdf)

```
Página 1:
  [LOGO] [TÍTULO: ACTA DE INSPECCIÓN PREVIA] [Código/Versión]
  Ciudad: ___  Fecha: ___

  Bloque cabecera (2 columnas):
    Agencia de Aduanas:          Código:
    Representante Legal:         Mandato:
    Depósito:                    Dirección:
    Doc. Transporte:             Manifiesto:       Fecha:
    Transportadora:              Consignatario:
    No. Bultos:   Peso:          Precintos retira: Coloca:

  Tabla de ítems:
    | # | Parte No | País | Descripción | Marca | Modelo | Serial | Cantidad |

  Observaciones: _______________

  Firmas (lado a lado):
    Representante Depósito        Representante Agencia
    Nombre: ___                   Nombre: ___
    [firma]                       [firma]

  Tabla accesorios (si hay):
    | Ítem | Parte No | País | Descripción | Marca | Modelo |

Página 2:
  Sobrantes y Faltantes:
    | Tipo | Ítem | Parte No | Descripción | Marca | Modelo | Serial | Cantidad |
  Visto Bueno Importador: ___
  Observaciones cierre: ___

Páginas 3+:
  Fotos Inicio de Carga: [grid 2x2]
  Fotos Fin de Carga:    [grid 2x2]
  Fotos por Ítem:        [grid con etiqueta "Ítem #N"]
```

### Modelo de datos faltante

`InventarioSession` no tiene referencia al template de origen. Agregar:

```prisma
// En InventarioSession (nueva migración requerida):
template_ref_url  String?   // URL del PDF de referencia que se subió
```

O mejor, vincular directamente al `FormTemplate` si se crea uno al importar el acta.

---

## 2. Sincronización Offline — IndexedDB + cola de subida

### Problema
Los inspectores trabajan en bodegas y puertos con WiFi inestable. Sin offline, si se cae el internet a mitad del llenado se pierde el trabajo.

### Arquitectura

```
NuevaActaPage
    │
    ├── onChange cualquier campo
    │       └── guardaEnIndexedDB(sessionDraft)  ← inmediato, sin red
    │
    ├── al tomar foto
    │       ├── guardaFotoEnIndexedDB(blob)      ← inmediato
    │       └── encolarSubida(foto)              ← intenta subir, si falla reencola
    │
    └── al retomar el acta
            └── cargaDesdexIndexedDB(sessionId) → pre-llena el formulario
```

### Tabla Dexie a crear

En `src/db/` (donde ya vive `gameProgress.ts`), crear `inventariosDraft.ts`:

```typescript
import Dexie, { Table } from 'dexie';

interface InventarioDraft {
  id: string;           // sessionId o 'new' si todavía no se creó en backend
  data: any;            // estado completo del formulario
  updatedAt: number;    // timestamp para saber si está desactualizado
  synced: boolean;      // si ya se sincronizó con el backend
}

interface FotoEnCola {
  id: string;           // uuid local
  sessionId: string;
  itemId?: string;
  tipo: string;
  blob: Blob;
  intentos: number;     // para backoff exponencial
  createdAt: number;
}

class InventariosDB extends Dexie {
  drafts!: Table<InventarioDraft>;
  fotoQueue!: Table<FotoEnCola>;

  constructor() {
    super('senal-inventarios');
    this.version(1).stores({
      drafts: 'id, synced, updatedAt',
      fotoQueue: 'id, sessionId, intentos',
    });
  }
}

export const inventariosDB = new InventariosDB();
```

### Hook `useInventarioDraft`

```typescript
// src/hooks/useInventarioDraft.ts
export function useInventarioDraft(sessionId: string | null) {
  const saveDraft = async (data: any) => {
    await inventariosDB.drafts.put({
      id: sessionId ?? 'new',
      data,
      updatedAt: Date.now(),
      synced: false,
    });
  };

  const loadDraft = async () => {
    return inventariosDB.drafts.get(sessionId ?? 'new');
  };

  const markSynced = async () => {
    if (!sessionId) return;
    await inventariosDB.drafts.update(sessionId, { synced: true });
  };

  return { saveDraft, loadDraft, markSynced };
}
```

### Cola de fotos — `useFotoQueue`

```typescript
// src/hooks/useFotoQueue.ts
export function useFotoQueue() {
  const encolar = async (sessionId: string, tipo: string, blob: Blob, itemId?: string) => {
    await inventariosDB.fotoQueue.add({
      id: crypto.randomUUID(),
      sessionId,
      itemId,
      tipo,
      blob,
      intentos: 0,
      createdAt: Date.now(),
    });
    procesarCola(); // intenta subir de inmediato
  };

  const procesarCola = async () => {
    if (!navigator.onLine) return;
    const pendientes = await inventariosDB.fotoQueue
      .where('intentos').below(3)
      .toArray();

    for (const foto of pendientes) {
      try {
        const file = new File([foto.blob], `foto-${foto.id}.jpg`, { type: 'image/jpeg' });
        await inventariosApi.subirFoto(foto.sessionId, foto.tipo, file, foto.itemId);
        await inventariosDB.fotoQueue.delete(foto.id);
      } catch {
        await inventariosDB.fotoQueue.update(foto.id, { intentos: foto.intentos + 1 });
      }
    }
  };

  // Escuchar cuando vuelve el internet
  useEffect(() => {
    window.addEventListener('online', procesarCola);
    return () => window.removeEventListener('online', procesarCola);
  }, []);

  return { encolar };
}
```

### Compresión de imágenes antes de guardar/subir

```typescript
// src/utils/compressImage.ts
export async function compressImage(file: File, maxPx = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

// Para envío a IA (resolución menor):
export const compressForIA = (file: File) => compressImage(file, 1024, 0.85);
// Para fotos de mercancía:
export const compressForStorage = (file: File) => compressImage(file, 1920, 0.8);
```

### Integración en NuevaActaPage

```typescript
// En NuevaActaPage — agregar:
const { saveDraft, loadDraft } = useInventarioDraft(sessionId);
const { encolar: encolarFoto } = useFotoQueue();

// Guardar draft en cada cambio de items/cabecera:
useEffect(() => {
  saveDraft({ cabecera, items, observaciones, pasoActual });
}, [cabecera, items, observaciones]);

// Al montar, intentar recuperar draft:
useEffect(() => {
  loadDraft().then((draft) => {
    if (draft && !draft.synced) {
      // Preguntar al usuario si quiere continuar el borrador
    }
  });
}, []);
```

### Banner de estado offline existente

El componente `SlowConnectionBanner` ya existe en `src/components/ui/`. Conectarlo en `NuevaActaPage`:

```tsx
<SlowConnectionBanner /> // ya detecta navigator.onLine y connection.effectiveType
```

---

## Checklist de implementación

### PDF del Acta
- [ ] Crear `InventariosPdfBuilder` service en el backend (`inventarios/inventarios-pdf.service.ts`)
- [ ] Implementar `buildActaInspeccion(sesion)` con pdfmake siguiendo el layout de referencia
- [ ] Agregar descarga de imágenes (firmas + fotos) para incrustarlas en el PDF
- [ ] Conectar en `inventarios.service.ts` `generarPdf()` (reemplazar el stub actual)
- [ ] Agregar endpoint en el controller que devuelva el buffer como `Content-Type: application/pdf`
- [ ] Agregar botón "Generar PDF" en `InventarioDetailPage.tsx` (frontend)

### Offline
- [ ] Crear `src/db/inventariosDraft.ts` con las tablas Dexie
- [ ] Crear `src/hooks/useInventarioDraft.ts`
- [ ] Crear `src/hooks/useFotoQueue.ts`
- [ ] Crear `src/utils/compressImage.ts`
- [ ] Integrar draft autosave en `NuevaActaPage` (debounce 2s)
- [ ] Agregar diálogo "Continuar borrador" al entrar a `/inventarios/nueva` si hay draft pendiente
- [ ] Conectar `SlowConnectionBanner` en `NuevaActaPage`
- [ ] Usar `compressForIA` en `ExtractorFactura` antes de enviar a `extraerFactura`
- [ ] Usar `compressForStorage` en `GaleriaFotos` antes de encolar la foto

---

*Documento generado por Kairos DLS Group S.A.S.*
