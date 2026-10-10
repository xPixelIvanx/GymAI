import { useEffect } from 'react'
import { useAuth } from '../../lib/auth'
import { DEFAULT_MODEL } from '../../coach/transport'
import { KEY_STORAGE, MODEL_STORAGE, useLocal } from '../../lib/useLocal'

function applyTheme(v: string) {
  if (v === 'light' || v === 'dark') document.documentElement.dataset.theme = v
  else delete document.documentElement.dataset.theme
}

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const [key, setKey] = useLocal(KEY_STORAGE)
  const [model, setModel] = useLocal(MODEL_STORAGE)
  const [theme, setTheme] = useLocal('gymai.theme', 'system')
  const [consent, setConsent] = useLocal('gymai.coachConsent')

  useEffect(() => applyTheme(theme), [theme])

  return (
    <main className="page">
      <header className="page__head">
        <h1>Yo</h1>
        <p>{user?.displayName ? `${user.displayName} · ` : ''}{user?.email}</p>
      </header>

      <section className="stack">
        <h2>Coach</h2>
        <label className="field">
          <span>Tu key de Gemini</span>
          <input className="input" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value.trim())} placeholder="AIza…" />
          <span className="hint">
            Gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a>. Se guarda solo en este dispositivo: no se sube a la nube ni la ve nadie más.
            Créala con tu propia cuenta de Google para tener tu propio límite diario.
          </span>
        </label>
        <label className="field">
          <span>Modelo</span>
          <input className="input" value={model} onChange={(e) => setModel(e.target.value.trim())} placeholder={DEFAULT_MODEL} />
          <span className="hint">Déjalo vacío para usar el modelo con el que se probó el coach ({DEFAULT_MODEL}).</span>
        </label>
        {consent && <button className="btn btn--quiet btn--small" style={{ justifySelf: 'start' }} onClick={() => setConsent('')}>Ver de nuevo el aviso de privacidad</button>}
      </section>

      <section className="stack">
        <h2>Apariencia</h2>
        <label className="field">
          <span>Tema</span>
          <select className="select" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="system">Como mi dispositivo</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
      </section>

      <button className="btn btn--quiet" style={{ justifySelf: 'start' }} onClick={() => signOut()}>Cerrar sesión</button>
    </main>
  )
}
