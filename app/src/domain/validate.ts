/**
 * Validadores de los archivos que genera el coach (rutina y programa).
 * Es un port de `validar_programa.py` de la Skill: mismas reglas y mismos mensajes,
 * para que un archivo que la Skill da por bueno nunca sea rechazado aquí.
 * No corrige nada en silencio: devuelve la lista exacta de problemas.
 */
import { MUSCLES, normalizeMuscleKey } from './muscles'
import { PHASES, SET_TYPES } from './types'
import { UNITS } from './units'

type Json = Record<string, unknown>

const METRIC_MAX: Record<string, number> = {
  weightKg: 500,
  bodyFatPercent: 75,
  waistCm: 300,
  exerciseWeight: 2000,
  other: 1_000_000,
}

const isObj = (x: unknown): x is Json => typeof x === 'object' && x !== null && !Array.isArray(x)
const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x)
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const txt = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')
const show = (x: unknown): string => (x === undefined ? 'undefined' : JSON.stringify(x))

/** Fecha AAAA-MM-DD real (no acepta años menores de 100, como la app). */
export function parseDate(s: unknown): Date | null {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return y >= 100 ? dt : null
}

export function parseJson(text: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: `JSON inválido: ${(e as Error).message}` }
  }
}

/** Valida una rutina (objeto `routine`). `label` es el prefijo de los mensajes. */
export function validateRoutine(raw: unknown, index = 1): string[] {
  const e: string[] = []
  let r = raw
  if (isObj(r) && r.type === 'routine' && isObj(r.routine)) r = r.routine
  if (!isObj(r)) return [`Rutina ${index}: no es una rutina válida`]

  const rn = txt(r.name)
  const t = rn ? `Rutina «${rn}»` : `Rutina ${index}`
  if (!rn) e.push(`${t}: falta el nombre`)
  else if (rn.length > 60) e.push(`${t}: el nombre pasa de 60 caracteres`)

  let cx: unknown = r.complexity ?? 2
  if (cx !== 1 && cx !== 2 && cx !== 3) {
    e.push(`${t}: complexity debe ser 1, 2 o 3 (llegó ${show(r.complexity)})`)
    cx = 2
  }

  const ws = r.workouts
  if (!Array.isArray(ws) || ws.length === 0) return [...e, `${t}: necesita al menos un workout`]
  if (ws.length > 14) e.push(`${t}: más de 14 workouts`)

  ws.forEach((w, wi) => {
    const wn = isObj(w) ? txt(w.name) : ''
    const tw = `${t} › ${wn || `Workout ${wi + 1}`}`
    if (!wn) e.push(`${tw}: falta el nombre del workout`)
    else if (wn.length > 60) e.push(`${tw}: el nombre del workout pasa de 60 caracteres`)
    const exs = isObj(w) ? w.exercises : undefined
    if (!Array.isArray(exs)) {
      e.push(`${tw}: faltan los ejercicios`)
      return
    }
    if (exs.length > 30) e.push(`${tw}: más de 30 ejercicios`)

    exs.forEach((ex, xi) => {
      if (!isObj(ex)) {
        e.push(`${tw} › Ejercicio ${xi + 1}: no válido`)
        return
      }
      const en = txt(ex.name)
      const te = `${tw} › ${en || `Ejercicio ${xi + 1}`}`
      if (!en) e.push(`${te}: falta el nombre del ejercicio`)
      else if (en.length > 80) e.push(`${te}: el nombre pasa de 80 caracteres`)
      if ('unit' in ex && !(UNITS as readonly unknown[]).includes(ex.unit))
        e.push(`${te}: unidad «${String(ex.unit)}» no válida (usa kg, lb, kg_db, lb_db)`)
      if ('restSeconds' in ex && (!isInt(ex.restSeconds) || ex.restSeconds < 0 || ex.restSeconds > 1800))
        e.push(`${te}: descanso no válido (entero de 0 a 1800 segundos)`)

      if (ex.muscles !== undefined && ex.muscles !== null) {
        if (!Array.isArray(ex.muscles)) e.push(`${te}: muscles debe ser una lista`)
        else {
          const seen = new Set<string>()
          for (const mu of ex.muscles) {
            const rawKey = isObj(mu) ? mu.key : undefined
            const k = normalizeMuscleKey(rawKey)
            if (!k) {
              e.push(`${te}: clave de músculo «${String(rawKey)}» no válida (usa ${[...MUSCLES].sort().join(', ')})`)
              continue
            }
            const role = (mu as Json).role
            if (role !== 'primary' && role !== 'secondary')
              e.push(`${te}: el role de «${k}» debe ser primary o secondary`)
            if (seen.has(k)) e.push(`${te}: músculo «${k}» repetido`)
            seen.add(k)
          }
        }
      }

      const sets = ex.sets
      if (!Array.isArray(sets) || sets.length === 0) {
        e.push(`${te}: necesita al menos una serie`)
        return
      }
      if (sets.length > 20) e.push(`${te}: más de 20 series`)
      sets.forEach((s, j) => {
        const ts = `${te} › serie ${j + 1}`
        if (!isObj(s)) {
          e.push(`${ts}: no válida`)
          return
        }
        if (!isInt(s.reps) || s.reps < 0 || s.reps > 500)
          e.push(`${ts}: reps debe ser un entero de 0 a 500 (llegó ${show(s.reps)})`)
        if (s.rir === undefined || s.rir === null) {
          if (cx !== 1) e.push(`${ts}: falta el RIR (entero de 0 a 10)`)
        } else if (!isInt(s.rir) || s.rir < 0 || s.rir > 10) {
          e.push(`${ts}: el RIR debe ser un entero de 0 a 10 (llegó ${show(s.rir)})`)
        }
        if (!isNum(s.weight) || s.weight < 0 || s.weight > 2000)
          e.push(`${ts}: weight debe ser un número de 0 a 2000 (llegó ${show(s.weight)})`)
        if (s.type !== undefined && s.type !== null && !(SET_TYPES as readonly unknown[]).includes(s.type))
          e.push(`${ts}: tipo «${String(s.type)}» no válido (usa ${[...SET_TYPES].sort().join(', ')})`)
        if (s.dropsets !== undefined && s.dropsets !== null) {
          if (!Array.isArray(s.dropsets)) e.push(`${ts}: dropsets debe ser una lista`)
          else
            s.dropsets.forEach((x, k) => {
              const ok =
                isObj(x) &&
                isInt(x.reps) &&
                x.reps >= 0 &&
                x.reps <= 500 &&
                (x.weight === undefined || x.weight === null || (isNum(x.weight) && x.weight >= 0 && x.weight <= 2000))
              if (!ok) e.push(`${ts} › dropset ${k + 1}: reps (entero) o peso no válidos`)
            })
        }
      })
    })
  })
  return e
}

