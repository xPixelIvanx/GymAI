# Programas: crear y dar seguimiento

Leer cuando el usuario pida un plan de varias semanas (rutina, metas y nutrición juntas), un cambio de fase, o la revisión de un programa en curso. Un programa es un plan con ventana de fechas que vive en la app del usuario: la Skill lo escribe como archivo y el usuario lo importa. Campos y límites exactos: `guia-datos-app.md` sección 7; ejemplo completo: `plantilla-programa.json`.

## Crear un programa

1. **Entradas.** Lo ideal es un `coachReport` (perfil, peso, historial, lesiones, ejercicios que ya hace). Sin informe, pregunta solo lo que falte de esto, máximo 3 preguntas: fase u objetivo, días por semana, equipo, lesiones, y peso/estatura/% de grasa aproximados.
2. **Decide con las referencias, cada una con su certeza:**
   - fase, ritmo y calorías: `nutricion/fases.md` y `nutricion/fundamentos.md`;
   - series, volumen y repeticiones: `entrenamiento/principios.md`;
   - ejercicios: `entrenamiento/ejercicios.md`;
   - progresión y deload: `entrenamiento/progresion-y-fatiga.md`;
   - pesos iniciales: `formatos-de-datos.md`, "Pesos iniciales".
3. **Duración y fechas.** 8 a 12 semanas es un punto de partida razonable (Estimación). `startDate` y `endDate` en fecha local, formato AAAA-MM-DD; si no se sabe cuándo empieza, el próximo lunes.
4. **Metas medibles y realistas.** Solo métricas que la app calcula: `weightKg`, `bodyFatPercent`, `waistCm` y `exerciseWeight`. `startValue` sale del último dato del usuario, y `targetValue` de un ritmo dentro del rango de la fase (no de un deseo). Metas sin cálculo (sueño, hábitos) van como `other`.
5. **Nutrición.** `calories`, `proteinG` y `fatMinG` (mínimo, no meta). La app no registra comidas: solo guarda estas metas; dilo.
6. **Checkpoints.** Una `review` cada 2 a 4 semanas y una `review` de cierre. Un `deload` cada 6 a 8 semanas o al final de una etapa dura (ver `progresion-y-fatiga.md`; es Práctica, no obligatorio).
7. **Notas del programa (≤600 caracteres).** Las reglas de ajuste que se acordaron, por ejemplo cuándo bajar calorías si el peso se estanca. Cifras sin fuente van como Estimación.
8. **Rutinas dentro del programa.** Una por estructura de entrenamiento, con nombre único y descriptivo (el journal asocia las sesiones por el nombre de la rutina). Usa los nombres de ejercicio del histórico del usuario para no romper el seguimiento. Pesos iniciales en la unidad de cada ejercicio, `kg_db` es por mancuerna.
9. **Reglas que la app exige (rechaza todo el archivo si fallan):** versión exacta 1 y `type` "program"; fase válida; fechas válidas con fin igual o posterior al inicio; `reps` entero (nunca rangos como "8-10"); RIR entero de 0 a 10 en toda serie de rutinas `complexity` 2 y 3; al menos una serie por ejercicio y una lista de ejercicios por workout; unidades `kg`, `lb`, `kg_db` o `lb_db`; músculos solo de la lista cerrada de 10 (`chest`, `shoulders`, `triceps`, `biceps`, `upperback`, `lats`, `glutes`, `quads`, `hamstrings`, `calves`). **No existe `abs`**: el abdomen se programa sin clave de músculo y no cuenta en el volumen semanal. No hace falta enviar `status`, ids ni bitácora.
10. **Valida antes de entregar.** Si hay ejecución de código: `python3 -I scripts/validar_programa.py archivo.json` (es igual o más estricto que el validador de la app: lo que él rechaza, este también). Si no, repasa la lista del punto 9 línea por línea y dilo.
11. **Entrega.** Archivo `.json` (ver "Entrega de planes largos" en SKILL.md) y en el chat 3 a 5 líneas: qué incluye, la lógica de progresión, qué se estimó y qué datos faltaron. Indica el camino de importación: Routine Manager ▸ 🗓 Programas ▸ ⤒ Importar programa, revisar el resumen y elegir "Planeado" o "Activar ahora". Si ya hay un programa activo, avisa que activar el nuevo cierra el anterior.

## Dar seguimiento

