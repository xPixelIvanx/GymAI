import type { Checkpoint, Phase, ProgramFile, ProgramGoal } from './types'

export type ProgramStatus = 'planned' | 'active' | 'done' | 'cancelled'

export interface NutritionEntry {
  date: string
  calories: number | null
  proteinG: number | null
  fatMinG: number | null
  reason: string
}

export interface Adjustment {
  date: string
  change: string
  reason: string
  source: 'user' | 'coach'
}

/** Programa: plan con fechas, metas, nutrición y checkpoints. Las rutinas se enlazan por id (no se duplican). */
export interface Program {
  id: string
  name: string
  phase: Phase
  status: ProgramStatus
  startDate: string
  endDate: string
  goals: ProgramGoal[]
  routineIds: string[]
  nutrition: { calories: number | null; proteinG: number | null; fatMinG: number | null; notes: string; history: NutritionEntry[] }
  checkpoints: Checkpoint[]
  adjustments: Adjustment[]
  notes: string
  createdAt: string
  updatedAt: string
}

/** Si ya existe una rutina con ese nombre, la nueva se llama «Nombre (2)», «Nombre (3)»… nunca se pisa una existente. */
export function uniqueName(name: string, taken: Iterable<string>): string {
  const set = new Set([...taken].map((n) => n.trim().toLowerCase()))
  if (!set.has(name.trim().toLowerCase())) return name
  let i = 2
  while (set.has(`${name} (${i})`.toLowerCase())) i++
  return `${name} (${i})`
}

const today = (now: string) => now.slice(0, 10)

export function programFromImport(
  file: ProgramFile,
  routineIds: string[],
  status: 'planned' | 'active',
  now: string,
  makeId: () => string,
): Program {
  const p = file.program
  const n = p.nutrition
  const date = today(now)
  const history: NutritionEntry[] = n
    ? [{ date, calories: n.calories ?? null, proteinG: n.proteinG ?? null, fatMinG: n.fatMinG ?? null, reason: 'Inicial' }]
    : []
  const adjustments: Adjustment[] = [{ date, change: 'Programa importado', reason: '', source: 'coach' }]
  if (status === 'active') adjustments.push({ date, change: 'Programa activado', reason: '', source: 'user' })
  return {
    id: makeId(),
    name: p.name.trim(),
    phase: p.phase,
    status,
    startDate: p.startDate,
    endDate: p.endDate,
    goals: p.goals ?? [],
    routineIds,
    nutrition: {
      calories: n?.calories ?? null,
      proteinG: n?.proteinG ?? null,
      fatMinG: n?.fatMinG ?? null,
      notes: n?.notes ?? '',
      history,
    },
    checkpoints: (p.checkpoints ?? []).map((c) => ({ ...c, doneDate: null })),
    adjustments,
    notes: p.notes ?? '',
    createdAt: now,
    updatedAt: now,
  }
}
