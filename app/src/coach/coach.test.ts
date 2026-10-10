import { describe, expect, it } from 'vitest'
import { describePack, PACKS, knowledgeFile } from './packs'
import { buildSystemInstruction, withAttachment } from './prompt'
import { extractJsonBlocks, inspectCoachJson, inspectReply } from './extract'
import { CoachError, GeminiDirectTransport } from './transport'

const set = { reps: 10, rir: 2, weight: 20 }
const ex = (name: string, key: string, n: number) => ({
  name,
  unit: 'kg',
  restSeconds: 90,
  muscles: [{ key, role: 'primary' }],
  sets: Array.from({ length: n }, () => set),
})
const routine = { type: 'routine', version: 2, routine: { name: 'R', complexity: 2, workouts: [{ name: 'D', exercises: [ex('A', 'chest', 12), ex('B', 'glutes', 3)] }] } }

describe('paquetes', () => {
  it('todos los archivos de cada paquete existen', () => {
    for (const files of Object.values(PACKS)) for (const f of files) expect(knowledgeFile(f).length).toBeGreaterThan(100)
  })
  it('cada paquete pesa menos que mandar todo (~37 000 tokens)', () => {
    for (const a of ['chat', 'review', 'generate'] as const) {
      const p = describePack(a)
      expect(p.approxTokens).toBeLessThan(20000)
      expect(p.files[0]).toBe('SKILL.md')
    }
  })
  it('el prompt incluye Skill, preámbulo y archivos de la acción', () => {
    const s = buildSystemInstruction('generate')
    expect(s).toContain('Estás dentro de la app GymAI')
    expect(s).toContain('=== SKILL ===')
    expect(s).toContain('=== ARCHIVO: references/formatos-de-datos.md ===')
    expect(buildSystemInstruction('chat')).not.toContain('formatos-de-datos.md ===')
  })
  it('adjunta datos como JSON compacto', () => {
    expect(withAttachment('Revisa', 'coachReport', { a: 1 })).toBe('Revisa\n\ncoachReport:\n```json\n{"a":1}\n```')
  })
})

describe('respuesta del coach', () => {
  it('extrae solo bloques json', () => {
    const reply = 'Texto\n```json\n{"a":1}\n```\nmás\n```\nno json\n```\n```json\n[1]\n```'
    expect(extractJsonBlocks(reply)).toEqual(['{"a":1}', '[1]'])
  })
  it('revisa una rutina y marca glúteos en alerta', () => {
    const c = inspectCoachJson(JSON.stringify(routine))
    expect(c.kind).toBe('routine')
    expect(c.errors).toEqual([])
    const f = (c as any).items[0].volume.findings.find((x: any) => x.muscle === 'glutes')
    expect(f.level).toBe('alert')
  })
  it('no importa nada si el formato es inválido', () => {
    const bad = structuredClone(routine)
    ;(bad.routine.workouts[0].exercises[0].muscles[0] as any).key = 'abs'
    const c = inspectCoachJson(JSON.stringify(bad))
    expect(c.errors[0]).toContain('«abs» no válida')
    expect(c.items).toEqual([])
  })
  it('JSON roto y bloque desconocido', () => {
    expect(inspectCoachJson('{nope').kind).toBe('invalid-json')
    expect(inspectCoachJson('{"x":1}').kind).toBe('unknown')
  })
  it('inspectReply revisa cada bloque', () => {
    const out = inspectReply('```json\n' + JSON.stringify(routine) + '\n```')
    expect(out).toHaveLength(1)
  })
})

describe('transporte Gemini', () => {
  const ok = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status })

  it('devuelve texto y uso, y manda la key por cabecera (no en la URL)', async () => {
    let seen: { url: string; headers: Record<string, string>; body: any } | undefined
    const t = new GeminiDirectTransport('KEY', 'm', (async (url: string, init: RequestInit) => {
      seen = { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) }
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hola' }] } }], usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2 } }))
    }) as any)
    const r = await t.send({ system: 'S', messages: [{ role: 'user', text: 'hi' }] })
    expect(r).toEqual({ text: 'Hola', usage: { promptTokens: 5, outputTokens: 2 } })
    expect(seen!.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/m:generateContent')
    expect(seen!.url).not.toContain('KEY')
    expect(seen!.headers['x-goog-api-key']).toBe('KEY')
    expect(seen!.body.systemInstruction.parts[0].text).toBe('S')
  })
  it('sin key', async () => {
    await expect(new GeminiDirectTransport('  ').send({ system: '', messages: [] })).rejects.toMatchObject({ kind: 'no-key' })
  })
  it('429 explica el límite', async () => {
    const t = new GeminiDirectTransport('K', 'm', ok({ error: { message: 'quota' } }, 429) as any)
    await expect(t.send({ system: '', messages: [] })).rejects.toMatchObject({ kind: 'rate-limit' })
  })
  it('key inválida y respuesta bloqueada', async () => {
    const bad = new GeminiDirectTransport('K', 'm', ok({ error: { message: 'API key not valid' } }, 400) as any)
    await expect(bad.send({ system: '', messages: [] })).rejects.toMatchObject({ kind: 'auth' })
    const blocked = new GeminiDirectTransport('K', 'm', ok({ promptFeedback: { blockReason: 'SAFETY' } }) as any)
    await expect(blocked.send({ system: '', messages: [] })).rejects.toBeInstanceOf(CoachError)
  })
})
