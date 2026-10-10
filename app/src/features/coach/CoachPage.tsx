import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { inspectReply, stripJsonBlocks } from '../../coach/extract'
import { describePack, ACTION_LABEL, type CoachAction } from '../../coach/packs'
import { buildSystemInstruction, withAttachment } from '../../coach/prompt'
import { CoachError, DEFAULT_MODEL, GeminiDirectTransport, type ChatMessage } from '../../coach/transport'
import type { CoachMessage } from '../../domain/records'
import type { Routine } from '../../domain/types'
import { newId } from '../../domain/normalize'
import { useAuth } from '../../lib/auth'
import { saveRecord } from '../../lib/db'
import { KEY_STORAGE, MODEL_STORAGE, useLocal } from '../../lib/useLocal'
import { useRecords } from '../../lib/useRecords'
import { CoachMarkdown } from '../../ui/CoachMarkdown'
import { ImportPanel } from '../import/ImportPanel'

type Turn = CoachMessage & { modelText: string }

const PLACEHOLDER: Record<CoachAction, string> = {
  chat: 'Pregunta lo que quieras: ejercicios, series, comida, dudas…',
  review: 'Ej.: ¿cómo voy este mes? Adjunta tu informe abajo.',
  generate: 'Ej.: quiero una rutina de 4 días para ganar músculo en gimnasio completo.',
}

