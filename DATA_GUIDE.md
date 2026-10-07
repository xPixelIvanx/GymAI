# GymAI — Guía de datos

Esta guía explica cómo GymAI guarda los datos de entrenamiento y cómo se exportan para conectarlos a una Skill de coaching (p. ej. `coach-gym`). Todo el código vive en `HTML/index.html`.

## 1. Dónde viven los datos

- **En el dispositivo:** `localStorage`, con una clave por cuenta: `<clave>::<uid>`. Sin sesión no hay datos.
- **En la nube:** Firestore, en `users/{uid}` y `users/{uid}/data/{documento}`. Las reglas (`FIRESTORE_RULES.txt`) solo dejan leer y escribir `users/{uid}/data/*` al dueño de la cuenta.
- **Formato de los documentos de datos.** Casi todos tienen esta forma:

  ```json
  { "payload": "<JSON en texto>", "wipedAt": "2026-10-06T02:00:00.000Z" | null, "updatedAt": <timestamp Firestore> }
  ```

  `payload` es el contenido real (lista u objeto) serializado como texto. Firestore admite **máx. 1 MiB por documento**.

| Documento Firestore | Clave localStorage | Contenido | Cómo se sincroniza |
|---|---|---|---|
| `users/{uid}` → campo `profile` | `gymAI_profile_v1` | Perfil del atleta | Se sobrescribe. Las versiones con fecha quedan en `profileHistory`. |
| `users/{uid}` → campo `musclePRs` | `gymAI_musclePR_v1` | PRs por músculo (registro manual) | Se sobrescribe. |
| `data/routines` | `gymAI_routines_v2` | Rutinas actuales | Se sobrescribe. Los cambios quedan en `routineHistory`. |
| `data/journal` | `gymAI_journal_v2` | Sesiones (War Journal) | **Se combina por `id`** (solo se agrega). |
| `data/bodyLog` | `gymAI_bodylog_v1` | Peso, % grasa y medidas | Una entrada por día. Gana el dispositivo si tiene cambios sin subir. |
| `data/coachProfile` | (solo nube) | Perfil del coach | Campos directos, sin `payload`. Las versiones quedan en `profileHistory`. |
| `data/exerciseGoals` | `gymAI_goals_v1` | Metas de peso por ejercicio | Gana el dispositivo si tiene cambios sin subir. |
| `data/profileHistory` | `gymAI_hist_profile_v1` | Versiones con fecha del perfil y del perfil del coach | Se combina por `id`. |
| `data/goals` | `gymAI_hist_goals_v1` | Objetivos con fecha de inicio y fin | Se combina por `id`. |
| `data/notes` | `gymAI_hist_notes_v1` | Lesiones y notas | Se combina por `id`. |
| `data/routineHistory` | `gymAI_hist_routines_v1` | Fotos de las rutinas cuando cambian | Se combina por `id`. |

Las colecciones sociales (`crews`, `friendships`, `chats`, `notifications`…) no forman parte de los datos de entrenamiento.

## 2. Reglas: qué se agrega y qué se versiona

1. **Las sesiones solo se agregan.** Al iniciar sesión y en cada guardado, la app lee la nube, la combina por `id` con la copia del dispositivo y escribe el resultado en los dos lados.
   - Si la lectura falla (sin internet), no escribe nada. La copia local se conserva y se combina en la siguiente sincronización.
   - Una sesión guardada sin conexión nunca se pierde.
2. **Historiales (`profileHistory`, `goals`, `notes`, `routineHistory`):**
   - Cada registro lleva `id`, `createdAt` y `updatedAt`.
   - Al combinar, gana el `updatedAt` más reciente.
   - Eliminar un registro no lo borra: le pone `deletedAt` (lápida) y deja de mostrarse y de exportarse.
3. **Versiones del perfil.**
   - Cada vez que cambia el perfil del atleta o el perfil del coach, se agrega una versión con fecha a `profileHistory`, solo si algo cambió.
   - La foto no se versiona.
