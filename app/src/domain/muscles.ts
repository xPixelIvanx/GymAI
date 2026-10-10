/** Lista CERRADA de músculos (la misma que usa la Skill y los archivos de importación). No existe `abs`. */
export const MUSCLES = [
  'chest',
  'lats',
  'upperback',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
] as const

export type MuscleKey = (typeof MUSCLES)[number]

export const MUSCLE_LABEL: Record<MuscleKey, string> = {
  chest: 'Pecho',
  lats: 'Dorsales',
  upperback: 'Espalda alta',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quads: 'Cuádriceps',
  hamstrings: 'Isquiotibiales',
  glutes: 'Glúteos',
  calves: 'Pantorrillas',
}

/** Claves antiguas que la app siempre aceptó al importar. Cualquier otra clave se rechaza. */
const LEGACY_ALIAS: Record<string, MuscleKey> = {
  back: 'upperback',
  lowerback: 'upperback',
  erector: 'upperback',
  traps: 'upperback',
  forearms: 'biceps',
}

export function normalizeMuscleKey(raw: unknown): MuscleKey | null {
  if (typeof raw !== 'string') return null
  const k = raw.trim().toLowerCase()
  if ((MUSCLES as readonly string[]).includes(k)) return k as MuscleKey
  return LEGACY_ALIAS[k] ?? null
}
