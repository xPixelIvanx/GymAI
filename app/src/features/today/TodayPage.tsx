import { Link } from 'react-router-dom'
import type { Routine } from '../../domain/types'
import { useAuth } from '../../lib/auth'
import { useRecords } from '../../lib/useRecords'

export function TodayPage() {
  const { user } = useAuth()
  const { rows, loading } = useRecords<Routine>(user!.uid, 'routines', { orderByField: 'name' })
  const hasDraft = (() => {
    try {
      return Boolean(localStorage.getItem(`gymai.draft.${user!.uid}`))
    } catch {
      return false
    }
  })()

  return (
    <main className="page">
      <header className="page__head">
        <h1>Hoy</h1>
        <p>Elige el entreno que toca.</p>
      </header>

      {hasDraft && <p className="banner">Tienes un entreno a medias. Entra al mismo día para continuarlo.</p>}

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="stack">
          <p className="banner">Todavía no tienes rutinas.</p>
          <Link className="btn" to="/coach" style={{ textAlign: 'center', textDecoration: 'none' }}>Pedir una rutina al coach</Link>
        </div>
      ) : (
        rows.map((r) => (
          <section key={r.id} className="stack">
            <h2>{r.name}</h2>
            <ul className="list">
              {r.workouts.map((w) => (
                <li key={w.id}>
                  <div className="list__main">
                    <span className="list__title">{w.name}</span>
                    <span className="muted">{w.exercises.length} ejercicios</span>
                  </div>
                  <Link className="btn btn--small" to={`/entrenar/${r.id}/${w.id}`} style={{ textDecoration: 'none' }}>Empezar</Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}
