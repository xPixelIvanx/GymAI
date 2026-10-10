import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { newId } from '../../domain/normalize'
import { buildSession, initDraft, type SetDraft, type WorkoutDraft } from '../../domain/session'
import type { Routine } from '../../domain/types'
import { UNIT_LABEL } from '../../domain/units'
import { useAuth } from '../../lib/auth'
import { saveRecord } from '../../lib/db'
import { useRecords } from '../../lib/useRecords'

const draftKey = (uid: string) => `gymai.draft.${uid}`

function loadDraft(uid: string): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(uid))
    return raw ? (JSON.parse(raw) as WorkoutDraft) : null
  } catch {
    return null
  }
}

export function WorkoutPlayer() {
  const { routineId, workoutId } = useParams()
  const { user } = useAuth()
  const uid = user!.uid
  const nav = useNavigate()
  const { rows, loading } = useRecords<Routine>(uid, 'routines')
  const routine = rows.find((r) => r.id === routineId)
  const workout = routine?.workouts.find((w) => w.id === workoutId)
  const [draft, setDraft] = useState<WorkoutDraft | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [rest, setRest] = useState(0)
  const tick = useRef<number | null>(null)

  // Retoma el entreno a medias si es el mismo día; si no, empieza uno nuevo.
  useEffect(() => {
    if (!routine || !workout || draft) return
    const saved = loadDraft(uid)
    if (saved && saved.routineId === routine.id && saved.workoutId === workout.id) setDraft(saved)
    else if (saved && !confirm('Tienes otro entreno a medias. ¿Descartarlo y empezar este?')) nav('/hoy')
    else setDraft(initDraft(workout, routine.id, new Date().toISOString()))
  }, [routine, workout, draft, uid, nav])

  // Autoguardado: cada cambio queda en el dispositivo (un entreno a medias no se pierde al recargar).
  useEffect(() => {
    if (!draft) return
    try {
      localStorage.setItem(draftKey(uid), JSON.stringify(draft))
    } catch {
      /* sin almacenamiento: sigue en memoria */
    }
  }, [draft, uid])

  useEffect(() => {
    if (rest <= 0) return
    tick.current = window.setInterval(() => setRest((r) => Math.max(0, r - 1)), 1000)
    return () => {
      if (tick.current) window.clearInterval(tick.current)
    }
  }, [rest > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((exId: string, i: number, patch: Partial<SetDraft>) => {
    setDraft((d) => (d ? { ...d, sets: { ...d.sets, [exId]: d.sets[exId].map((s, j) => (j === i ? { ...s, ...patch } : s)) } } : d))
  }, [])

  const doneCount = useMemo(() => (draft ? Object.values(draft.sets).flat().filter((s) => s.done).length : 0), [draft])

  if (loading || (routine && workout && !draft)) return <main className="page"><p className="muted">Cargando…</p></main>
  if (!routine || !workout || !draft)
    return (
      <main className="page">
        <p className="banner banner--alert">No encontramos ese entreno.</p>
        <Link to="/hoy">Volver a Hoy</Link>
      </main>
    )

  async function finish() {
    const r = buildSession(routine!, workout!, draft!, new Date().toISOString(), newId)
    if (!r.ok) return setErrors(r.errors)
    setSaving(true)
    try {
      await saveRecord(uid, 'sessions', r.session)
      localStorage.removeItem(draftKey(uid))
      nav('/progreso')
    } catch {
      setErrors(['No se pudo guardar. Tu entreno sigue en este dispositivo; revisa tu conexión y vuelve a intentar.'])
      setSaving(false)
    }
  }

  function discard() {
    if (!confirm('¿Descartar este entreno? Se pierden las series que marcaste.')) return
    localStorage.removeItem(draftKey(uid))
    nav('/hoy')
  }

  return (
    <main className="page">
      <header className="page__head">
        <h1>{workout.name}</h1>
        <p>{routine.name} · {doneCount} serie(s) hecha(s)</p>
      </header>

      {rest > 0 && (
        <div className="banner" role="timer" aria-live="off">
          <strong>Descanso: {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</strong>
          <div className="cluster">
            <button className="btn btn--quiet btn--small" onClick={() => setRest((r) => r + 30)}>+30 s</button>
            <button className="btn btn--quiet btn--small" onClick={() => setRest(0)}>Saltar</button>
          </div>
        </div>
      )}

      {workout.exercises.map((ex) => (
        <section key={ex.id} className="stack">
          <div>
            <h2>{ex.name}</h2>
            <p className="muted">{UNIT_LABEL[ex.unit]} · descanso {ex.restSeconds} s</p>
          </div>
          <ul className="list">
            {ex.sets.map((planned, i) => {
              const row = draft.sets[ex.id][i]
              const label = `${ex.name}, serie ${i + 1}`
              return (
                <li key={i} style={{ flexWrap: 'wrap', opacity: row.done ? 0.6 : 1 }}>
                  <div className="list__main" style={{ minWidth: '7rem' }}>
                    <span className="list__title">Serie {i + 1}</span>
                    <span className="muted">Plan: {planned.reps} × {planned.weight || 'peso corporal'}{planned.rir != null ? ` · RIR ${planned.rir}` : ''}</span>
                  </div>
                  <div className="cluster">
                    <input className="input" style={{ width: '4.5rem' }} inputMode="numeric" aria-label={`${label}: repeticiones`} value={row.reps} onChange={(e) => update(ex.id, i, { reps: e.target.value, done: false })} />
                    <input className="input" style={{ width: '5.5rem' }} inputMode="decimal" aria-label={`${label}: peso`} value={row.weight} onChange={(e) => update(ex.id, i, { weight: e.target.value, done: false })} />
                    <input className="input" style={{ width: '4rem' }} inputMode="numeric" aria-label={`${label}: RIR`} placeholder="RIR" value={row.rir} onChange={(e) => update(ex.id, i, { rir: e.target.value, done: false })} />
                    <button
                      className={`btn btn--small ${row.done ? '' : 'btn--quiet'}`}
                      aria-pressed={row.done}
                      onClick={() => {
                        const done = !row.done
                        update(ex.id, i, { done, at: done ? new Date().toISOString() : undefined })
                        if (done) setRest(ex.restSeconds)
                      }}
                    >
                      {row.done ? 'Hecha' : 'Marcar'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {errors.length > 0 && (
        <div className="banner banner--alert" role="alert">
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      <div className="cluster">
        <button className="btn" onClick={finish} disabled={saving}>{saving ? 'Guardando…' : 'Terminar entreno'}</button>
        <button className="btn btn--quiet" onClick={discard}>Descartar</button>
      </div>
      <p className="hint">Los ejercicios sin series marcadas no se guardan: así el coach sabe qué saltaste.</p>
    </main>
  )
}
