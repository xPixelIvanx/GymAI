import { useState, type FormEvent } from 'react'
import type { BodyEntry, Session } from '../../domain/records'
import { useAuth } from '../../lib/auth'
import { saveRecord } from '../../lib/db'
import { formatDay, formatDuration, localDate } from '../../lib/dates'
import { useRecords } from '../../lib/useRecords'

const EMPTY_MEASURES = { waist: null, chest: null, arm: null, thigh: null, hips: null, neck: null }

export function ProgressPage() {
  const { user } = useAuth()
  const uid = user!.uid
  const sessions = useRecords<Session>(uid, 'sessions', { orderByField: 'finishedAt', descending: true })
  const body = useRecords<BodyEntry>(uid, 'bodyLog', { orderByField: 'id', descending: true })
  const [kg, setKg] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function addWeight(e: FormEvent) {
    e.preventDefault()
    const v = Number(kg.replace(',', '.'))
    if (!Number.isFinite(v) || v <= 0 || v > 500) return setError('El peso debe ser un número entre 1 y 500 kg.')
    setError(null)
    const id = localDate()
    const prev = body.rows.find((b) => b.id === id)
    await saveRecord(uid, 'bodyLog', {
      id,
      bodyFatPercent: prev?.bodyFatPercent ?? null,
      bodyFatMethod: prev?.bodyFatMethod ?? null,
      measurementsCm: prev?.measurementsCm ?? EMPTY_MEASURES,
      note: prev?.note ?? '',
      weightKg: v,
      updatedAt: new Date().toISOString(),
    } satisfies BodyEntry)
    setKg('')
  }

  return (
    <main className="page">
      <header className="page__head">
        <h1>Progreso</h1>
        <p>Tu historial. El coach lo usa para ajustar tu plan.</p>
      </header>

      <section className="stack">
        <h2>Peso corporal</h2>
        <form className="cluster" onSubmit={addWeight}>
          <label className="field" style={{ flex: 1, minWidth: '8rem' }}>
            <span className="sr-only">Peso de hoy en kg</span>
            <input className="input" inputMode="decimal" placeholder="Peso de hoy (kg)" value={kg} onChange={(e) => setKg(e.target.value)} />
          </label>
          <button className="btn">Guardar</button>
        </form>
        {error && <p className="banner banner--alert" role="alert">{error}</p>}
        <p className="hint">Pésate en condiciones parecidas (ayunas, mismo horario). Lo que importa es el promedio semanal.</p>
        {body.rows.length > 0 && (
          <ul className="list">
            {body.rows.slice(0, 7).map((b) => (
              <li key={b.id}>
                <span>{b.id}</span>
                <strong>{b.weightKg != null ? `${b.weightKg} kg` : '—'}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack">
        <h2>Entrenos</h2>
        {sessions.loading ? (
          <p className="muted">Cargando…</p>
        ) : sessions.rows.length === 0 ? (
          <p className="banner">Aún no has guardado ningún entreno. Empieza uno desde Hoy.</p>
        ) : (
          <ul className="list">
            {sessions.rows.map((s) => (
              <li key={s.id}>
                <div className="list__main">
                  <span className="list__title">{s.workoutName}</span>
                  <span className="muted">{s.routineName} · {formatDay(s.finishedAt)}</span>
                </div>
                <span className="muted">{s.totalSets} series · {Math.round(s.totalVolumeKg)} kg · {formatDuration(s.durationSec)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
