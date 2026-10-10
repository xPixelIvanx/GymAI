import type { ComponentProps } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { withSeals } from './Seals'

type P<T extends keyof React.JSX.IntrinsicElements> = ComponentProps<T>

/** Respuesta del coach: texto en serif, tablas en grotesca y etiquetas de certeza como sellos. */
export function CoachMarkdown({ text }: { text: string }) {
  return (
    <div className="coach-voice">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }: P<'p'>) => <p>{withSeals(children)}</p>,
          li: ({ children }: P<'li'>) => <li>{withSeals(children)}</li>,
          td: ({ children }: P<'td'>) => <td>{withSeals(children)}</td>,
          th: ({ children }: P<'th'>) => <th>{withSeals(children)}</th>,
          strong: ({ children }: P<'strong'>) => <strong>{withSeals(children)}</strong>,
        }}
      >
        {text}
      </Markdown>
    </div>
  )
}
