# GymAI v2 — Arquitectura

App React + TypeScript + Vite, PWA, con Firestore y un coach que usa Gemini con la key de cada usuario.

## Carpetas
- `src/domain/` — reglas puras (sin React ni red): músculos, unidades, tipos, validadores, volumen semanal, sesiones. Con pruebas.
- `src/coach/` — conocimiento (SKILL + referencias), paquetes por acción (chat / review / generate), prompt, transporte a Gemini, extracción y revisión de JSON.
- `src/lib/` — Firebase, auth, acceso a datos, hooks.
- `src/features/` — pantallas: auth, rutinas, importar, coach, hoy (reproductor), progreso, perfil.
- `src/exam/` — corredor del examen del coach con el paquete real de la app.

## Datos
`users/{uid}/{routines|sessions|bodyLog|coachLog|programs|settings}`, un documento por registro. `firestore.rules`: solo el dueño lee y escribe; todo lo demás se niega.

## Coach
- La key de Gemini vive solo en el navegador (`localStorage`) y viaja en el header `x-goog-api-key`.
- `CoachTransport` es una interfaz: hoy conexión directa, mañana un proxy sin tocar la UI.
- Todo JSON que genera el coach se valida con código (`validate.ts`) y se revisa el volumen (`volume.ts`: solo series directas de músculos `primary`, rango 10–20 por semana) antes de dejar importarlo.
- Cambiar `prompt.ts`, el SKILL o las referencias exige repetir el examen: `GEMINI_API_KEY=... npm run exam` (opciones `EXAM_CASES=7,9,16`, `EXAM_RUNS=3`). Los resultados quedan en `exam-results/` (ignorado por git).

## Pendiente
Editor de rutinas, interfaz de programas (activar, checkpoints, ajustes), constructor automático del informe del coach, formulario de perfil del coach, medidas corporales.

## Antes de usarla
1. Crear un proyecto Firebase nuevo (plan Spark), copiar `.env.example` a `.env.local` y poner las mismas variables en Vercel.
2. Desplegar `firestore.rules`.
3. Revocar la key de Gemini que quedó en el historial público del repo viejo y cerrar la lectura pública de `users/{uid}` en el proyecto viejo.
4. Confirmar el id exacto del modelo en AI Studio (`DEFAULT_MODEL` en `src/coach/transport.ts`).