4. **Objetivos.**
   - Tienen `startDate`, `targetDate` (meta opcional) y `endDate` (cuándo terminó).
   - Un objetivo con fase nueva (`cutting`, `bulking`, `recomp`, `maintenance`) cierra el objetivo de fase vigente con `status: "replaced"`.
   - Cerrarlo a mano lo marca `status: "done"`.
5. **Cambios de rutina.**
   - Se guarda una foto de la rutina por cada día en que cambia, con `action`: `snapshot` (la primera vez), `created`, `edited` o `deleted`.
   - Si `routineHistory` pasa de unos 700 KB, las fotos más antiguas pierden el cuerpo de la rutina (`routine: null`, `trimmed: true`), pero conservan fecha, acción y nombre.
6. **Registro corporal.**
   - Hay una entrada por día. Volver a registrar el mismo día actualiza esa entrada.
   - Si una edición cambia algo, los valores anteriores se agregan a `revisions` de la entrada.
   - Borrar una entrada es una acción explícita del usuario.
7. **Series.** Cada serie nueva lleva `at` (hora en que se registró) y cada sesión nueva `startedAt`. Las sesiones anteriores no tienen esos campos.
8. **Borrado (pantalla Datos).**
   - Al borrar una categoría, la lista queda vacía y se guarda `wipedAt`.
   - Al combinar, se descarta todo lo que se **agregó** antes de `wipedAt`. Así un dispositivo con una copia vieja no puede revivir lo borrado.
   - Lo que cuenta es `addedAt` (cuándo entró el registro a la app) y, si no lo tiene, su fecha (`dateISO` o `createdAt`). Un registro con fecha antigua que se agrega **después** de un borrado debe llevar `addedAt` = ahora, o se perdería. Los datos de prueba lo llevan.

**Compatibilidad:** los datos antiguos se siguen leyendo sin migración. Los campos nuevos son opcionales: `at`, `startedAt`, `addedAt`, `revisions`, las medidas `hips` y `neck`, y `wipedAt`.

## 3. Formato de cada registro

### Rutina (`data/routines`, lista)
```json
{ "id": "idm1abc", "name": "PPL", "icon": "🔁", "complexity": 2,
  "workouts": [ { "id": "…", "name": "Push 1",
    "exercises": [ { "id": "…", "name": "Barbell Bench Press", "meta": "Primary · Horizontal Push",
      "unit": "kg", "restSeconds": 150,
      "muscles": [ { "key": "chest", "role": "primary" }, { "key": "triceps", "role": "secondary" } ],
      "sets": [ { "reps": 8, "rir": 2, "weight": 82.5, "type": "working", "tempo": "3-1-1", "note": "",
                  "dropsets": [ { "reps": 6, "weight": 60 } ] } ] } ] } ] }
```

- `complexity`: 1 = simple, 2 = normal, 3 = avanzado.
- `type`, `tempo`, `note` y `dropsets` son opcionales (nivel avanzado). Los tipos de serie son `working`, `warmup`, `backoff`, `amrap`, `restpause` y `cluster`.
- Músculos (`key`): `chest`, `shoulders`, `triceps`, `biceps`, `upperback`, `lats`, `glutes`, `quads`, `hamstrings`, `calves`. El `role` es `primary` o `secondary`, y un músculo aparece una sola vez por ejercicio.
  - **La lista es cerrada, son solo esos 10.** No existen `abs`/core, antebrazos ni trapecios.
  - Al importar una rutina, `back`/`lowerback`/`erector`/`traps` pasan a `upperback` y `forearms` a `biceps`. Cualquier otra clave (por ejemplo `abs`) se descarta y el ejercicio queda sin ese músculo.
  - Consecuencia: el volumen semanal por músculo nunca incluye abdomen.
- Validaciones:
  - `reps`: entero ≥ 0.
  - `rir`: entero de 0 a 10.
  - `weight`: ≥ 0 (0 = peso corporal).

