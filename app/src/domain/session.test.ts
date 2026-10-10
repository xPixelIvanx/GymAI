import { describe, expect, it } from 'vitest'
import { routineFromImport } from './normalize'
import { buildSession, initDraft, parseSet } from './session'

const routine = routineFromImport(
  {
    name: 'R',
    workouts: [
      {
        name: 'Push',
        exercises: [
          { name: 'Press', unit: 'kg', muscles: [{ key: 'chest', role: 'primary' }], sets: [{ reps: 8, rir: 2, weight: 80 }, { reps: 8, rir: 2, weight: 80 }] },
          { name: 'Laterales', unit: 'kg_db', muscles: [{ key: 'shoulders', role: 'primary' }], sets: [{ reps: 15, rir: 1, weight: 9 }] },
          { name: 'Fondos', unit: 'lb', muscles: [{ key: 'triceps', role: 'primary' }], sets: [{ reps: 10, rir: 2, weight: 0 }] },
        ],
      },
    ],
  },
  '2026-10-10T10:00:00.000Z',
)
const w = routine.workouts[0]
let n = 0
const id = () => `s${++n}`

describe('sesión', () => {
  it('arma la sesión, convierte a kg y omite lo saltado', () => {
    const d = initDraft(w, routine.id, '2026-10-10T10:00:00.000Z')
    const [press, lat] = w.exercises
    d.sets[press.id][0].done = true
    d.sets[press.id][1].done = true
    d.sets[press.id][1].reps = '7'
    d.sets[press.id][1].rir = '0'
    d.sets[lat.id][0].done = true
    const r = buildSession(routine, w, d, '2026-10-10T11:05:00.000Z', id)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const s = r.session
    expect(s.exercises.map((e) => e.name)).toEqual(['Press', 'Laterales']) // Fondos se saltó
    expect(s.totalSets).toBe(3)
    // 80×8 + 80×7 + (9×2)×15 = 640 + 560 + 270
    expect(s.totalVolumeKg).toBe(1470)
    expect(s.durationSec).toBe(65 * 60)
    expect(s.exercises[0].sets[1]).toMatchObject({ setNum: 2, target: { reps: 8, weight: 80, rir: 2 }, actual: { reps: 7, weight: 80, rir: 0 } })
  })
  it('rechaza RIR fuera de rango y sin series hechas', () => {
    const d = initDraft(w, routine.id, '2026-10-10T10:00:00.000Z')
    expect(buildSession(routine, w, d, 'x', id)).toEqual({ ok: false, errors: ['Marca al menos una serie como hecha antes de terminar.'] })
    d.sets[w.exercises[0].id][0].done = true
    d.sets[w.exercises[0].id][0].rir = '-2'
    const r = buildSession(routine, w, d, 'x', id)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toBe('Press, serie 1: el RIR debe ser un entero de 0 a 10')
  })
  it('parseSet acepta coma decimal y RIR vacío', () => {
    expect(parseSet({ reps: '10', weight: '22,5', rir: '', done: true })).toEqual({ ok: true, reps: 10, weight: 22.5, rir: null })
    expect(parseSet({ reps: '8.5', weight: '10', rir: '', done: true }).ok).toBe(false)
  })
})