1. **Identifica el programa.** Si el informe trae un bloque `program`, úsalo (ver "Leer el bloque `program`" más abajo). Si no (informes de `schemaVersion` 1), `goals.active` trae las metas del programa activo; el resto (nutrición, checkpoints, ajustes) no viaja. Con el archivo del programa a la vista, úsalo; si no, pregunta una vez por el próximo checkpoint y la nutrición vigente. No inventes campos que el informe no trae.
2. **Semana X de Y**: en informes `schemaVersion` 2 vienen como `program.weekNumber` y `totalWeeks`; en la versión 1 se calculan con `startDate`, `endDate` y la fecha del informe.
3. **En cada revisión:** compara plan contra realidad, en este orden: ritmo de peso, cintura y grasa frente a lo planeado; progreso de cada meta (ritmo real frente al tiempo transcurrido); fuerza y volumen directo (ver `informe-coach.md`); adherencia y ejercicios saltados; lesiones y notas.
4. **Un ajuste por revisión** (nivel conservador). Entrégalo con el dato que lo respalda y dilo en dos líneas listas para pegar en "Registrar ajuste" de la app (qué cambia y por qué), para que la bitácora quede completa. En la app: Programas ▸ el programa ▸ ＋ Registrar ajuste (calorías, proteína, grasa mínima, motivo y Origen «Coach»); un checkpoint nuevo, con ＋ Checkpoint. No des el ajuste por aplicado hasta verlo en `program.latestAdjustments` del siguiente informe.
5. **Cuándo un ajuste y cuándo un programa nuevo.** Cambios pequeños (calorías, series, un ejercicio) son ajustes dentro del programa. Cambio de fase o de estructura de entrenamiento es un programa nuevo: el anterior se cierra con su resumen.
6. **Cierre.** El usuario cierra el programa en la app (■ Cerrar programa: Terminado o Cancelado, con una nota) y descarga ⤓ Informe del programa; léelo con `program.finalSummary` y `planVsActual`. Meta contra resultado (`goalsManual` son metas `other` que la app no mide: pregunta cómo le fue), qué funcionó y qué no, y una recomendación para la fase siguiente, marcada por certeza. Programa nuevo: `startValue` = valores finales del anterior.

## Leer el bloque `program` (informes de `schemaVersion` 2)

`program` es `null` si no hay programa activo; entonces trabaja como antes. Con uno activo, en este orden:

1. **Dónde va:** `status`, `weekNumber` de `totalWeeks` (0 = aún no empieza; se queda en el último número si ya pasó `endDate`).
2. **Sesiones** (`planVsActual.sessions`): solo cuentan las semanas completas (`partial: false`). `planned` sale del perfil del coach (`athlete.availability.daysPerWeek`), no del programa: si el programa trae otra frecuencia, pide actualizar ese dato. Una semana con `deload: true` es de descarga: menos sesiones ahí no es incumplimiento. Adherencia menor de ~80 %: revisar tiempo y disponibilidad antes de añadir volumen.
3. **Peso** (`planVsActual.weight`): `weeklyRatePct` usa solo dos pesajes (el de inicio y el último), no promedios. Decide con `body.weeklyAvgWeightKg` (ver `informe-coach.md`) y usa `weeklyRatePct` solo como contraste.
4. **Metas** (`goals` y `planVsActual.goals`): `pct` es el avance real y `expectedPct` lo que llevaría solo por el tiempo transcurrido; `pace` (`reached`, `onTrack`, `behind`) los compara. Es una señal de la app, no una regla de evidencia: decide con tendencias. `pct` en `null` es sin dato (o meta `other`).
5. **Checkpoints:** `nextCheckpoint` es el siguiente; uno con `doneDate: null` y fecha pasada está vencido: pregunta si se hizo.
6. **Lo ya cambiado:** `nutrition.current` y `latestAdjustments` (lo más nuevo primero). Mientras dure el programa, `program.nutrition.current` manda sobre `athlete.nutrition`. Antes de proponer algo, mira qué se ajustó y cuándo: una variable a la vez y de 2 a 3 semanas para evaluarla.

Un **informe de programa** (`window.scope: "program"`, botón ⤓ Informe del programa en la app) tiene el mismo formato, pero todo está limitado a las fechas del programa y las «semanas» son bloques de 7 días desde `startDate`.

## Límites

- Solo un programa activo a la vez.
- Sin registro de comidas no se puede evaluar el cumplimiento de la dieta; infiérelo solo de la tendencia del peso y dilo como inferencia.
- La Skill no puede editar un programa que ya existe: solo crea uno nuevo. Los ajustes y los checkpoints los registra el usuario en la app.
- Con dos dispositivos, los ajustes, el historial de nutrición y los checkpoints de ambos se conservan; si dos ediciones cambian el mismo campo simple (nombre, fechas, metas), gana la más reciente. Si algo no cuadra, pídele que lo confirme.
