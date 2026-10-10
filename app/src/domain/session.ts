import type { Session, SessionExercise, SetResult } from './records'
import type { Routine, Workout } from './types'
import { toKgTotal } from './units'

/** Lo que el usuario va escribiendo durante el entreno (texto de los campos). Se guarda solo, para no perderlo. */
export interface SetDraft {
  reps: string
  weight: string
  rir: string
  done: boolean
  at?: string
}

export interface WorkoutDraft {
  routineId: string
  workoutId: string
  startedAt: string
  /** Series por id de ejercicio, en el orden del plan. */
  sets: Record<string, SetDraft[]>
}

export function initDraft(workout: Workout, routineId: string, now: string): WorkoutDraft {
  const sets: WorkoutDraft['sets'] = {}
  for (const ex of workout.exercises)
    sets[ex.id] = ex.sets.map((s) => ({
      reps: String(s.reps),
      weight: String(s.weight),
      rir: s.rir == null ? '' : String(s.rir),
      done: false,
    }))
  return { routineId, workoutId: workout.id, startedAt: now, sets }
}

type Parsed = { ok: true; reps: number; weight: number; rir: number | null } | { ok: false; error: string }

export function parseSet(d: SetDraft): Parsed {
  const reps = Number(d.reps)
  if (d.reps.trim() === '' || !Number.isInteger(reps) || reps < 0 || reps > 500) return { ok: false, error: 'las repeticiones deben ser un entero de 0 a 500' }
  const weight = Number(d.weight.replace(',', '.'))
  if (d.weight.trim() === '' || !Number.isFinite(weight) || weight < 0 || weight > 2000) return { ok: false, error: 'el peso debe ser un número de 0 a 2000 (0 = peso corporal)' }
  let rir: number | null = null
  if (d.rir.trim() !== '') {
    const n = Number(d.rir)
    if (!Number.isInteger(n) || n < 0 || n > 10) return { ok: false, error: 'el RIR debe ser un entero de 0 a 10' }
    rir = n
  }
  return { ok: true, reps, weight, rir }
}

export function buildSession(
  routine: Routine,
  workout: Workout,
  draft: WorkoutDraft,
  now: string,
  makeId: () => string,
): { ok: true; session: Session } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const exercises: SessionExercise[] = []
  let totalSets = 0
  let volume = 0

  for (const ex of workout.exercises) {
    const rows = draft.sets[ex.id] ?? []
    const sets: SetResult[] = []
    rows.forEach((row, i) => {
      if (!row.done) return
      const p = parseSet(row)
      if (!p.ok) {
        errors.push(`${ex.name}, serie ${i + 1}: ${p.error}`)
        return
      }
      const planned = ex.sets[i]
      sets.push({
        setNum: i + 1,
        target: { reps: planned?.reps ?? p.reps, weight: planned?.weight ?? p.weight, rir: planned?.rir ?? null },
        actual: { reps: p.reps, weight: p.weight, rir: p.rir },
        at: row.at ?? now,
      })
      totalSets++
      volume += toKgTotal(p.weight, ex.unit) * p.reps
    })
    // Un ejercicio sin series hechas no aparece en la sesión: así se detecta que se saltó.
    if (sets.length) exercises.push({ exerciseId: ex.id, name: ex.name, unit: ex.unit, muscles: ex.muscles, sets })
  }

  if (errors.length === 0 && totalSets === 0) errors.push('Marca al menos una serie como hecha antes de terminar.')
  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    session: {
      id: makeId(),
      routineId: routine.id,
      routineName: routine.name,
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: draft.startedAt,
      finishedAt: now,
      durationSec: Math.max(0, Math.round((Date.parse(now) - Date.parse(draft.startedAt)) / 1000)),
      totalVolumeKg: Math.round(volume * 10) / 10,
      totalSets,
      exercises,
    },
  }
}
