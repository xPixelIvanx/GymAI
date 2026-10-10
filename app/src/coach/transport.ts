/**
 * Conexión con el modelo. La app habla con una interfaz (`CoachTransport`), no con Gemini directamente:
 * hoy cada persona usa su propia key desde el navegador; mañana se puede cambiar por una función en el
 * servidor sin tocar el resto de la app.
 */
export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface CoachRequest {
  system: string
  messages: ChatMessage[]
  signal?: AbortSignal
}

export interface CoachResponse {
  text: string
  usage?: { promptTokens: number; outputTokens: number }
}

export interface CoachTransport {
  send(req: CoachRequest): Promise<CoachResponse>
}

export type CoachErrorKind = 'no-key' | 'auth' | 'rate-limit' | 'blocked' | 'empty' | 'network' | 'http'

export class CoachError extends Error {
  readonly kind: CoachErrorKind
  constructor(kind: CoachErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

/**
 * Modelo con el que se hizo el examen. Verifica el id exacto en la lista de modelos de AI Studio:
 * si Google lo renombra, cámbialo aquí (y vuelve a correr el examen si cambia de modelo).
 */
export const DEFAULT_MODEL = 'gemini-3.8-flash'

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

export class GeminiDirectTransport implements CoachTransport {
  private readonly apiKey: string
  private readonly model: string
  private readonly fetchImpl: typeof fetch

  constructor(apiKey: string, model: string = DEFAULT_MODEL, fetchImpl: typeof fetch = (...a) => fetch(...a)) {
    this.apiKey = apiKey.trim()
    this.model = model
    this.fetchImpl = fetchImpl
  }

  async send({ system, messages, signal }: CoachRequest): Promise<CoachResponse> {
    if (!this.apiKey) throw new CoachError('no-key', 'Falta tu key de Gemini. Agrégala en Ajustes ▸ Coach.')
    let res: Response
    try {
      res = await this.fetchImpl(`${ENDPOINT}/${this.model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        }),
        signal,
      })
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      throw new CoachError('network', 'No se pudo conectar con Gemini. Revisa tu conexión e inténtalo de nuevo.')
    }

    if (!res.ok) throw await httpError(res)
    const data = await res.json()
    const candidate = data?.candidates?.[0]
    const text: string = (candidate?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('')
    if (!text.trim()) {
      const reason = data?.promptFeedback?.blockReason ?? candidate?.finishReason
      if (reason && reason !== 'STOP')
        throw new CoachError('blocked', `Gemini no devolvió respuesta (motivo: ${reason}). Reformula la pregunta.`)
      throw new CoachError('empty', 'Gemini no devolvió contenido. Inténtalo de nuevo.')
    }
    const u = data?.usageMetadata
    return {
      text,
      usage: u ? { promptTokens: u.promptTokenCount ?? 0, outputTokens: u.candidatesTokenCount ?? 0 } : undefined,
    }
  }
}

async function httpError(res: Response): Promise<CoachError> {
  let detail = ''
  try {
    detail = (await res.json())?.error?.message ?? ''
  } catch {
    /* sin cuerpo */
  }
  if (res.status === 429)
    return new CoachError(
      'rate-limit',
      'Llegaste al límite de uso gratis de Gemini. Si es el límite por minuto, espera un minuto; si es el diario, se reinicia a medianoche (hora del Pacífico).',
    )
  if (res.status === 400 && /api key/i.test(detail)) return new CoachError('auth', 'Tu key de Gemini no es válida. Revisa que esté completa.')
  if (res.status === 401 || res.status === 403)
    return new CoachError('auth', 'Gemini rechazó tu key. Revisa que esté activa y tenga permiso para la API.')
  return new CoachError('http', `Gemini respondió con error ${res.status}${detail ? `: ${detail}` : ''}`)
}
