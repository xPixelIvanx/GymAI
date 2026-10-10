import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { epley, toKgTotal } from './units'
import { normalizeMuscleKey } from './muscles'
import { routineFromImport } from './normalize'
import { parseDate, validateProgramFile, validateRoutine, validateRoutineFile } from './validate'
import { checkVolume, directSetsByMuscle } from './volume'
import type { Workout } from './types'

const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))

const ex = (name: string, muscle: string, sets: number, role: 'primary' | 'secondary' = 'primary') => ({
  name,
  unit: 'kg',
  restSeconds: 90,
  muscles: [{ key: muscle, role }],
  sets: Array.from({ length: sets }, () => ({ reps: 10, rir: 2, weight: 20 })),
})

const routineOf = (...exs: ReturnType<typeof ex>[]) => ({
  name: 'Prueba',
  complexity: 2,
  workouts: [{ name: 'Día 1', exercises: exs }],
})

describe('unidades', () => {
  it('convierte a kg totales', () => {
    expect(toKgTotal(100, 'kg')).toBe(100)
    expect(toKgTotal(100, 'lb')).toBeCloseTo(45.3592, 4)
    expect(toKgTotal(20, 'kg_db')).toBe(40)
    expect(toKgTotal(50, 'lb_db')).toBeCloseTo(45.3592, 4)
  })
  it('Epley', () => {
    expect(epley(100, 3)).toBeCloseTo(110, 6)
    expect(epley(80, 0)).toBe(80)
  })
})

describe('músculos', () => {
  it('acepta alias antiguos y rechaza abs', () => {
    expect(normalizeMuscleKey('back')).toBe('upperback')
    expect(normalizeMuscleKey('forearms')).toBe('biceps')
    expect(normalizeMuscleKey('abs')).toBeNull()
  })
})

describe('fechas', () => {
  it('valida fechas reales', () => {
    expect(parseDate('2026-10-12')).not.toBeNull()
    expect(parseDate('2026-02-30')).toBeNull()
    expect(parseDate('26-10-12')).toBeNull()
  })
})

describe('validación de archivos', () => {
  it('la plantilla de programa del repo es válida', () => {
    expect(validateProgramFile(read('../../../PROGRAM_TEMPLATE.json'))).toEqual([])
  })
  it('la plantilla de rutina del repo es válida', () => {
    expect(validateRoutineFile(read('../../../ROUTINE_TEMPLATE.json'))).toEqual([])
  })
  it('rechaza RIR fuera de rango con el mensaje de la app', () => {
    const r = routineOf(ex('Press banca', 'chest', 1))
    r.workouts[0].exercises[0].sets[0].rir = 12
    expect(validateRoutine(r)).toEqual(['Rutina «Prueba» › Día 1 › Press banca › serie 1: el RIR debe ser un entero de 0 a 10 (llegó 12)'])
  })
  it('rechaza abs', () => {
    const errs = validateRoutine(routineOf(ex('Crunch', 'abs', 3)))
    expect(errs[0]).toContain('clave de músculo «abs» no válida')
  })
  it('exige RIR salvo en rutinas simples', () => {
    const r = routineOf(ex('Press', 'chest', 1))
    delete (r.workouts[0].exercises[0].sets[0] as any).rir
    expect(validateRoutine(r)[0]).toContain('falta el RIR')
    expect(validateRoutine({ ...r, complexity: 1 })).toEqual([])
  })
  it('reps decimales y unidad inválida', () => {
    const r = routineOf(ex('Remo', 'lats', 1))
    ;(r.workouts[0].exercises[0].sets[0] as any).reps = 8.5
    ;(r.workouts[0].exercises[0] as any).unit = 'stone'
    const errs = validateRoutine(r)
    expect(errs.some((m) => m.includes('reps debe ser un entero'))).toBe(true)
    expect(errs.some((m) => m.includes('unidad «stone» no válida'))).toBe(true)
  })
  it('versión de programa incorrecta', () => {
    const p = read('../../../PROGRAM_TEMPLATE.json')
    p.version = 2
    expect(validateProgramFile(p)[0]).toBe('Versión no soportada: se esperaba "version": 1 y llegó 2')
  })
})

describe('importación', () => {
  it('asigna ids nuevos y completa valores por omisión', () => {
    let n = 0
    const r = routineFromImport({ name: ' PPL ', workouts: [{ name: 'Push', exercises: [{ name: 'Press', sets: [{ reps: 8, rir: 2, weight: 60 }] }] }] }, '2026-10-10T00:00:00.000Z', () => `id${++n}`)
    expect(r.name).toBe('PPL')
    expect(r.complexity).toBe(2)
    expect(r.workouts[0].exercises[0]).toMatchObject({ unit: 'kg', restSeconds: 120, muscles: [] })
    expect(r.id).toMatch(/^id\d+$/)
  })
  it('une alias del mismo músculo con el rol más fuerte', () => {
    const r = routineFromImport(
      routineOf({ ...ex('Remo', 'back', 3, 'secondary'), muscles: [{ key: 'back', role: 'secondary' }, { key: 'traps', role: 'primary' }] }),
      '2026-10-10T00:00:00.000Z',
    )
    expect(r.workouts[0].exercises[0].muscles).toEqual([{ key: 'upperback', role: 'primary' }])
  })
})

describe('volumen semanal (caso 7)', () => {
  const w = (name: string, ...exs: ReturnType<typeof ex>[]): Workout =>
    routineFromImport({ name: 'x', workouts: [{ name, exercises: exs }] }, 'now').workouts[0]

  it('cuenta solo series primary y excluye calentamiento', () => {
    const e = ex('Press', 'chest', 4)
    e.muscles.push({ key: 'triceps', role: 'secondary' })
    e.sets[0] = { ...e.sets[0], type: 'warmup' } as any
    const counts = directSetsByMuscle([w('A', e)])
    expect(counts.chest).toBe(3)
    expect(counts.triceps).toBe(0)
  })
  it('detecta el reparto del caso 7: glúteos en 3 es alerta', () => {
    const day = w('Día', ex('Press', 'chest', 12), ex('Prensa', 'quads', 12), ex('Curl', 'hamstrings', 9), ex('Puente', 'glutes', 3))
    const rep = checkVolume([day])
    const by = Object.fromEntries(rep.findings.map((f) => [f.muscle, f.level]))
    expect(by.chest).toBe('ok')
    expect(by.hamstrings).toBe('low')
    expect(by.glutes).toBe('alert')
    expect(rep.withinRange).toBe(false)
    expect(rep.outOfRange.map((f) => f.muscle)).toContain('glutes')
  })
  it('marca más de 20 y más de 10 por sesión', () => {
    const rep = checkVolume([w('A', ex('Press', 'chest', 12)), w('B', ex('Inclinado', 'chest', 12))])
    expect(rep.findings.find((f) => f.muscle === 'chest')).toMatchObject({ sets: 24, level: 'high' })
    expect(rep.sessionFindings).toHaveLength(2)
  })
  it('músculo sin series cuenta como alerta (0)', () => {
    const rep = checkVolume([])
    expect(rep.findings.every((f) => f.sets === 0 && f.level === 'alert')).toBe(true)
  })
})
