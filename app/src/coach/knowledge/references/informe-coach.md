# Informe para el coach (coachReport)

Leer cuando el usuario adjunte un archivo con `"type": "coachReport"` (nombre típico `gymai-coach-report-AAAA-MM-DD.json`). Es el resumen que genera su app: perfil, objetivos, tendencias y detalle reciente. No es el historial completo. Campos exactos y reglas de guardado en `guia-datos-app.md` (ábrelo solo si necesitas un campo que no está aquí); este archivo cubre cómo leerlo y decidir.

## Antes de leer

1. Comprueba `schemaVersion`. Esta guía cubre las versiones 1 y 2 (la 2 conserva todo lo de la 1 y agrega `program`, `window.scope`, `window.from` y `window.to`). Si es otra, avisa en una línea y usa solo los campos que reconozcas.
2. Fecha de los datos: `generatedAt` y `window.today`. Si el informe tiene más de 14 días, di que los datos pueden estar desfasados antes de ajustar nada.
3. Revisa qué bloques traen datos. Un bloque vacío significa que no hay datos, no que el resultado sea cero.
4. Mira `window.scope`: `last8weeks` es el informe general; `program` es el informe de un programa y **todo** (ejercicios, volumen, adherencia, peso) está limitado a las fechas del programa, con «semanas» de 7 días contadas desde `startDate` (no de lunes a domingo). Allí `bestSet`, `trend` y `lastSession` salen solo de esas fechas.

## Datos ausentes (importante)

- `exercises`, `recentSessions` y `activeRoutine` vacíos: no hay sesiones registradas. No calcules volumen, progresión ni adherencia. Di "sin sesiones registradas" y trabaja solo con peso corporal, medidas y objetivos.
- `adherence.pct` en `null`: faltan días por semana en el perfil (pídelos) o no hay sesiones en las últimas 8 semanas; es "sin datos", no incumplimiento. Si llega un 0 con `done` en 0, trátalo igual.
- Programas: con un programa activo, `goals.active` trae las metas del programa y, en `schemaVersion` 2, el bloque `program` trae el resto (nutrición, checkpoints, ajustes, semana X de Y, plan contra realidad); es `null` sin programa activo. En la versión 1 ese bloque no existe: no lo supongas. Cómo leerlo: `programas.md`.
- `goals.active` vacío: no hay objetivo con fechas; usa `athlete.goal` y pregunta si sigue vigente. (Con un programa activo, vacío significa que el programa no tiene metas.)
- `limitations` vacío y `activeInjuries` vacío: asumir sin lesiones solo si el usuario lo confirma o ya lo dijo; ante un plan nuevo, pregunta una vez.

## Cómo leer cada bloque

