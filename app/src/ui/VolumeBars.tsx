import type { VolumeFinding } from '../domain/volume'

const SCALE_MAX = 24

/** Series directas por músculo contra el rango de trabajo (10–20, línea punteada). */
export function VolumeBars({ findings }: { findings: VolumeFinding[] }) {
  return (
    <div className="vol" role="list" aria-label="Series directas por semana y músculo">
      {findings.map((f) => (
        <div key={f.muscle} style={{ display: 'contents' }} role="listitem" aria-label={f.message}>
          <span>{f.label}</span>
          <div className="vol__track">
            <div className="vol__range" />
            <div className="vol__fill" data-level={f.level} style={{ width: `${Math.min(100, (f.sets / SCALE_MAX) * 100)}%` }} />
          </div>
          <span>{f.sets}</span>
        </div>
      ))}
    </div>
  )
}