### Sesión (`data/journal`, lista de la más nueva a la más vieja)
```json
{ "id": "idm1xyz", "dateISO": "2026-10-05T18:40:00.000Z", "startedAt": "2026-10-05T17:35:00.000Z",
  "routineName": "PPL", "workoutName": "Push 1", "durationSec": 3900,
  "totalVolumeKg": 5230, "totalSets": 14,
  "exercises": [ { "exId": "…", "name": "Barbell Bench Press", "unit": "kg",
    "muscles": [ { "key": "chest", "role": "primary" } ],
    "sets": [ { "setNum": 1, "target": { "reps": 8, "weight": 82.5, "rir": 2 },
                "actual": { "reps": 8, "weight": 82.5, "rir": 2 }, "at": "2026-10-05T17:41:12.000Z" } ] } ] }
```

- `dateISO` es la hora en que se terminó la sesión.
- `target` es lo prescrito y `actual` lo hecho.
- Solo se guardan las series registradas. Un ejercicio saltado no aparece en la sesión.

### Registro corporal (`data/bodyLog`, lista)
```json
{ "id": "…", "date": "2026-10-05", "weightKg": 78.4, "bodyFatPercent": 17.5, "bodyFatMethod": "báscula bioimpedancia",
  "measurementsCm": { "waist": 82, "chest": 104, "arm": 38, "thigh": 58, "hips": 96, "neck": 39 },
  "note": "", "createdAt": "…", "updatedAt": "…",
  "revisions": [ { "replacedAt": "…", "date": "2026-10-05", "weightKg": 78.9, "bodyFatPercent": null,
                   "bodyFatMethod": null, "measurementsCm": { … }, "note": "" } ] }
```

- Los campos que no se midieron van en `null`.
- Límites: peso ≤ 500 kg, grasa ≤ 75 %, medidas ≤ 300 cm.

### Perfil del atleta (`users/{uid}.profile`)
```json
{ "name": "Ana", "sex": "female", "age": 28, "heightCm": 165, "weightKg": 60, "bodyFat": 22, "photo": "data:image/…" }
```

- `sex` es `male` o `female`.
- El peso y la grasa vigentes salen del **registro corporal** cuando existe. Los del perfil quedan como respaldo.

### Perfil del coach (`data/coachProfile`)
```json
{ "goal": { "phase": "cutting", "aestheticGoal": "cintura marcada", "priorityMuscles": ["shoulders"] },
  "experience": "intermedio", "availability": { "daysPerWeek": 4, "sessionMinutes": 75 },
  "equipment": "gimnasio completo", "preferences": { "liked": ["press inclinado"], "avoided": ["sentadilla búlgara"] },
  "limitations": "", "nutrition": { "calories": 2300, "proteinG": 160 },
  "coachSettings": { "mode": "test", "reactionLevel": "conservative", "responseLength": "short",
                     "certaintyLabels": "whenRelevant", "explanationStyle": "" } }
```

- `phase` es `cutting`, `bulking`, `recomp`, `maintenance` o `""`.
- Valores posibles de `coachSettings`:
  - `mode`: `test` | `normal`
  - `reactionLevel`: `conservative` | `proactive`
  - `responseLength`: `short` | `detailed`
  - `certaintyLabels`: `always` | `whenRelevant`
- `sex`, `age` y `heightCm` no se guardan aquí: se toman del perfil del atleta.

### Versión de perfil (`data/profileHistory`)
```json
{ "id": "…", "source": "profile" | "coach", "createdAt": "…", "updatedAt": "…", "data": { …perfil sin foto o perfil del coach… } }
```

### Objetivo (`data/goals`)
```json
{ "id": "…", "phase": "cutting" | null, "description": "Bajar a 15% de grasa", "startDate": "2026-09-01",
  "targetDate": "2026-12-01" | null, "endDate": null, "status": "active" | "done" | "replaced",
  "createdAt": "…", "updatedAt": "…", "deletedAt": "…opcional…" }
```

Un objetivo está vigente cuando `endDate` es `null` y no tiene `deletedAt`.

### Lesión o nota (`data/notes`)
```json
{ "id": "…", "type": "injury" | "note", "date": "2026-10-01", "text": "Molestia hombro derecho en press militar",
  "resolvedDate": null, "createdAt": "…", "updatedAt": "…" }
```