- **Perfil (`athlete`)**: sexo, edad, estatura, fase (`goal.phase`), músculos prioritarios, experiencia, días y minutos disponibles, equipo, preferencias, limitaciones, calorías y proteína. `coachSettings` define modo, largo de respuesta, reacción y etiquetas de certeza; respétalas.
- **Peso y composición (`body`)**: usa `weeklyAvgWeightKg` y no pesajes sueltos. Ignora la última semana si tiene `n` menor a 3 al calcular el ritmo. Ritmo semanal = cambio del promedio entre semanas, expresado en % del peso. Compáralo con el rango de la fase (definición: 0.5–1 % semanal, ver `nutricion/fases.md`; volumen: 0.25–0.5 %). Lee juntos peso, % de grasa y cintura: si el peso baja y la cintura baja, va bien; si el peso baja y la cintura no, o la fuerza cae, revisa.
- **% de grasa**: la báscula de bioimpedancia es poco exacta en valor absoluto y varía con la hidratación. Compara solo entradas del mismo método (`bodyFatMethod`) y mira la tendencia, no un valor. · Estimación
- **Medidas (`measurements`)**: cambian despacio; con cambios de 1 a 2 cm entre mediciones, no concluyas por una sola. Mide en las mismas condiciones.
- **Ejercicios (`exercises`)**: pesos en la unidad del ejercicio (`kg_db` y `lb_db` son por mancuerna). `bestSet.e1rm` es 1RM estimado con Epley (peso × (1 + reps/30)); con más de ~10 repeticiones es poco fiable, úsalo como índice de tendencia y no como carga real. `trend` trae las últimas 6 sesiones con `metTarget`; `e1rmChange` es el cambio entre la primera y la última. Estancamiento probable: sin mejora de peso, repeticiones o RIR en 3 o más sesiones seguidas con esfuerzo cercano al fallo. En definición, mantener ya cuenta como buen resultado. · Estimación para el umbral de 3 sesiones
- **Volumen (`weeklyDirectSetsByMuscle`)**: cuenta solo series directas (músculo `primary`), sin trabajo indirecto, y nunca incluye abdomen (la app no tiene ese músculo); compara con el rango de `entrenamiento/principios.md` (10–20 por semana) sin olvidar eso. La semana con `partial: true` no se usa para concluir.
- **Adherencia**: solo semanas completas (`fullWeeks`). Menos de ~80 % pide revisar tiempo y disponibilidad antes de añadir volumen. · Estimación
- **Ejercicios saltados (`skippedExercises`)**: un ejercicio que aparece como saltado en todas las sesiones puede ser un ejercicio renombrado; confírmalo antes de concluir. `incomplete` son ejercicios con menos series de las planeadas.
- **Lesiones y notas (`injuriesAndNotes`)**: las lesiones activas mandan sobre cualquier ejercicio del plan; adapta o sustituye y deriva si persiste (ver Límites en SKILL.md). Las notas recientes (descarga, mal sueño) explican caídas de rendimiento.
- **Metas por ejercicio (`goals.exerciseGoals`)**: compara el peso actual con `startWeight` y `targetWeight` y con la fecha límite; un ritmo no realista se dice con claridad.
- **Fechas**: las de `recentSessions` y `startedAt` son UTC y pueden caer un día después de la fecha local del usuario (una sesión de la tarde en México aparece con la fecha siguiente). Para agrupar por día usa las fechas de `exercises` y `body`, que ya van en fecha local, y no cuentes una sesión como "de otro día" por esa diferencia.
- **1RM estimado en aislamientos o con muchas repeticiones** (elevaciones laterales, curls, 15+ repeticiones): no lo uses; mira repeticiones a peso igual y RIR.
- **Sesiones recientes (`recentSessions`)**: detalle de los últimos 14 días; úsalo para ver RIR real contra el objetivo (`target` y `actual`).

## Cómo decidir con el informe

1. Contexto: fase, objetivo y disponibilidad. Si hay `program`, también la semana del programa, sus metas y el próximo checkpoint (`programas.md`).
2. Composición corporal y ritmo de peso.
3. Rendimiento en los ejercicios principales y prioritarios.
4. Volumen directo, adherencia y saltados.
5. Lesiones y notas.
6. Un ajuste pequeño a la vez, con el dato que lo respalda y qué mirar en el siguiente informe. El nivel de reacción `conservative` pide no cambiar más de una variable por revisión.

## Reglas de respuesta (aprendidas en pruebas)

- Longitud: una revisión general del informe puede llegar a ~180 palabras: veredicto en una línea, un ajuste principal, lo demás como "sin cambios". No repitas cifras que el usuario ya ve en su app.
- Orden de ajustes: primero seguridad (lesión activa), luego un solo cambio de entrenamiento o nutrición. Mantener algo igual no cuenta como cambio.
- Proyecciones: no extrapoles más allá de lo observado. Para estimar cuándo logrará una carga, usa el avance real de las últimas 4 a 6 sesiones sin contar la semana de descarga (no supongas "+2.5 kg por semana" si hubo semanas sin subir), y marca la fecha como Estimación.
- Causas: no atribuyas una caída de repeticiones a "lo normal en definición" sin base. Menciona los factores que sí están en el informe (notas de mal sueño, lesión, descarga) como posibles, sin afirmarlos.
- Metas de carga: compara el 1RM estimado actual con el equivalente de la meta (peso × (1 + reps/30)). Si ya lo supera, di que la meta ya es alcanzable y propone subirla, en vez de decir "cerca".
- Volumen: nombra todos los músculos que queden por debajo de 10 series directas, incluidos los de pocas series (glúteos, brazos). Del trabajo indirecto de brazos no hay medición ni fuente: no lo uses para decir que "no preocupa"; di que no se contabiliza y pregunta si son prioridad. · Estimación

Si el informe no alcanza para decidir (poca historia, datos ausentes), dilo y pide el dato mínimo que falta en vez de estimar.
