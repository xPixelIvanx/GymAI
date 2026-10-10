import type { MuscleKey } from './muscles'
import type { Unit } from './units'

export type SetType = 'working' | 'warmup' | 'backoff' | 'amrap' | 'restpause' | 'cluster'
export const SET_TYPES: readonly SetType[] = ['working', 'warmup', 'backoff', 'amrap', 'restpause', 'cluster']

export type MuscleRole = 'primary' | 'secondary'
export interface MuscleRef {
  key: MuscleKey
  role: MuscleRole
}

export interface Dropset {
  reps: number
  weight?: number | null
}

/** Serie prescrita. `rir` puede faltar solo en rutinas simples (complexity 1). */
export interface PlannedSet {
  reps: number
  rir?: number | null
  weight: number
  type?: SetType
  tempo?: string
  note?: string
  dropsets?: Dropset[]
}

export interface Exercise {
  id: string
  name: string
  meta?: string
  unit: Unit
  restSeconds: number
  muscles: MuscleRef[]
  sets: PlannedSet[]
}

export interface Workout {
  id: string
  name: string
  exercises: Exercise[]
}

export type Complexity = 1 | 2 | 3

export interface Routine {
  id: string
  name: string
  icon?: string
  complexity: Complexity
  workouts: Workout[]
  createdAt: string
  updatedAt: string
}

export type Phase = 'cutting' | 'bulking' | 'recomp' | 'maintenance'
export const PHASES: readonly Phase[] = ['cutting', 'bulking', 'recomp', 'maintenance']

export type GoalMetric = 'weightKg' | 'bodyFatPercent' | 'waistCm' | 'exerciseWeight' | 'other'

export interface ProgramGoal {
  description: string
  metric: GoalMetric
  exercise?: string
  startValue?: number
  targetValue?: number
  targetDate?: string | null
}

export interface Checkpoint {
  date: string
  type: 'review' | 'deload'
  note?: string
  doneDate?: string | null
}

export interface NutritionTarget {
  calories?: number | null
  proteinG?: number | null
  fatMinG?: number | null
  notes?: string
}

/** Archivo de programa que genera el coach (type "program", version 1). */
export interface ProgramFile {
  app?: 'GymAI'
  version: 1
  type: 'program'
  exportedAt?: string
  program: {
    name: string
    phase: Phase
    startDate: string
    endDate: string
    goals?: ProgramGoal[]
    nutrition?: NutritionTarget
    checkpoints?: Checkpoint[]
    notes?: string
    routines?: unknown[]
  }
}

export interface RoutineFile {
  app?: 'GymAI'
  version: 1 | 2
  type: 'routine'
  exportedAt?: string
  routine: unknown
}
