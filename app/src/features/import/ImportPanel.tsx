import { useState } from 'react'
import type { Candidate } from '../../coach/extract'
import { VolumeBars } from '../../ui/VolumeBars'
import { importCandidate } from './importService'

interface Props {
  uid: string
  candidate: Candidate
  existingRoutineNames: string[]
  onDone?: (summary: string) => void
}

/** Revisión previa a importar: problemas de formato, series por músculo y confirmación. */
export function ImportPanel({ uid, candidate: c, existingRoutineNames, onDone }: Props) {
  const [ack, setAck] = useState(false)
  const [status, setStatus] = useState<'planned' | 'active'>('planned')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (c.errors.length)
    return (
      <div className="banner banner--alert" role="alert">
        <strong>No se importó nada: el archivo tiene {c.errors.length} problema(s).</strong>
        <ul>{c.errors.slice(0, 12).map((e, i) => <li key={i}>{e}</li>)}</ul>
        {c.errors.length > 12 && <span className="hint">…y {c.errors.length - 12} más.</span>}
        <span className="hint">Pide al coach que regenere el archivo corrigiendo estos puntos.</span>
      </div>
    )

  const needsAck = c.items.some((i) => i.volume.outOfRange.some((f) => f.level === 'alert' || f.level === 'high'))
  const canImport = !busy && !done && (!needsAck || ack)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const r = await importCandidate(uid, c, existingRoutineNames, status)
      const msg = r.program ? `Programa «${r.program.name}» importado con ${r.routines.length} rutina(s).` : `Rutina «${r.routines[0].name}» importada.`
      setDone(msg)
      onDone?.(msg)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      {c.items.map(({ routine, volume }) => (
        <section key={routine.id} className="stack">
          <h3>{routine.name}</h3>
          <p className="hint">
            {routine.workouts.length} día(s) · series directas por semana (solo músculos principales; el abdomen no se cuenta). Rango de trabajo 10–20.
          </p>
          <VolumeBars findings={volume.findings} />
          {volume.outOfRange.length > 0 && (
            <div className={`banner ${volume.outOfRange.some((f) => f.level === 'alert') ? 'banner--alert' : ''}`}>
              <strong>Fuera del rango de trabajo</strong>
              <ul>{volume.outOfRange.map((f) => <li key={f.muscle}>{f.message}</li>)}</ul>
            </div>
          )}
          {volume.sessionFindings.length > 0 && (
            <div className="banner">
              <ul>{volume.sessionFindings.map((f, i) => <li key={i}>{f.message}</li>)}</ul>
            </div>
          )}
        </section>
      ))}

      {c.kind === 'program' && (
        <label className="field">
          <span>Estado del programa</span>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as 'planned' | 'active')}>
            <option value="planned">Planeado (lo activo después)</option>
            <option value="active">Activar ahora</option>
          </select>
        </label>
      )}

      {needsAck && !done && (
        <label className="cluster">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          <span>Entiendo que algunos músculos quedan fuera del rango y quiero importarla así.</span>
        </label>
      )}
      {error && <p className="banner banner--alert" role="alert">{error}</p>}
      {done ? <p className="banner banner--ok" role="status">{done}</p> : <button className="btn" disabled={!canImport} onClick={run}>{busy ? 'Importando…' : 'Importar'}</button>}
    </div>
  )
}