### Cambio de rutina (`data/routineHistory`)
```json
{ "id": "…", "routineId": "idm1abc", "name": "PPL", "action": "snapshot" | "created" | "edited" | "deleted",
  "date": "2026-10-05", "createdAt": "…", "updatedAt": "…", "routine": { …rutina completa… } | null, "trimmed": true }
```

`trimmed` solo aparece si se recortó.

### Meta por ejercicio (`data/exerciseGoals`, objeto)
```json
{ "PPL::Push 1::Barbell Bench Press": { "startWeight": 80, "targetWeight": 90,
  "startISO": "2026-09-06T05:00:00.000Z", "deadlineISO": "2026-11-05T05:00:00.000Z" } }
```

La clave es `rutina::workout::ejercicio`. Los pesos están en la unidad de ese ejercicio en la rutina.

## 4. Unidades y conversión

| `unit` | Significado |
|---|---|
| `kg` | kilogramos (barra o máquina, peso total) |
| `lb` | libras (peso total) |
| `kg_db` | kg **por mancuerna** |
| `lb_db` | lb **por mancuerna** |

- Los pesos de las series y de las metas siempre están en la unidad de su ejercicio.
- Para pasar a kg totales: `lb × 0.453592`. Las unidades `*_db` se multiplican por 2 (dos mancuernas).
- El peso corporal va en kg y las medidas en cm.
- `totalVolumeKg` de una sesión ya está convertido a kg.

## 5. `journalExport` (botones del War Journal)

Siempre va envuelto en `journalExport`. Tiene dos tipos.

**`type: "journal"`** (botón ⤓ en una sesión):
```json
{ "journalExport": {
  "app": "GymAI", "version": 2, "type": "journal", "exportedAt": "ISO",
  "athlete": { …perfil del coach completo, con sex/age/heightCm… },
  "bodyLog": [ …solo la entrada más reciente… ],
  "activeRoutine": "nombre de la rutina de la sesión más reciente",
  "sessions": [ { "id", "date", "routine", "workout", "durationMin", "totalVolumeKg", "totalSets",
    "exercises": [ { "name", "unit", "muscles", "sets": [ { "set", "target": {reps,weight,rir}, "actual": {reps,weight,rir} } ] } ] } ]
} }
```

**`type: "superJournal"`** (botón «Super Journal», con selector de periodo: 4/8/12 semanas, todo o rango). Agrega o cambia estos campos:

- `bodyLog`: todas las entradas del periodo.
- `sessions`: las del periodo, de la más vieja a la más nueva.
- `routines`: las rutinas completas.
- `period`: `{from, to}`, o `null` si se exportó todo el historial.
- `totals`: `{sessions, firstSession, lastSession}`.

## 6. `coachReport` (informe compacto para el coach)

Es un resumen, no todo el historial: unos 25 KB con varias semanas de datos. Se genera y descarga solo en el dispositivo, sin enviarlo a ningún servidor.

