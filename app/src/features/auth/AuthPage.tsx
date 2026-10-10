import { useState, type FormEvent } from 'react'
import { authMessage, useAuth } from '../../lib/auth'
import { isFirebaseConfigured } from '../../lib/firebase'

type Mode = 'login' | 'register' | 'reset'

export function AuthPage() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'login') await auth.signIn(email, password)
      else if (mode === 'register') await auth.signUp(name, email, password)
      else {
        await auth.resetPassword(email)
        setInfo('Si ese correo tiene cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa también spam.')
      }
    } catch (err) {
      setError(authMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError(null)
    try {
      await auth.signInWithGoogle()
    } catch (err) {
      setError(authMessage(err))
    }
  }

  const title = mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'

  return (
    <main className="page" style={{ paddingBottom: 48 }}>
      <header className="page__head">
        <h1>GymAI</h1>
        <p>Un coach que te dice de dónde sale cada recomendación y qué tan segura es.</p>
      </header>

      {!isFirebaseConfigured && (
        <div className="banner banner--alert" role="alert">
          <strong>Falta conectar la nube.</strong>
          <span>Copia .env.example a .env.local, llena los datos de tu proyecto de Firebase y reinicia.</span>
        </div>
      )}

      <form className="stack" onSubmit={submit}>
        <h2>{title}</h2>
        {mode === 'register' && (
          <label className="field">
            <span>Nombre</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Correo</span>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        {mode !== 'reset' && (
          <label className="field">
            <span>Contraseña</span>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {mode === 'register' && <span className="hint">Mínimo 6 caracteres.</span>}
          </label>
        )}
        {error && <p className="banner banner--alert" role="alert">{error}</p>}
        {info && <p className="banner banner--ok" role="status">{info}</p>}
        <button className="btn" disabled={busy || !isFirebaseConfigured}>
          {busy ? 'Un momento…' : mode === 'reset' ? 'Enviar enlace' : title}
        </button>
        {mode !== 'reset' && (
          <button type="button" className="btn btn--quiet" onClick={google} disabled={!isFirebaseConfigured}>
            Continuar con Google
          </button>
        )}
      </form>

      <div className="cluster">
        {mode !== 'login' && <button className="btn btn--quiet btn--small" onClick={() => setMode('login')}>Ya tengo cuenta</button>}
        {mode !== 'register' && <button className="btn btn--quiet btn--small" onClick={() => setMode('register')}>Crear cuenta</button>}
        {mode === 'login' && <button className="btn btn--quiet btn--small" onClick={() => setMode('reset')}>Olvidé mi contraseña</button>}
      </div>
    </main>
  )
}
