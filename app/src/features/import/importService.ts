import type { Candidate } from '../../coach/extract'
import { programFromImport, uniqueName, type Program } from '../../domain/program'
import { newId } from '../../domain/normalize'
import type { ProgramFile, Routine } from '../../domain/types'
import { saveRecord } from '../../lib/db'

export interface ImportResult {
  routines: Routine[]
  program?: Program
}

/**
 * Guarda lo que trae un archivo ya revisado. Las rutinas reciben ids nuevos y, si el nombre ya existe,
 * un sufijo « (2)». Un programa se guarda como planeado o activo, enlazado a esas rutinas por id.
 */
export async function importCandidate(
  uid: string,
  c: Candidate,
  existingRoutineNames: string[],
  programStatus: 'planned' | 'active' = 'planned',
  now = new Date().toISOString(),
): Promise<ImportResult> {
  if (c.errors.length || (c.kind !== 'routine' && c.kind !== 'program')) throw new Error('El archivo tiene problemas; no se importó nada.')
  const taken = [...existingRoutineNames]
  const routines = c.items.map(({ routine }) => {
    const name = uniqueName(routine.name, taken)
    taken.push(name)
    return { ...routine, name }
  })
  for (const r of routines) await saveRecord(uid, 'routines', r)
  if (c.kind === 'program') {
    const program = programFromImport(c.raw as ProgramFile, routines.map((r) => r.id), programStatus, now, newId)
    await saveRecord(uid, 'programs', program)
    return { routines, program }
  }
  return { routines }
}