```json
{
  "app": "GymAI", "type": "coachReport", "schemaVersion": 1, "generatedAt": "ISO",
  "units": { "weights": "en la unidad de cada ejercicio (campo unit)", "legend": { "kg": "kg", "lb": "lb", "kg_db": "kg por mancuerna", "lb_db": "lb por mancuerna" },
             "bodyWeight": "kg", "measurements": "cm", "toKg": "lb × 0.453592; *_db = por mancuerna (×2 para el total)" },
  "window": { "weeks8From": "YYYY-MM-DD (lunes)", "sessionDetailFrom": "hoy-14d", "bodySeriesFrom": "hoy-112d", "today": "YYYY-MM-DD" },
  "athlete": { …perfil del coach completo… },
  "goals": {
    "coachProfileGoal": { "phase", "aestheticGoal", "priorityMuscles" },
    "active": [ { "phase", "description", "startDate", "targetDate" } ],
    "exerciseGoals": [ { "routine", "workout", "exercise", "unit", "startWeight", "targetWeight", "startDate", "deadline" } ]
  },
  "injuriesAndNotes": {
    "activeInjuries": [ { "date", "text" } ],
    "recent": [ { "date", "type", "text", "resolvedDate" } ]
  },
  "body": {
    "latest": { "weightKg", "weightDate", "bodyFatPercent", "bodyFatDate", "bodyFatMethod", "measurementsCm": {…}, "measurementDates": {…} },
    "weight": [ { "date", "kg" } ],
    "bodyFat": [ { "date", "pct", "method" } ],
    "measurements": [ { "date", "waist": 82, "neck": 38 } ],
    "weeklyAvgWeightKg": [ { "weekStart", "avg", "n" } ]
  },
  "activeRoutine": { "name", "workouts": [ { "name", "exercises": [ { "name", "unit", "restSeconds", "muscles", "sets": [ {reps,weight,rir} ] } ] } ] },
  "exercises": [ {
    "exercise": "Bench", "unit": "kg", "muscles": [ … ],
    "bestSet": { "date", "e1rm", "reps", "weight", "rir" },
    "lastSession": { "date", "routine", "workout", "sets": [ { "target": {…}, "actual": {…} } ] },
    "trend": [ { "date", "sets", "top": {reps,weight,rir}, "target": {reps,weight,rir}, "metTarget": true, "e1rm" } ],
    "e1rmChange": 3.2
  } ],
  "weeklyDirectSetsByMuscle": [ { "weekStart", "partial": false, "sets": { "chest": 12, "shoulders": 8 } } ],
  "adherence": { "plannedPerWeek": 4, "weeks": [ { "weekStart", "done", "partial" } ], "fullWeeks": 7, "done": 25, "planned": 28, "pct": 89 },
  "skippedExercises": {
    "bySession": [ { "date", "routine", "workout", "planSource": "routineHistory" | "currentRoutine",
                     "skipped": [ "Fly" ], "incomplete": [ { "exercise", "setsDone", "setsPlanned" } ] } ],
    "countByExercise": { "Fly": 5 }
  },
  "recentSessions": [ { "date", "startedAt", "routine", "workout", "durationMin",
    "exercises": [ { "name", "unit", "sets": [ { "set", "target", "actual", "at" } ] } ] } ]
}
```

**Cómo se calcula cada bloque:**

- **`exercises`**
  - Incluye los ejercicios hechos en las últimas 8 semanas. Se agrupan por nombre y unidad.
  - `bestSet` es la mejor serie de todo el historial según el 1RM estimado (Epley: `peso × (1 + reps/30)`), en la unidad del ejercicio.
  - `trend` son las últimas 6 sesiones, con la serie más pesada de cada una contra su objetivo.
  - `e1rmChange` es el último 1RM estimado de `trend` menos el primero.
- **`weeklyDirectSetsByMuscle`**
  - Cuenta las series con reps > 0 de cada ejercicio, solo para los músculos donde es `primary`.
  - Abarca 8 semanas (de lunes a domingo). La semana actual va con `partial: true`.
- **`adherence`**
  - Lo planeado sale de `athlete.availability.daysPerWeek`.
  - `pct` usa solo semanas completas. Es `null` si no hay días por semana configurados **o si no hay ninguna sesión en las últimas 8 semanas** (no es un 0 %: es «sin datos»).
- **`skippedExercises`**
  - Compara cada sesión de las últimas 8 semanas con el plan de ese día: la versión de la rutina vigente esa fecha en `routineHistory`, o la rutina actual si no hay historial.
  - `skipped` son los ejercicios planeados que no aparecen en la sesión.
  - `incomplete` son los ejercicios con menos series que las planeadas.
- **`recentSessions`**: detalle completo de los últimos 14 días, de la más nueva a la más vieja.
- **`body`**
  - Las series de peso, grasa y medidas cubren las últimas 16 semanas.
  - El promedio semanal de peso cubre las últimas 8 semanas.
- **`schemaVersion`**: sube cuando cambie el formato. Una Skill debe comprobarlo antes de leer.

## 7. Cómo regenerar los archivos

