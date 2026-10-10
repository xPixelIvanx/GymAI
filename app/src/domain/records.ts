import type { MuscleRef } from './types'
import type { Unit } from './units'

/** Serie registrada en una sesión: lo prescrito (`target`) contra lo hecho (`actual`). */
export interface SetResult {
  setNum: number
  target: { reps: number; weight: number; rir: number | null }
  actual: { reps: number; weight: number; rir: number | null }
  at: string
}

export interface SessionExercise {
  /** id del ejercicio dentro de la rutina. Los enlaces son por id; el nombre es solo de lectura. */
  exerciseId: string
  name: string
  unit: Unit
  muscles: MuscleRef[]
  sets: SetResult[]
}

export interface Session {
  id: string
  routineId: string
  routineName: string
  workoutId: string
  workoutName: string
  startedAt: string
  finishedAt: string
  durationSec: number
  totalVolumeKg: number
  totalSets: number
  exercises: SessionExercise[]
}

export interface BodyEntry {
  /** AAAA-MM-DD en fecha local; una entrada por día (es también el id del documento). */
  id: string
  weightKg: number | null
  bodyFatPercent: number | null
  bodyFatMethod: string | null
  measurementsCm: { waist: number | null; chest: number | null; arm: number | null; thigh: number | null; hips: number | null; neck: number | null }
  note: string
  updatedAt: string
}

export type Sex = 'male' | 'female'

export interface AthleteProfile {
  name: string
  sex: Sex | null
  age: number | null
  heightCm: number | null
}

export interface CoachProfile {
  goal: { phase: '' | 'cutting' | 'bulking' | 'recomp' | 'maintenance'; aestheticGoal: string; priorityMuscles: string[] }
  experience: '' | 'principiante' | 'intermedio' | 'avanzado'
  availability: { daysPerWeek: number | null; sessionMinutes: number | null }
  equipment: string
  preferences: { liked: string[]; avoided: string[] }
  limitations: string
  nutrition: { calories: number | null; proteinG: number | null }
  coachSettings: {
    mode: 'test' | 'normal'
    reactionLevel: 'conservative' | 'proactive'
    responseLength: 'short' | 'detailed'
    certaintyLabels: 'always' | 'whenRelevant'
    explanationStyle: string
  }
}

export const EMPTY_COACH_PROFILE: CoachProfile = {
  goal: { phase: '', aestheticGoal: '', priorityMuscles: [] },
  experience: '',
  availability: { daysPerWeek: null, sessionMinutes: null },
  equipment: '',
  preferences: { liked: [], avoided: [] },
  limitations: '',
  nutrition: { calories: null, proteinG: null },
  coachSettings: { mode: 'normal', reactionLevel: 'conservative', responseLength: 'short', certaintyLabels: 'whenRelevant', explanationStyle: '' },
}

/** Mensaje de la conversación con el coach (se guarda para revisar errores del piloto). */
export interface CoachMessage {
  id: string
  conversationId: string
  role: 'user' | 'model'
  text: string
  action: 'chat' | 'review' | 'generate'
  createdAt: string
  usage?: { promptTokens: number; outputTokens: number }
  feedback?: { rating: 'good' | 'bad'; note: string; at: string }
}
