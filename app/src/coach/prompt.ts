import { knowledgeFile, PACKS, skillText, type CoachAction } from './packs'

/**
 * Contexto de la app que se antepone al Skill. Es lo único que no viene del Skill:
 * dice dónde están las referencias y cómo debe entregar archivos.
 * Si se cambia este texto hay que volver a correr el examen (docs/EXAMEN.md).
 */
export const APP_PREAMBLE = `Estás dentro de la app GymAI. El Skill y sus referencias van abajo, ya cargados. No tienes herramientas para abrir archivos: cuando el Skill diga «lee» o «abre» un archivo, usa el contenido del bloque «ARCHIVO» que tenga ese nombre; si menciona uno que no está incluido, dilo en una línea y trabaja con lo que tienes.
Si entregas una rutina o un programa, ponlo en UN solo bloque de código json con el formato indicado en las referencias. La app lo valida y cuenta las series directas por músculo con código antes de importarlo; tu resumen no debe contradecir ese conteo.`

export function buildSystemInstruction(action: CoachAction): string {
  const blocks = PACKS[action].map((f) => `=== ARCHIVO: ${f} ===\n${knowledgeFile(f).trim()}`)
  return [APP_PREAMBLE, `=== SKILL ===\n${skillText().trim()}`, ...blocks].join('\n\n')
}

/** Datos de la app (p. ej. un coachReport) adjuntos al mensaje del usuario. */
export function withAttachment(userText: string, label: string, data: unknown): string {
  return `${userText.trim()}\n\n${label}:\n\`\`\`json\n${JSON.stringify(data)}\n\`\`\``
}