/** Valida el archivo de una rutina suelta (type "routine"). */
export function validateRoutineFile(data: unknown): string[] {
  if (!isObj(data)) return ['El archivo debe ser un objeto JSON']
  const e: string[] = []
  if (data.app !== undefined && data.app !== 'GymAI') e.push('app debe ser "GymAI"')
  if (data.type !== undefined && data.type !== 'routine') e.push('type debe ser "routine"')
  // Acepta la rutina envuelta ({ type, routine }) o suelta (plantilla antigua: la rutina en la raíz).
  const routine = isObj(data.routine) ? data.routine : Array.isArray(data.workouts) ? data : null
  if (!routine) return [...e, 'Falta el bloque «routine»']
  return [...e, ...validateRoutine(routine)]
}

/** Valida el archivo de un programa (type "program", version 1). */
export function validateProgramFile(data: unknown): string[] {
  if (!isObj(data)) return ['El archivo debe ser un objeto JSON']
  const e: string[] = []
  if (data.app !== undefined && data.app !== 'GymAI') e.push('app debe ser "GymAI"')
  if (data.version !== 1) e.push(`Versión no soportada: se esperaba "version": 1 y llegó ${show(data.version)}`)
  if (data.type !== 'program') e.push('type debe ser "program"')
  const p = data.program
  if (!isObj(p)) return [...e, 'Falta el bloque «program»']

  const n = txt(p.name)
  if (!n) e.push('Programa: falta el nombre')
  else if (n.length > 80) e.push('Programa: el nombre pasa de 80 caracteres')
  if (!(PHASES as readonly unknown[]).includes(p.phase))
    e.push(`Programa: fase «${String(p.phase)}» no válida (usa cutting, bulking, recomp, maintenance)`)
  const sd = parseDate(p.startDate)
  const ed = parseDate(p.endDate)
  if (!sd) e.push('Programa: startDate no válida (usa AAAA-MM-DD)')
  if (!ed) e.push('Programa: endDate no válida (usa AAAA-MM-DD)')
  if (sd && ed) {
    if (ed < sd) e.push('Programa: endDate debe ser igual o posterior a startDate')
    else if ((ed.getTime() - sd.getTime()) / 86_400_000 > 730) e.push('Programa: no puede durar más de 2 años')
  }

  let goals: unknown[] = []
  if (p.goals !== undefined && p.goals !== null) {
    if (!Array.isArray(p.goals)) e.push('Programa: goals debe ser una lista')
    else {
      goals = p.goals
      if (goals.length > 10) e.push('Programa: más de 10 metas')
    }
  }
  goals.forEach((g, i) => {
    const t = `Meta ${i + 1}`
    if (!isObj(g)) {
      e.push(`${t}: falta la descripción`)
      return
    }
    const ds = txt(g.description)
    if (!ds) e.push(`${t}: falta la descripción`)
    else if (ds.length > 120) e.push(`${t}: la descripción pasa de 120 caracteres`)
    const m = g.metric
    if (typeof m !== 'string' || !(m in METRIC_MAX)) {
      e.push(`${t}: métrica «${String(m)}» no válida (usa weightKg, bodyFatPercent, waistCm, exerciseWeight, other)`)
      return
    }
    if (m !== 'other') {
      for (const k of ['startValue', 'targetValue'] as const) {
        const v = g[k]
        if (!isNum(v) || v < 0 || v > METRIC_MAX[m]) e.push(`${t}: ${k} debe ser un número de 0 a ${METRIC_MAX[m]}`)
      }
    }
    if (m === 'exerciseWeight' && !txt(g.exercise)) e.push(`${t}: falta el nombre del ejercicio`)
    if (g.targetDate !== undefined && g.targetDate !== null && g.targetDate !== '' && !parseDate(g.targetDate))
      e.push(`${t}: fecha meta no válida (usa AAAA-MM-DD)`)
  })

  const nu = p.nutrition
  if (nu !== undefined && nu !== null) {
    if (!isObj(nu)) e.push('Programa: nutrition debe ser un objeto')
    else {
      for (const [k, mx] of [['calories', 10000], ['proteinG', 1000], ['fatMinG', 500]] as const) {
        const v = nu[k]
        if (v !== undefined && v !== null && (!isNum(v) || v < 0 || v > mx)) e.push(`Nutrición: ${k} debe ser 0–${mx} o null`)
      }
      if (nu.notes !== undefined && nu.notes !== null && (typeof nu.notes !== 'string' || nu.notes.length > 200))
        e.push('Nutrición: notes debe ser texto de hasta 200 caracteres')
    }
  }

  let cps: unknown[] = []
  if (p.checkpoints !== undefined && p.checkpoints !== null) {
    if (!Array.isArray(p.checkpoints)) e.push('Programa: checkpoints debe ser una lista')
    else {
      cps = p.checkpoints
      if (cps.length > 40) e.push('Programa: más de 40 checkpoints')
    }
  }
  cps.forEach((c, i) => {
    const t = `Checkpoint ${i + 1}`
    if (!isObj(c) || !parseDate(c.date)) {
      e.push(`${t}: fecha no válida (usa AAAA-MM-DD)`)
      return
    }
    if (c.type !== 'review' && c.type !== 'deload') e.push(`${t}: tipo «${String(c.type)}» no válido (usa review o deload)`)
    else if (c.note !== undefined && c.note !== null && (typeof c.note !== 'string' || c.note.length > 200))
      e.push(`${t}: note debe ser texto de hasta 200 caracteres`)
  })

  if (p.notes !== undefined && p.notes !== null && (typeof p.notes !== 'string' || p.notes.length > 600))
    e.push('Programa: notes debe ser texto de hasta 600 caracteres')

  let routines: unknown[] = []
  if (p.routines !== undefined && p.routines !== null) {
    if (!Array.isArray(p.routines)) e.push('Programa: routines debe ser una lista')
    else {
      routines = p.routines
      if (routines.length > 10) e.push('Programa: más de 10 rutinas')
    }
  }
  const names: string[] = []
  routines.forEach((r, i) => {
    const inner = isObj(r) && r.type === 'routine' && isObj(r.routine) ? r.routine : r
    if (isObj(inner)) names.push(txt(inner.name))
    e.push(...validateRoutine(r, i + 1))
  })
  const dup = [...new Set(names.filter((x) => x && names.filter((y) => y === x).length > 1))].sort()
  if (dup.length) e.push(`Nombres de rutina repetidos dentro del programa: ${dup.join(', ')}`)
  return e
}
