/**
 * Examen del coach con el paquete REAL de la app (SKILL + referencias por acción).
 * Se salta solo si no hay key. Uso:
 *   GEMINI_API_KEY=... npm run exam
 *   GEMINI_API_KEY=... EXAM_CASES=7,9,16 EXAM_RUNS=3 npm run exam
 * Escribe cada respuesta en exam-results/ para calificarla; el caso 7 además cuenta las series con código.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { inspectReply } from '../coach/extract'
import { describePack } from '../coach/packs'
import { buildSystemInstruction } from '../coach/prompt'
import { CoachError, DEFAULT_MODEL, GeminiDirectTransport } from '../coach/transport'
import cases from './cases.json'

const key = process.env.GEMINI_API_KEY
const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
const only = (process.env.EXAM_CASES ?? '').split(',').map((s) => Number(s.trim())).filter(Boolean)
const runs = Number(process.env.EXAM_RUNS ?? 1)
const delay = Number(process.env.EXAM_DELAY_MS ?? 15000)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe.skipIf(!key)('examen del coach', () => {
  it(
    `corre ${only.length || cases.length} caso(s) × ${runs} con ${model}`,
    async () => {
      const dir = 'exam-results'
      mkdirSync(dir, { recursive: true })
      const t = new GeminiDirectTransport(key!, model)
      const summary: string[] = [`# Resultados del examen — ${new Date().toISOString()}`, `Modelo: ${model}`, '']
      for (const c of cases.filter((c) => !only.length || only.includes(c.n))) {
        const pack = describePack(c.action as 'chat' | 'review' | 'generate')
        for (let run = 1; run <= runs; run++) {
          let text = ''
          let note = ''
          for (let attempt = 1; attempt <= 4; attempt++) {
            try {
              const r = await t.send({ system: buildSystemInstruction(c.action as 'chat' | 'review' | 'generate'), messages: [{ role: 'user', text: c.message }] })
              text = r.text
              note = r.usage ? `${r.usage.promptTokens} tokens de entrada, ${r.usage.outputTokens} de salida` : ''
              break
            } catch (e) {
              if (e instanceof CoachError && e.kind === 'rate-limit' && attempt < 4) await sleep(65000)
              else {
                text = `ERROR: ${(e as Error).message}`
                break
              }
            }
          }
          const file = `caso-${String(c.n).padStart(2, '0')}-${c.slug}-corrida-${run}.md`
          const auto = inspectReply(text).map((cand) =>
            cand.errors.length
              ? `- Archivo con ${cand.errors.length} problema(s): ${cand.errors.slice(0, 3).join(' | ')}`
              : cand.items.map((i) => `- «${i.routine.name}»: ${i.volume.findings.map((f) => `${f.label} ${f.sets}`).join(', ')}${i.volume.withinRange ? ' → dentro de rango' : ' → FUERA de rango'}`).join('\n'),
          )
          writeFileSync(`${dir}/${file}`, `# Caso ${c.n} · ${c.slug} · corrida ${run}\n\nPaquete: ${c.action} (~${pack.approxTokens} tokens) · ${note}\n\n## Pregunta\n\n${c.message}\n\n## Respuesta\n\n${text}\n${auto.length ? `\n## Revisión automática\n\n${auto.join('\n')}\n` : ''}`)
          summary.push(`- ${file}${auto.length ? ` · ${auto.join(' ').replace(/\n/g, ' ')}` : ''}`)
          await sleep(delay)
        }
      }
      writeFileSync(`${dir}/resumen.md`, summary.join('\n') + '\n')
    },
    60 * 60 * 1000,
  )
})
