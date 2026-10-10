import { normalizeMuscleKey } from './muscles'
import type { Complexity, Exercise, PlannedSet, Routine, SetType, Workout } from './types'
import type { Unit } from './units'

type Json = Record<string, any>

/** Id nuevo. En el navegador y en Node 22 existe crypto.randomUUID(). */
export const newId = (): string => crypto.randomUUID()

const DEFAULT_REST_SECONDS = 120

/** Saca la rutina de un archivo: envuelta ({ routine }) o suelta (plantilla antigua). */
export function unwrapRoutine(data: unknown): Json {
  const d = data as Json
  if (d?.type === 'routine' && d.routine) return d.routine
  if (d?.routine && !d.workouts) return d.routine
  return d
}

/**
 * Convierte una rutina YA VALIDADA en el modelo interno. Asigna ids nuevos (los ids del archivo se ignoran:
 * todo enlace en la app es por id, nunca por nombre) y completa los valores por omisión.
 */
export function routineFromImport(raw: unknown, now: string, makeId: () => string = newId): Routine {
  const r = unwrapRoutine(raw)
  const workouts: Workout[] = (r.workouts as Json[]).map((w) => ({
    id: makeId(),
    name: String(w.name).trim(),
    exercises: (w.exercises as Json[]).map(
      (ex): Exercise => ({
        id: makeId(),
        name: String(ex.name).trim(),
        ...(typeof ex.meta === 'string' && ex.meta ? { meta: ex.meta } : {}),
        unit: (ex.unit ?? 'kg') as Unit,
        restSeconds: typeof ex.restSeconds === 'number' ? ex.restSeconds : DEFAULT_REST_SECONDS,
        muscles: ((ex.muscles as Json[] | undefined) ?? []).map((m) => ({
          key: normalizeMuscleKey(m.key)!,
          role: m.role,
        })),
        sets: (ex.sets as Json[]).map(
          (s): PlannedSet => ({
            reps: s.reps,
            ...(s.rir === undefined || s.rir === null ? {} : { rir: s.rir }),
            weight: s.weight,
            ...(s.type ? { type: s.type as SetType } : {}),
            ...(s.tempo ? { tempo: String(s.tempo) } : {}),
            ...(s.note ? { note: String(s.note) } : {}),
            ...(Array.isArray(s.dropsets) && s.dropsets.length ? { dropsets: s.dropsets } : {}),
          }),
        ),
      }),
    ),
  }))
  // Un músculo repetido tras normalizar alias (p. ej. back + traps → upperback) se queda una sola vez, con el rol más fuerte.
  for (const w of workouts)
    for (const ex of w.exercises) {
      const byKey = new Map<string, (typeof ex.muscles)[number]>()
      for (const m of ex.muscles) {
        const prev = byKey.get(m.key)
        if (!prev || (prev.role === 'secondary' && m.role === 'primary')) byKey.set(m.key, m)
      }
      ex.muscles = [...byKey.values()]
    }
  return {
    id: makeId(),
    name: String(r.name).trim(),
    ...(typeof r.icon === 'string' && r.icon ? { icon: r.icon } : {}),
    complexity: (r.complexity ?? 2) as Complexity,
    workouts,
    createdAt: now,
    updatedAt: now,
  }
}
