/**
 * Validador de volumen semanal. Es la defensa en código del caso 7: el modelo contaba mal las series
 * y justificaba huecos con excusas inventadas. Aquí se cuenta con código, no con el modelo.
 *
 * Reglas (referencias del coach: principios.md):
 *  - Series directas = solo músculos con rol `primary`; el abdomen no se cuenta (no existe `abs`).
 *  - Rango de trabajo: 10–20 series por músculo por semana. Los límites son Práctica, no una regla fija;
 *    la tendencia (más series, más crecimiento con rendimientos decrecientes) es Evidencia.
 *  - Menos de ~4 series semanales queda por debajo de la dosis mínima efectiva (Pelland 2024).
 *  - 6–10 series por músculo por sesión es el rango de trabajo (certeza baja, las fuentes discrepan).
 *  - Las series de calentamiento (`warmup`) no cuentan como volumen de trabajo.
 *  - Se asume que cada workout de la rutina se hace una vez por semana.
 */
import { MUSCLES, MUSCLE_LABEL, type MuscleKey } from './muscles'
import type { Exercise, Workout } from './types'

export const VOLUME_RANGE = { min: 10, max: 20, minEffective: 4, perSessionMax: 10 } as const

export type VolumeLevel = 'ok' | 'low' | 'alert' | 'high'

export interface VolumeFinding {
  muscle: MuscleKey
  label: string
  sets: number
  level: VolumeLevel
  message: string
}

export interface SessionFinding {
  workout: string
  muscle: MuscleKey
  label: string
  sets: number
  message: string
}

export interface VolumeReport {
  byMuscle: Record<MuscleKey, number>
  findings: VolumeFinding[]
  sessionFindings: SessionFinding[]
  /** true si ningún músculo queda en alerta (<4) ni por encima de 20; los "low" (4–9) son avisos. */
  withinRange: boolean
  /** Músculos que no están en 10–20, listos para mostrar o pasar al coach. */
  outOfRange: VolumeFinding[]
}

function countExercise(ex: Exercise): number {
  return ex.sets.filter((s) => s.reps > 0 && s.type !== 'warmup').length
}

function emptyCounts(): Record<MuscleKey, number> {
  return Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<MuscleKey, number>
}

/** Series directas por músculo en una lista de workouts (cada uno, una vez por semana). */
export function directSetsByMuscle(workouts: Workout[]): Record<MuscleKey, number> {
  const out = emptyCounts()
  for (const w of workouts)
    for (const ex of w.exercises) {
      const n = countExercise(ex)
      for (const m of ex.muscles) if (m.role === 'primary') out[m.key] += n
    }
  return out
}

function classify(sets: number): VolumeLevel {
  if (sets < VOLUME_RANGE.minEffective) return 'alert'
  if (sets < VOLUME_RANGE.min) return 'low'
  if (sets > VOLUME_RANGE.max) return 'high'
  return 'ok'
}

function messageFor(label: string, sets: number, level: VolumeLevel): string {
  switch (level) {
    case 'alert':
      return `${label}: ${sets} series directas por semana. Es menos que la dosis mínima efectiva (~4); casi no hay estímulo.`
    case 'low':
      return `${label}: ${sets} series directas por semana. Por debajo de 10 probablemente limita el crecimiento (rango de trabajo 10–20, empezando en 10–12).`
    case 'high':
      return `${label}: ${sets} series directas por semana. Pasadas ~20 el beneficio por serie es pequeño y suma fatiga.`
    default:
      return `${label}: ${sets} series directas por semana, dentro del rango de trabajo (10–20).`
  }
}

export function checkVolume(workouts: Workout[]): VolumeReport {
  const byMuscle = directSetsByMuscle(workouts)
  const findings: VolumeFinding[] = MUSCLES.map((muscle) => {
    const sets = byMuscle[muscle]
    const level = classify(sets)
    const label = MUSCLE_LABEL[muscle]
    return { muscle, label, sets, level, message: messageFor(label, sets, level) }
  })

  const sessionFindings: SessionFinding[] = []
  for (const w of workouts) {
    const per = directSetsByMuscle([w])
    for (const muscle of MUSCLES) {
      if (per[muscle] > VOLUME_RANGE.perSessionMax) {
        const label = MUSCLE_LABEL[muscle]
        sessionFindings.push({
          workout: w.name,
          muscle,
          label,
          sets: per[muscle],
          message: `${w.name}: ${per[muscle]} series directas de ${label.toLowerCase()} en una sesión. El rango de trabajo es 6–10 por sesión (certeza baja: las fuentes discrepan); repartir en más sesiones suele ser preferible.`,
        })
      }
    }
  }

  const outOfRange = findings.filter((f) => f.level !== 'ok')
  const withinRange = findings.every((f) => f.level === 'ok' || f.level === 'low')
  return { byMuscle, findings, sessionFindings, withinRange, outOfRange }
}
