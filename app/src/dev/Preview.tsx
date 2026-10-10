/** Hoja de referencia del diseño (solo en desarrollo: /__preview). */
import { checkVolume } from '../domain/volume'
import { routineFromImport } from '../domain/normalize'
import { CoachMarkdown } from '../ui/CoachMarkdown'
import { VolumeBars } from '../ui/VolumeBars'

const ex = (name: string, key: string, n: number) => ({ name, unit: 'kg', muscles: [{ key, role: 'primary' }], sets: Array.from({ length: n }, () => ({ reps: 10, rir: 2, weight: 20 })) })
const r = routineFromImport({ name: 'Demo', workouts: [{ name: 'A', exercises: [ex('a', 'chest', 14), ex('b', 'lats', 12), ex('c', 'quads', 12), ex('d', 'hamstrings', 8), ex('e', 'glutes', 3), ex('f', 'biceps', 22)] }] }, 'now')

const SAMPLE = `Perder 7 kg en 10 semanas es **0.7 kg por semana (~0.8 % del peso)**, dentro del ritmo de 0.5 a 1 % semanal para un cutting [Evidencia].

- Calorías: ~1,900–2,250 kcal/día (peso en libras × 10–12) · Práctica
- Proteína: ~155–170 g/día [Estimación]
- Pésate a diario y mira el promedio semanal.

| Músculo | Series | Certeza |
|---|---|---|
| Hombros | 9 | Estimación |
| Bíceps | 6 | · Reportado |
`

export function Preview() {
  return (
    <div className="page" style={{ paddingBottom: 48 }}>
      <header className="page__head">
        <h1>Hoja de diseño</h1>
        <p>Referencia visual de GymAI v2.</p>
      </header>
      <section className="stack">
        <h2>Voz del coach y sellos de certeza</h2>
        <CoachMarkdown text={SAMPLE} />
      </section>
      <section className="stack">
        <h2>Volumen semanal</h2>
        <VolumeBars findings={checkVolume(r.workouts).findings} />
      </section>
      <section className="stack">
        <h2>Botones, campos y avisos</h2>
        <div className="cluster">
          <button className="btn">Principal</button>
          <button className="btn btn--quiet">Secundario</button>
          <button className="btn btn--danger">Eliminar</button>
          <button className="btn" disabled>Desactivado</button>
        </div>
        <label className="field"><span>Peso de hoy (kg)</span><input className="input" defaultValue="78.4" /></label>
        <p className="banner">Aviso informativo.</p>
        <p className="banner banner--alert">Algo requiere tu atención.</p>
        <p className="banner banner--ok">Todo salió bien.</p>
        <ul className="list">
          <li><div className="list__main"><span className="list__title">Upper A</span><span className="muted">6 ejercicios</span></div><button className="btn btn--small">Empezar</button></li>
          <li><div className="list__main"><span className="list__title">Lower A</span><span className="muted">5 ejercicios</span></div><button className="btn btn--small">Empezar</button></li>
        </ul>
      </section>
    </div>
  )
}