export function CoachPage() {
  const { user } = useAuth()
  const uid = user!.uid
  const [key] = useLocal(KEY_STORAGE)
  const [model] = useLocal(MODEL_STORAGE)
  const [consent, setConsent] = useLocal('gymai.coachConsent')
  const [action, setAction] = useState<CoachAction>('chat')
  const [conversationId, setConversationId] = useState(newId)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState<{ name: string; data: unknown } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [badFor, setBadFor] = useState<string | null>(null)
  const [badNote, setBadNote] = useState('')
  const abort = useRef<AbortController | null>(null)
  const { rows: routines } = useRecords<Routine>(uid, 'routines')
  const names = routines.map((r) => r.name)
  const pack = useMemo(() => describePack(action), [action])

  function reset(next?: CoachAction) {
    abort.current?.abort()
    setTurns([])
    setConversationId(newId())
    setAttachment(null)
    setError(null)
    if (next) setAction(next)
  }

  function chooseAction(next: CoachAction) {
    if (next === action) return
    if (turns.length && !confirm('Cambiar de acción empieza una conversación nueva. ¿Continuar?')) return
    reset(next)
  }

  async function onAttach(file: File | undefined) {
    if (!file) return
    try {
      setAttachment({ name: file.name, data: JSON.parse(await file.text()) })
      setError(null)
    } catch {
      setError('Ese archivo no es un JSON válido.')
    }
  }

  async function persist(m: CoachMessage) {
    try {
      await saveRecord(uid, 'coachLog', m)
    } catch {
      /* el registro es para revisar el piloto; no debe interrumpir la conversación */
    }
  }

  async function send() {
    const typed = input.trim()
    if (!typed || busy) return
    setError(null)
    const now = new Date().toISOString()
    const modelText = attachment ? withAttachment(typed, attachment.name.replace(/\.json$/i, ''), attachment.data) : typed
    const userTurn: Turn = { id: newId(), conversationId, role: 'user', text: typed, action, createdAt: now, modelText }
    const history = [...turns, userTurn]
    setTurns(history)
    setInput('')
    setAttachment(null)
    setBusy(true)
    abort.current = new AbortController()
    void persist(userTurn)
    try {
      const transport = new GeminiDirectTransport(key, model || DEFAULT_MODEL)
      const messages: ChatMessage[] = history.map((t) => ({ role: t.role, text: t.modelText }))
      const res = await transport.send({ system: buildSystemInstruction(action), messages, signal: abort.current.signal })
      const reply: Turn = { id: newId(), conversationId, role: 'model', text: res.text, action, createdAt: new Date().toISOString(), usage: res.usage, modelText: res.text }
      setTurns((t) => [...t, reply])
      void persist(reply)
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError(e instanceof CoachError ? e.message : 'No se pudo obtener la respuesta. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  function rate(t: Turn, rating: 'good' | 'bad', note = '') {
    const updated = { ...t, feedback: { rating, note, at: new Date().toISOString() } }
    setTurns((all) => all.map((x) => (x.id === t.id ? updated : x)))
    setBadFor(null)
    setBadNote('')
    const { modelText: _omit, ...record } = updated
    void persist(record)
  }

  if (!consent)
    return (
      <main className="page">
        <header className="page__head">
          <h1>Coach</h1>
        </header>
        <div className="banner">
          <strong>Antes de empezar</strong>
          <ul>
            <li>Tus mensajes y datos que adjuntes se envían a Google (Gemini) con tu propia key. En el plan gratis, Google puede usarlos para mejorar sus productos.</li>
            <li>Guardamos la conversación en tu cuenta para revisar errores del coach durante el piloto. Nadie más puede leerla.</li>
            <li>El coach no sustituye a un médico. Ante dolor, mareo o síntomas raros, consulta a un profesional.</li>
          </ul>
        </div>
        <button className="btn" onClick={() => setConsent('1')}>Entiendo y acepto</button>
      </main>
    )

  if (!key)
    return (
      <main className="page">
        <header className="page__head">
          <h1>Coach</h1>
        </header>
        <div className="banner">
          <strong>Falta tu key de Gemini</strong>
          <span>Es gratis: créala en Google AI Studio y pégala en Yo ▸ Coach. Se queda solo en este dispositivo.</span>
        </div>
        <Link className="btn" to="/yo" style={{ textAlign: 'center', textDecoration: 'none' }}>Ir a Yo</Link>
      </main>
    )

  return (
    <main className="page">
      <header className="page__head">
        <h1>Coach</h1>
        <p>Cada respuesta indica de dónde sale y qué tan segura es.</p>
      </header>

      <div className="cluster" role="radiogroup" aria-label="Qué quieres hacer">
        {(Object.keys(ACTION_LABEL) as CoachAction[]).map((a) => (
          <button key={a} role="radio" aria-checked={a === action} className={`btn btn--small ${a === action ? '' : 'btn--quiet'}`} onClick={() => chooseAction(a)}>
            {ACTION_LABEL[a]}
          </button>
        ))}
        {turns.length > 0 && <button className="btn btn--quiet btn--small" onClick={() => reset()}>Nueva conversación</button>}
      </div>
      <p className="hint">Cada mensaje manda unos {Math.round(pack.approxTokens / 100) / 10}k tokens de contexto (cuenta para tu límite gratis).</p>

      <div className="stack" aria-live="polite">
        {turns.map((t) => {
          if (t.role === 'user')
            return (
              <div key={t.id} className="msg msg--user">
                <div className="msg__bubble">{t.text}</div>
              </div>
            )
          const candidates = inspectReply(t.text)
          return (
            <article key={t.id} className="msg">
              <CoachMarkdown text={stripJsonBlocks(t.text)} />
              {candidates.map((c, i) => (
                <ImportPanel key={i} uid={uid} candidate={c} existingRoutineNames={names} />
              ))}
              <div className="msg__tools">
                {t.feedback ? (
                  <span>{t.feedback.rating === 'good' ? 'Marcaste esta respuesta como útil.' : 'Reportaste esta respuesta. Gracias.'}</span>
                ) : (
                  <>
                    <button className="btn btn--quiet btn--small" onClick={() => rate(t, 'good')}>Útil</button>
                    <button className="btn btn--quiet btn--small" onClick={() => setBadFor(t.id)}>Reportar error</button>
                  </>
                )}
              </div>
              {badFor === t.id && (
                <div className="stack">
                  <label className="field">
                    <span>¿Qué estuvo mal?</span>
                    <textarea className="textarea" value={badNote} onChange={(e) => setBadNote(e.target.value)} placeholder="Ej.: dijo que… pero en realidad…" />
                  </label>
                  <div className="cluster">
                    <button className="btn btn--small" onClick={() => rate(t, 'bad', badNote.trim())}>Enviar reporte</button>
                    <button className="btn btn--quiet btn--small" onClick={() => setBadFor(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
        {busy && <p className="muted">El coach está respondiendo…</p>}
      </div>

      {error && <p className="banner banner--alert" role="alert">{error}</p>}

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        {action === 'review' && (
          <label className="field">
            <span>Informe para el coach (.json)</span>
            <input className="input" type="file" accept=".json,application/json" onChange={(e) => onAttach(e.target.files?.[0])} />
            <span className="hint">{attachment ? `Adjunto: ${attachment.name}` : 'Pronto se generará solo desde tus sesiones; por ahora adjúntalo.'}</span>
          </label>
        )}
        <label className="field">
          <span className="sr-only">Tu mensaje</span>
          <textarea
            className="textarea"
            value={input}
            placeholder={PLACEHOLDER[action]}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void send()
              }
            }}
          />
        </label>
        <button className="btn" disabled={busy || !input.trim()}>{busy ? 'Enviando…' : 'Enviar'}</button>
      </form>
    </main>
  )
}
