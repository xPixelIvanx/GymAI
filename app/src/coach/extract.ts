import { checkVolume, type VolumeReport } from '../domain/volume'
import { routineFromImport, unwrapRoutine } from '../domain/normalize'
import { parseJson, validateProgramFile, validateRoutineFile } from '../domain/validate'
import type { Routine } from '../domain/types'

/** Saca los bloques ```json de la respuesta del coach. */
export function extractJsonBlocks(reply: string): string[] {
  const out: string[] = []
  const re = /```(?:json)?\s*\n([\s\S]*?)```/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(reply))) {
    const body = m[1].trim()
    if (body.startsWith('{') || body.startsWith('[')) out.push(body)
  }
  return out
}

export interface RoutineCandidate {
  routine: Routine
  volume: VolumeReport
}

export type Candidate =
  | { kind: 'routine'; errors: string[]; items: RoutineCandidate[]; raw: unknown }
  | { kind: 'program'; errors: string[]; items: RoutineCandidate[]; raw: unknown }
  | { kind: 'unknown'; errors: string[]; items: []; raw: unknown }
  | { kind: 'invalid-json'; errors: string[]; items: []; raw: null }

/**
 * Revisa lo que el coach entregó ANTES de importarlo: valida el formato y cuenta las series por músculo.
 * Si hay errores no se importa nada; el volumen fuera de rango no bloquea, pero se muestra y se pide confirmar.
 */
export function inspectCoachJson(text: string, now = new Date().toISOString()): Candidate {
  const parsed = parseJson(text)
  if (!parsed.ok) return { kind: 'invalid-json', errors: [parsed.error], items: [], raw: null }
  const data = parsed.data as Record<string, any>
  const type = data?.type

  if (type === 'program') {
    const errors = validateProgramFile(data)
    const items = errors.length ? [] : (data.program.routines ?? []).map((r: unknown) => toCandidate(r, now))
    return { kind: 'program', errors, items, raw: data }
  }
  if (type === 'routine' || Array.isArray(data?.workouts) || data?.routine) {
    const errors = validateRoutineFile(data)
    const items = errors.length ? [] : [toCandidate(data, now)]
    return { kind: 'routine', errors, items, raw: data }
  }
  return { kind: 'unknown', errors: ['El bloque no es una rutina ni un programa de GymAI.'], items: [], raw: data }
}

function toCandidate(raw: unknown, now: string): RoutineCandidate {
  const routine = routineFromImport(unwrapRoutine(raw), now)
  return { routine, volume: checkVolume(routine.workouts) }
}

/** Todo lo importable que trae una respuesta del coach. */
export function inspectReply(reply: string): Candidate[] {
  return extractJsonBlocks(reply).map((b) => inspectCoachJson(b))
}

/** Para mostrar la respuesta: los bloques json (archivos) se reemplazan por una nota; se revisan aparte. */
export function stripJsonBlocks(reply: string): string {
  return reply.replace(/```(?:json)?\s*\n([\s\S]*?)```/gi, (block, body: string) => {
    const t = body.trim()
    return t.startsWith('{') || t.startsWith('[') ? '*(Archivo adjunto: revísalo e impórtalo abajo.)*' : block
  })
}