- **Informe para el coach:** está en Perfil ▸ «Perfil del coach» ▸ **📋 Informe para el coach**, en Routine Manager ▸ War Journal ▸ **📋 Informe para el coach**, y en Routine Manager ▸ **🗄 Datos**. Desde la consola del navegador (con sesión iniciada): `buildCoachReport()` devuelve el objeto y `exportCoachReport()` lo descarga.
- **Una sesión:** War Journal ▸ sesión ▸ **⤓**.
- **Super Journal:** War Journal ▸ elegir periodo ▸ **⤓ Super Journal (coach)**.
- **Respaldo completo:** Routine Manager ▸ 🗄 Datos ▸ **⤓ Respaldo completo**. Genera `type: "dataBackup"` con todas las listas, el perfil y el perfil del coach.

## 8. Pantallas de mantenimiento

- **🗄 Datos** (Routine Manager): borra por categoría: sesiones; peso corporal y medidas; objetivos y notas; todo menos rutinas; y por separado, mis rutinas.
  - Antes de borrar muestra cuántos registros se van, ofrece un respaldo JSON y exige escribir `BORRAR`.
  - Borra en el dispositivo y en la nube de **esa cuenta**.
  - «Todo menos mis rutinas» conserva las rutinas, el perfil y el perfil del coach.
  - Si se borran las rutinas, la app vuelve a cargar las rutinas de ejemplo.
- **🔍 Modo inspección** (dentro de Datos, provisional): muestra por categoría el conteo, los últimos 5 registros y la última vez guardado en el dispositivo y en la nube.
  - Es solo lectura.
  - Para quitarlo, borra el bloque `INSPECTION MODE (temporary)` de `HTML/index.html`, la entrada `inspect:viewInspect` en `renderRM()` y el botón «Modo inspección» en `viewData()`.

## 9. Datos de prueba

En Routine Manager ▸ 🗄 Datos ▸ **🧪 Cargar datos de prueba** se agregan a la cuenta unas 9 semanas de historial realista. Sirven para probar la Skill sin tener que entrenar semanas:

- **Rutina** `Upper/Lower Hipertrofia (demo)`: 4 días por semana. Hay ejercicios en `kg`, `kg_db` y `lb`.
- **Cambio de rutina:** a la mitad del periodo, «Extensión de cuádriceps» se reemplaza por «Sentadilla búlgara». Así se prueba `planSource: "routineHistory"`.
- **Unas 30 sesiones**, con:
  - progresión de cargas cada 2 semanas;
  - una semana de descarga (pesos −10 %, RIR +2);
  - un estancamiento en press banca al final;
  - ejercicios saltados (press militar durante una molestia de hombro, laterales a veces);
  - 4 sesiones no hechas, para que la adherencia quede cerca del 86 %.
- **Registro corporal:** 3 pesajes por semana en déficit (≈ −0.35 kg/semana), % de grasa cada 2 semanas y medidas cada 4.
- **Objetivos:** «Volumen» cerrado como `replaced`, «Definición» vigente y una meta de press banca, más una meta por ejercicio.
- **Lesiones y notas:** hombro (ya resuelta), rodilla (activa), la nota de la semana de descarga y una de mal sueño.
- **Perfil del coach:** se llena solo si estaba vacío. Queda en `cutting`, 4 días/semana y 2300 kcal / 170 g de proteína.

Todo lo agregado lleva `demo: true` o un `id` que empieza con `demo-`. El botón **✕ Quitar datos de prueba** borra exactamente eso, en el dispositivo y en la nube, sin tocar los datos reales. El perfil del coach se queda como esté.

## 10. Límites conocidos

- `data/journal` es un solo documento. Con unos cientos de sesiones se acercará al límite de 1 MiB de Firestore. Si pasa, habrá que repartir el journal en varios documentos.
- Las sesiones anteriores a esta versión no tienen `startedAt` ni `at` por serie.
- La detección de ejercicios saltados usa el nombre del ejercicio. Si se renombra un ejercicio en la rutina, las sesiones viejas lo verán como «saltado» contra la rutina actual, salvo que exista una foto de ese día en `routineHistory`.
