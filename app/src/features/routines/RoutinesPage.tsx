import { useState } from 'react'
import { inspectCoachJson, type Candidate } from '../../coach/extract'
import type { Routine } from '../../domain/types'
import { UNIT_LABEL } from '../../domain/units'
import { deleteRecord } from '../../lib/db'
import { useAuth } from '../../lib/auth'
import { useRecords } from '../../lib/useRecords'
import { ImportPanel } from '../import/ImportPanel'

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

const setLine = (s: Routine['workouts'][number]['exercises'][number]['sets'][number]) =>
  `${s.reps} reps${s.weight ? ` · ${s.weight}` : ''}${s.rir != null ? ` · RIR ${s.rir}` : ''}`

export function RoutinesPage() {
  const { user } = useAuth()
  const uid = user!.uid
  const { rows, loading, error } = useRecords<Routine>(uid, 'routines', { orderByField: 'name' })
  const [text, setText] = useState('')
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const names = rows.map((r) => r.name)

  async function onFile(file: File | undefined) {
    if (!file) return
    const t = await file.text()
    setText(t)
    setCandidate(inspectCoachJson(t))
  }

  return (
    <main className="page">
      <header className="page__head">
        <h1>Rutinas</h1>
        <p>Importa la que te dio el coach o revisa las que ya tienes.</p>
      </header>

      {error && <p className="banner banner--alert" role="alert">{error}</p>}
      {loading ? (
        <p className="muted">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="banner">Aún no tienes rutinas. Pídele una al coach o importa un archivo aquí abajo.</p>
      ) : (
        <ul className="list">
          {rows.map((r) => (
            <li key={r.id} style={{ alignItems: 'start' }}>
              <details style={{ flex: 1 }}>
                <summary className="list__title" style={{ cursor: 'pointer' }}>
                  {r.icon ? `${r.icon} ` : ''}
                  {r.name} <span className="muted">· {r.workouts.length} día(s)</span>
                </summary>
                <div className="stack" style={{ marginTop: 12 }}>
                  {r.workouts.map((w) => (
                    <div key={w.id}>
                      <h3>{w.name}</h3>
                      <ul className="list" style={{ marginTop: 6 }}>
                        {w.exercises.map((ex) => (
                          <li key={ex.id}>
                            <div className="list__main">
                              <span className="list__title">{ex.name}</span>
                              <span className="muted">
                                {ex.sets.length} series · {UNIT_LABEL[ex.unit]} · {setLine(ex.sets[0])}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="cluster">
                    <button className="btn btn--quiet btn--small" onClick={() => download(`gymai-rutina-${r.name}.json`, { app: 'GymAI', version: 2, type: 'routine', exportedAt: new Date().toISOString(), routine: r })}>
                      Exportar
                    </button>
                    <button
                      className="btn btn--danger btn--small"
                      onClick={() => confirm(`¿Eliminar «${r.name}»? Tus sesiones ya guardadas se conservan.`) && deleteRecord(uid, 'routines', r.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <section className="stack">
        <h2>Importar</h2>
        <label className="field">
          <span>Archivo .json</span>
          <input className="input" type="file" accept=".json,application/json" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <label className="field">
          <span>O pega el contenido</span>
          <textarea className="textarea" value={text} onChange={(e) => { setText(e.target.value); setCandidate(null) }} spellCheck={false} />
          <span className="hint">Pega solo el JSON, sin el nombre del archivo.</span>
        </label>
        <button className="btn btn--quiet" disabled={!text.trim()} onClick={() => setCandidate(inspectCoachJson(text))}>
          Revisar
        </button>
        {candidate && <ImportPanel key={text} uid={uid} candidate={candidate} existingRoutineNames={names} />}
      </section>
    </main>
  )
}
