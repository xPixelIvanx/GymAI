/**
 * Paquetes de conocimiento del coach. Cada acción de la app carga solo lo que necesita:
 * el Skill (SKILL.md) siempre, una base común y los archivos propios de la acción.
 * (Mandar todo en cada mensaje pesaría ~37 000 tokens; así queda entre ~11 000 y ~17 000.)
 */
const RAW = import.meta.glob('./knowledge/**/*.{md,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export type CoachAction = 'chat' | 'review' | 'generate'

export const ACTION_LABEL: Record<CoachAction, string> = {
  chat: 'Preguntar al coach',
  review: 'Revisar mi progreso',
  generate: 'Crear rutina o programa',
}

const BASE = [
  'references/entrenamiento/principios.md',
  'references/nutricion/fases.md',
  'references/nutricion/fundamentos.md',
  'references/fuentes.md',
]

export const PACKS: Record<CoachAction, string[]> = {
  chat: [...BASE, 'references/entrenamiento/progresion-y-fatiga.md', 'references/entrenamiento/ejercicios.md', 'references/seguimiento-corporal.md'],
  review: [
    ...BASE,
    'references/informe-coach.md',
    'references/entrenamiento/progresion-y-fatiga.md',
    'references/seguimiento-corporal.md',
    'references/programas.md',
  ],
  generate: [
    ...BASE,
    'references/formatos-de-datos.md',
    'references/entrenamiento/ejercicios.md',
    'references/entrenamiento/programacion.md',
    'references/programas.md',
    'references/plantilla-programa.json',
  ],
}

export function knowledgeFile(path: string): string {
  const text = RAW[`./knowledge/${path}`]
  if (text === undefined) throw new Error(`Falta el archivo de conocimiento: ${path}`)
  return text
}

export const skillText = (): string => knowledgeFile('SKILL.md')

export interface Pack {
  files: string[]
  chars: number
  /** Estimación: ~3.5 caracteres por token en español. */
  approxTokens: number
}

export function describePack(action: CoachAction): Pack {
  const files = ['SKILL.md', ...PACKS[action]]
  const chars = files.reduce((n, f) => n + knowledgeFile(f).length, 0)
  return { files, chars, approxTokens: Math.round(chars / 3.5) }
}
