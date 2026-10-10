import { Children, type ReactNode } from 'react'

export type Certainty = 'evidencia' | 'practica' | 'estimacion' | 'reportado'

const LABEL: Record<Certainty, string> = {
  evidencia: 'Evidencia',
  practica: 'Práctica',
  estimacion: 'Estimación',
  reportado: 'Reportado',
}

export const CERTAINTY_HELP: Record<Certainty, string> = {
  evidencia: 'Respaldado por estudios verificados.',
  practica: 'Experiencia de entrenadores; no es un estudio.',
  estimacion: 'Cálculo aproximado para arrancar; se corrige con tus datos.',
  reportado: 'Lo dice una fuente, sin verificar.',
}

/** Disco olímpico + nombre. El color nunca va solo: siempre acompaña a la palabra. */
export function Seal({ kind }: { kind: Certainty }) {
  return (
    <span className={`seal seal--${kind}`} title={CERTAINTY_HELP[kind]}>
      <span className="seal__disc" aria-hidden="true" />
      {LABEL[kind]}
    </span>
  )
}

const TAG = /(\[(?:Evidencia|Pr[aá]ctica|Estimaci[oó]n|Reportado)\]|·\s*(?:Evidencia|Pr[aá]ctica|Estimaci[oó]n|Reportado)\b)/g

function kindOf(token: string): Certainty {
  const w = token.replace(/[[\]·\s]/g, '').toLowerCase()
  if (w.startsWith('evid')) return 'evidencia'
  if (w.startsWith('pr')) return 'practica'
  if (w.startsWith('est')) return 'estimacion'
  return 'reportado'
}

/** Cambia las etiquetas de certeza escritas en texto ([Evidencia], · Práctica…) por sellos. */
export function withSeals(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== 'string') return child
    return child.split(TAG).map((part, i) => (i % 2 === 1 ? <Seal key={i} kind={kindOf(part)} /> : part))
  })
}
