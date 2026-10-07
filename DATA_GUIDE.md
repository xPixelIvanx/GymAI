# GymAI — Guía de datos

Esta guía explica cómo GymAI guarda los datos de entrenamiento y cómo se conectan con una Skill de coaching (p. ej. `coach-gym`). Todo el código vive en `HTML/index.html`.

## 0. Para la Skill: qué puede leer y qué puede escribir

| Sentido | Archivo | Formato | Cómo lo obtiene el usuario |
|---|---|---|---|
| La Skill **lee** | **Informe para el coach** | `coachReport` (sección 6) | Datos ▸ Exportar y respaldo ▸ 📋 Informe para el coach |
| La Skill **lee** | **Informe del programa** (programa activo, terminado o cancelado) | `coachReport` con `window.scope: "program"` (sección 6) | Programas ▸ abrir el programa ▸ ⤓ Informe del programa |
| La Skill **lee** | Super Journal / una sesión | `journalExport` (sección 5) | Datos ▸ Super Journal · o ⤓ dentro de una sesión |
| La Skill **lee** | Respaldo completo | `dataBackup` | Datos ▸ ⤓ Respaldo completo |
| La Skill **escribe** | **Programa** (con sus rutinas) | `program` (sección 7) | Programas ▸ ⤒ Importar programa |
| La Skill **escribe** | Una rutina suelta | `routine` (`ROUTINE_TEMPLATE.json`) | Routine Manager ▸ ⤒ Import Routine |

Flujo normal: el usuario sube el **informe**; la Skill lo analiza y le devuelve un **programa** (un `.json` con metas, nutrición, checkpoints y las rutinas); el usuario lo importa, revisa el resumen y lo activa. Después la Skill vuelve a leer un informe nuevo para ver cómo va: con un programa activo, el informe trae el bloque `program` (metas, nutrición, checkpoints, ajustes y **plan vs. realizado**), y al terminar el programa el **informe del programa** incluye un resumen final.

**La app no guarda nada en servidores de la Skill**: todo pasa por archivos que el usuario descarga y sube a mano.

Archivos de referencia en el repo: `PROGRAM_TEMPLATE.json` (programa comentado, se puede importar tal cual), `ROUTINE_TEMPLATE.json` (rutina comentada) y esta guía.

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
| `data/programs` | `gymAI_hist_programs_v1` | Programas (plan con fechas) | Se combina por `id`; si dos dispositivos editan el mismo programa a la vez, gana la edición más reciente. |

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

9. **Programas.**
   - Solo hay **un programa activo**. Activar otro cierra el anterior (`status: "done"` y `endDate` = hoy si todavía no había pasado) y lo anota en la bitácora de ambos.
   - Si se activa un programa cuyo inicio está en el futuro, el inicio se adelanta a hoy (queda anotado).
   - Cambiar calorías, proteína o grasa **agrega** una entrada a `nutrition.history` y a `adjustments`; nunca sobrescribe.
   - Los ajustes y la nutrición solo se agregan. Eliminar un programa es una lápida (`deletedAt`).
10. **Fuente única de los objetivos vigentes.**
    - Con un programa activo, **sus `goals` son los objetivos vigentes** (Perfil y `coachReport.goals.active`, además del bloque `program.goals`), aunque estén vacíos.
    - Sin programa activo, lo son los de `data/goals`.
    - Nunca se copian de uno a otro. El objetivo del perfil del coach (`athlete.goal`) es solo contexto.

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

### Programa (`data/programs`)
```json
{ "id": "…", "name": "Definición octubre–diciembre", "phase": "cutting",
  "status": "planned" | "active" | "done" | "cancelled",
  "startDate": "2026-10-12", "endDate": "2026-12-06",
  "goals": [ { "description": "Bajar a 78.5 kg", "targetDate": "2026-12-06", "metric": "weightKg",
               "startValue": 82, "targetValue": 78.5 } ],
  "routineIds": [ "idm1abc", "idm1abd" ],
  "nutrition": { "calories": 2300, "proteinG": 170, "fatMinG": 60, "notes": "…",
                 "history": [ { "date": "2026-10-07", "calories": 2300, "proteinG": 170, "fatMinG": 60, "reason": "Inicial" } ] },
  "checkpoints": [ { "date": "2026-11-02", "type": "review" | "deload", "note": "…", "doneDate": "2026-11-02" } ],
  "adjustments": [ { "date": "2026-10-07", "change": "Programa activado", "reason": "", "source": "user" | "coach" } ],
  "notes": "…", "createdAt": "…", "updatedAt": "…", "deletedAt": "…opcional…" }
```

- `routineIds` apunta a rutinas de `data/routines` (ids). Las rutinas **no** se duplican dentro del programa.
- `goals[].metric`: `weightKg`, `bodyFatPercent`, `waistCm`, `exerciseWeight` (lleva `exercise`) u `other` (sin cálculo automático).
- `nutrition.history` y `adjustments` solo crecen. `doneDate` aparece cuando se marca un checkpoint como hecho.
- Un programa **no copia** sesiones ni registro corporal: se asocian por fechas (`startDate`–`endDate`).
- Qué mide la app como progreso de una meta (se calcula al mostrarla, no se guarda):

  | `metric` | «Valor actual» | Unidad |
  |---|---|---|
  | `weightKg` | último peso del registro corporal | kg |
  | `bodyFatPercent` | último % de grasa del registro corporal | % |
  | `waistCm` | última cintura del registro corporal | cm |
  | `exerciseWeight` | el mayor peso registrado en ese ejercicio desde `startDate` (se busca por nombre, sin distinguir mayúsculas ni espacios extra) | la unidad del ejercicio |
  | `other` | — (seguimiento manual) | — |

  El porcentaje es `(actual − inicio) / (objetivo − inicio)` entre 0 y 100. La barra va en verde si va al ritmo del tiempo transcurrido (con 10 puntos de margen) y en naranja si va atrasada.

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

## 5. `journalExport` (Super Journal y exportar una sesión)

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

Es un resumen, no todo el historial. Con 9 semanas de datos pesa unos **65–70 KB**. Desde `schemaVersion: 2` el archivo se escribe **compacto** (sin sangrías; antes llegaba a unos 115–125 KB). Casi todo el peso está en `exercises` y `recentSessions`; el bloque `program` suma unos 3–4 KB. Se genera y descarga solo en el dispositivo, sin enviarlo a ningún servidor.

### Versiones del formato

| Formato | Versión actual | Dónde está el número |
|---|---|---|
| `coachReport` | `schemaVersion: 2` | raíz del archivo |
| `journalExport` | `version: 2` | dentro de `journalExport` |
| Archivo de programa (el que importa la app) | `version: 1` | raíz; obligatorio y exacto |
| `dataBackup` | sin número | se reconoce por `type: "dataBackup"` |

Historia del `coachReport`:

| `schemaVersion` | Qué trae |
|---|---|
| **1** | Las 16 claves de `app` a `recentSessions`. Con un programa activo solo cambiaba `goals.active`. El archivo llevaba sangría. |
| **2** | **Todo lo de la versión 1 igual** (mismas claves y mismo significado) **más**: la clave `program` (sección «El bloque `program`») y `window.scope`, `window.from`, `window.to`. Archivo compacto. |

**Regla de compatibilidad:** una versión nueva solo **agrega** claves; nunca quita ni renombra las anteriores. La Skill debe leer `schemaVersion` primero, usar `program` solo si es 2 o más, e ignorar las claves que no conozca.

### Dos alcances del mismo informe

- **Informe general** (Datos ▸ Informe para el coach): las últimas 8 semanas, más el bloque `program` del programa activo (o `null`). `window.scope` = `"last8weeks"`.
- **Informe del programa** (Programas ▸ programa ▸ ⤓ Informe del programa): el **mismo formato**, pero todo limitado a `[startDate, min(endDate, hoy)]`. `window.scope` = `"program"`. Ver «Informe del programa» más abajo.

**Con un programa activo,** `goals.active` lista **las metas del programa** (`phase` = fase del programa, `startDate` = inicio del programa, `targetDate` = fecha de la meta o fin del programa). El detalle completo (progreso, nutrición, checkpoints…) va en `program`.

```json
{
  "app": "GymAI", "type": "coachReport", "schemaVersion": 2, "generatedAt": "ISO",
  "units": { "weights": "en la unidad de cada ejercicio (campo unit)", "legend": { "kg": "kg", "lb": "lb", "kg_db": "kg por mancuerna", "lb_db": "lb por mancuerna" },
             "bodyWeight": "kg", "measurements": "cm", "toKg": "lb × 0.453592; *_db = por mancuerna (×2 para el total)" },
  "window": { "weeks8From": "YYYY-MM-DD (lunes)", "sessionDetailFrom": "hoy-14d", "bodySeriesFrom": "hoy-112d", "today": "YYYY-MM-DD",
              "scope": "last8weeks" | "program", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "athlete": { …perfil del coach completo… },
  "goals": {
    "coachProfileGoal": { "phase", "aestheticGoal", "priorityMuscles" },
    "active": [ { "phase", "description", "startDate", "targetDate" } ],
    "exerciseGoals": [ { "routine", "workout", "exercise", "unit", "startWeight", "targetWeight", "startDate", "deadline" } ]
  },
  "program": null | { …bloque del programa, ver más abajo… },
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
- **`window`**
  - `scope` dice qué abarca el informe (`"last8weeks"` o `"program"`) y `from` / `to` el rango (fechas locales `AAAA-MM-DD`).
  - `weeks8From`, `sessionDetailFrom` y `bodySeriesFrom` se conservan de la versión 1. Con alcance `program`, `weeks8From` y `bodySeriesFrom` valen `startDate`.
- **`schemaVersion`**: sube cuando cambie el formato. Una Skill debe comprobarlo antes de leer.

### El bloque `program`

Es `null` si no hay programa activo (los planeados no aparecen en el informe general). Con uno activo, describe el programa y lo compara con lo realizado:

```json
"program": {
  "id", "name", "phase", "status": "active" | "planned" | "done" | "cancelled", "startDate", "endDate",
  "weekNumber": 5, "totalWeeks": 8, "notes", "routines": [ "Upper definición" ],
  "goals": [ { "description", "metric", "exercise", "startValue", "targetValue", "targetDate", "current", "unit", "pct", "reached" } ],
  "nutrition": { "current": { "calories", "proteinG", "fatMinG", "notes" },
                 "history": [ { "date", "calories", "proteinG", "fatMinG", "reason" } ] },
  "checkpoints": [ { "date", "type": "review" | "deload", "note", "doneDate" } ],
  "nextCheckpoint": { "date", "type", "note" } | null,
  "adjustmentsTotal": 3,
  "latestAdjustments": [ { "date", "change", "reason", "source": "user" | "coach" } ],
  "planVsActual": {
    "asOf": "YYYY-MM-DD",
    "sessions": { "plannedPerWeek": 4, "weeks": [ { "week", "from", "to", "partial", "planned", "done", "deload" } ],
                  "fullWeeks", "done", "planned", "pct", "doneTotal" },
    "weight": { "startKg", "startDate", "latestKg", "latestDate", "changeKg", "weeklyRatePct" },
    "goals": [ { "description", "expectedPct", "actualPct", "pace": "reached" | "onTrack" | "behind" | null } ]
  },
  "finalSummary": null | { "outcome", "endedOn", "goalsReached", "goalsTotal", "goalsManual", "sessionsDone", "adherencePct", "weightChangeKg", "weeklyRatePct" },
  "legend": { …cuatro textos que explican semanas, plannedPerWeek, peso y ritmo… }
}
```

**Cómo se calcula:**

- **Semana del programa:** `weekNumber` es 0 si todavía no empieza y se queda en `totalWeeks` cuando ya pasó la fecha de fin. Una semana del programa son 7 días contados desde `startDate` (semana 1 = días 1 a 7), **no** semanas de calendario.
- **`goals`**
  - Cada meta lleva su definición y su valor actual, con las reglas de la tabla de la sección 3.
  - `exercise` solo aparece en `exerciseWeight`; `pct` es `null` si no hay dato o la métrica es `other`.
  - En un programa terminado o cancelado, el valor actual se calcula con los datos **hasta su `endDate`**.
- **`nutrition.history` y `latestAdjustments`:** van de lo más nuevo a lo más viejo. Los ajustes son los últimos 10 (`adjustmentsTotal` dice cuántos hay en total).
- **`checkpoints`:** todos. `nextCheckpoint` es el pendiente más cercano con fecha de hoy en adelante. Un checkpoint con `doneDate: null` y fecha pasada está **vencido**.
- **`planVsActual.sessions`**
  - `planned` por semana sale de `athlete.availability.daysPerWeek` (`null` si no está configurado).
  - `weeks` va desde `startDate` hasta hoy o `endDate`. Una sesión cuenta en la semana de su fecha, **sin importar su rutina**.
  - `partial: true` es una semana en curso o recortada por `endDate`: no entra en `fullWeeks`, `done`, `planned` ni `pct`. `doneTotal` sí cuenta **todas** las sesiones del programa.
  - `deload: true` marca la semana en la que cae un checkpoint de descarga.
- **`planVsActual.weight`**
  - `startKg` es el último peso registrado entre 7 días antes del inicio y el inicio; si no hay, el primero después del inicio. `latestKg` es el último hasta hoy o `endDate`.
  - `changeKg` = final − inicial (`null` si no hay dos registros de días distintos).
  - `weeklyRatePct` es el cambio en % del peso inicial **por semana** (negativo = baja). Es `null` si hay menos de 7 días entre los dos registros.
- **`planVsActual.goals`**
  - `expectedPct` es cuánto debería llevar la meta **solo por el tiempo** (días transcurridos entre el inicio y la fecha de la meta o el fin del programa, de 0 a 100). `null` en metas `other`.
  - `actualPct` es el `pct` de `goals`.
  - `pace`: `reached` si llegó al 100 %; `onTrack` si `actualPct` está a 10 puntos o menos de `expectedPct`; `behind` si no; `null` sin dato.
- **`finalSummary`:** solo en programas `done` o `cancelled`; en el resto es `null`. `goalsManual` cuenta las metas `other`, que la app no mide sola.

**Ejemplo real** (lo generó la app con los datos de prueba del apartado 10, el 9-nov-2026, semana 5 del programa de la sección 7; el programa se importó el 12-oct, el 2-nov se marcó la revisión y se bajaron las calorías). Las sesiones salen de los datos de prueba, no de la rutina del programa: por eso `routines` no coincide con ellas; el informe asocia las sesiones por fecha.

```json
"program": {
  "id": "idmv5dp400wdvr",
  "name": "Definición octubre–diciembre",
  "phase": "cutting",
  "status": "active",
  "startDate": "2026-10-12",
  "endDate": "2026-12-06",
  "weekNumber": 5,
  "totalWeeks": 8,
  "notes": "Prioridad: hombros y espalda.",
  "routines": [
    "Upper definición"
  ],
  "goals": [
    { "description": "Bajar de 81.0 a 78.5 kg", "metric": "weightKg", "exercise": null, "startValue": 81, "targetValue": 78.5, "targetDate": "2026-12-06", "current": 79.8, "unit": "kg", "pct": 48, "reached": false },
    { "description": "Press banca de 85 a 90 kg", "metric": "exerciseWeight", "exercise": "Press banca con barra", "startValue": 85, "targetValue": 90, "targetDate": null, "current": 85, "unit": "kg", "pct": 0, "reached": false },
    { "description": "Dormir al menos 7 h", "metric": "other", "exercise": null, "startValue": null, "targetValue": null, "targetDate": null, "current": null, "unit": null, "pct": null, "reached": false }
  ],
  "nutrition": {
    "current": {
      "calories": 2150,
      "proteinG": 170,
      "fatMinG": 60,
      "notes": "Déficit de ~300 kcal"
    },
    "history": [
      { "date": "2026-11-02", "calories": 2150, "proteinG": 170, "fatMinG": 60, "reason": "Ritmo de pérdida en el límite bajo del rango (0.3 kg/semana)" },
      { "date": "2026-10-12", "calories": 2300, "proteinG": 170, "fatMinG": 60, "reason": "Inicial" }
    ]
  },
  "checkpoints": [
    { "date": "2026-11-02", "type": "review", "note": "Revisar ritmo de pérdida", "doneDate": "2026-11-02" },
    { "date": "2026-11-16", "type": "deload", "note": "Semana de descarga", "doneDate": null }
  ],
  "nextCheckpoint": {
    "date": "2026-11-16",
    "type": "deload",
    "note": "Semana de descarga"
  },
  "adjustmentsTotal": 3,
  "latestAdjustments": [
    { "date": "2026-11-02", "change": "Bajo calorías · Nutrición — kcal: 2300 → 2150", "reason": "Ritmo de pérdida en el límite bajo del rango (0.3 kg/semana)", "source": "coach" },
    { "date": "2026-10-12", "change": "Programa activado", "reason": "", "source": "user" },
    { "date": "2026-10-12", "change": "Programa importado", "reason": "", "source": "coach" }
  ],
  "planVsActual": {
    "asOf": "2026-11-09",
    "sessions": {
      "plannedPerWeek": 4,
      "weeks": [
        { "week": 1, "from": "2026-10-12", "to": "2026-10-18", "partial": false, "planned": 4, "done": 4, "deload": false },
        { "week": 2, "from": "2026-10-19", "to": "2026-10-25", "partial": false, "planned": 4, "done": 3, "deload": false },
        { "week": 3, "from": "2026-10-26", "to": "2026-11-01", "partial": false, "planned": 4, "done": 4, "deload": false },
        { "week": 4, "from": "2026-11-02", "to": "2026-11-08", "partial": false, "planned": 4, "done": 3, "deload": false },
        { "week": 5, "from": "2026-11-09", "to": "2026-11-15", "partial": true, "planned": 4, "done": 0, "deload": false }
      ],
      "fullWeeks": 4,
      "done": 14,
      "planned": 16,
      "pct": 88,
      "doneTotal": 14
    },
    "weight": {
      "startKg": 80.9,
      "startDate": "2026-10-12",
      "latestKg": 79.8,
      "latestDate": "2026-11-07",
      "changeKg": -1.1,
      "weeklyRatePct": -0.37
    },
    "goals": [
      { "description": "Bajar de 81.0 a 78.5 kg", "expectedPct": 51, "actualPct": 48, "pace": "onTrack" },
      { "description": "Press banca de 85 a 90 kg", "expectedPct": 51, "actualPct": 0, "pace": "behind" },
      { "description": "Dormir al menos 7 h", "expectedPct": null, "actualPct": null, "pace": null }
    ]
  },
  "finalSummary": null,
  "legend": {
    "weeks": "Semana 1 = los primeros 7 días desde startDate. partial = semana incompleta (en curso o recortada por endDate): no cuenta para el porcentaje.",
    "plannedPerWeek": "Sesiones por semana declaradas en el perfil del coach (availability.daysPerWeek); null si no hay.",
    "weight": "startKg = último registro de los 7 días previos al inicio (o el primero después). weeklyRatePct = cambio % del peso por semana; null con menos de 7 días entre registros.",
    "pace": "onTrack si actualPct está a 10 puntos o menos de expectedPct (avance esperado por tiempo); reached si llegó al 100 %; null si no hay dato."
  }
}
```

### Informe del programa

Se descarga con **⤓ Informe del programa**, dentro del detalle de un programa activo, terminado o cancelado (los planeados todavía no tienen datos). El archivo se llama `gymai-program-report-<nombre>-<fecha>.json`. Es el **mismo formato `coachReport`** (`schemaVersion: 2`), pero todo se limita a `[startDate, min(endDate, hoy)]`:

| Bloque | Diferencia con el informe general |
|---|---|
| `window` | `scope: "program"`; `from` y `to` son el rango del programa; `sessionDetailFrom` es 14 días antes del final del rango (nunca antes del inicio) |
| `exercises` | Solo cuentan las sesiones dentro del rango: `bestSet`, `trend` y `lastSession` salen de ahí, no del historial completo |
| `weeklyDirectSetsByMuscle`, `adherence`, `body.weeklyAvgWeightKg` | Una entrada por **semana del programa** (bloques de 7 días desde `startDate`; `weekStart` es el primer día del bloque). Puede haber más o menos de 8. Las semanas incompletas llevan `partial: true` |
| `body` | Series y `latest` solo hasta el final del rango |
| `recentSessions`, `injuriesAndNotes.recent` | Solo lo que cae dentro del rango (`activeInjuries` sigue siendo lo vigente hoy) |
| `activeRoutine` | La rutina de la última sesión **dentro del rango** |
| `goals.active` | Las metas **de ese programa**, aunque ya no esté activo |
| `program` | Ese programa (no el activo). Si terminó o se canceló, trae `finalSummary` |
| `athlete`, `goals.coachProfileGoal`, `goals.exerciseGoals` | El estado de hoy: no se reconstruye el pasado |

Las sesiones posteriores a `endDate` no cuentan para el programa. Con 4 semanas de un programa y 9 semanas de datos, el archivo pesa unos 55 KB.

**Ejemplo real de `program.finalSummary`** (el mismo programa, cerrado el 9-nov-2026 como «terminado»; en el informe general o con el programa activo vale `null`):

```json
"finalSummary": { "outcome": "done", "endedOn": "2026-11-09", "goalsReached": 0, "goalsTotal": 3, "goalsManual": 1, "sessionsDone": 14, "adherencePct": 88, "weightChangeKg": -1.1, "weeklyRatePct": -0.37 }
```

## 7. Importar un programa (lo que debe generar la Skill)

**Dónde:** Routine Manager ▸ **🗓 Programas** ▸ **⤒ Importar programa** (también sirve el botón ⤒ Import Routine: la app reconoce el tipo `program`).

**Qué pasa al importar:**
1. La app valida **todo** el archivo antes de tocar nada. Si algo es inválido, no importa nada y muestra la lista exacta de problemas.
2. Si es válido, muestra un **resumen** (metas, nutrición, checkpoints, rutinas) y avisos, y el usuario elige **Planeado** o **Activar ahora**.
3. Se crean las **rutinas con ids nuevos**. Si ya existe una rutina con ese nombre, la nueva se llama `Nombre (2)`, `Nombre (3)`…: nunca se pisa una existente.
4. Se crea el programa con `routineIds` apuntando a esas rutinas. Su bitácora registra «Programa importado» (`source: "coach"`) y, si trae nutrición, el historial empieza con una entrada «Inicial».
5. Si se activa, el programa activo anterior se cierra como «terminado».

El archivo **no lleva `status`**: lo elige el usuario al importar. Los campos que la app no conoce se ignoran.

### Formato

Este es un archivo **completo y real**: se importó en la app sin errores (con la pantalla Programas), y es el programa del que sale el ejemplo de la sección 6. Con una sola rutina de un entrenamiento para que sea corto; un programa real lleva las rutinas que haga falta.

```json
{
  "app": "GymAI",
  "version": 1,
  "type": "program",
  "exportedAt": "2026-10-07T15:00:00.000Z",
  "program": {
    "name": "Definición octubre–diciembre",
    "phase": "cutting",
    "startDate": "2026-10-12",
    "endDate": "2026-12-06",
    "goals": [
      { "description": "Bajar de 81.0 a 78.5 kg", "targetDate": "2026-12-06", "metric": "weightKg", "startValue": 81.0, "targetValue": 78.5 },
      { "description": "Press banca de 85 a 90 kg", "metric": "exerciseWeight", "exercise": "Press banca con barra", "startValue": 85, "targetValue": 90 },
      { "description": "Dormir al menos 7 h", "metric": "other" }
    ],
    "nutrition": { "calories": 2300, "proteinG": 170, "fatMinG": 60, "notes": "Déficit de ~300 kcal" },
    "checkpoints": [
      { "date": "2026-11-02", "type": "review", "note": "Revisar ritmo de pérdida" },
      { "date": "2026-11-16", "type": "deload", "note": "Semana de descarga" }
    ],
    "notes": "Prioridad: hombros y espalda.",
    "routines": [
      {
        "name": "Upper definición",
        "icon": "💪",
        "complexity": 2,
        "workouts": [
          {
            "name": "Upper A",
            "exercises": [
              {
                "name": "Press banca con barra", "unit": "kg", "restSeconds": 150,
                "muscles": [ { "key": "chest", "role": "primary" }, { "key": "triceps", "role": "secondary" } ],
                "sets": [ { "reps": 8, "rir": 2, "weight": 85 }, { "reps": 8, "rir": 2, "weight": 85 }, { "reps": 8, "rir": 1, "weight": 85 } ]
              },
              {
                "name": "Elevaciones laterales", "unit": "kg_db", "restSeconds": 60,
                "muscles": [ { "key": "shoulders", "role": "primary" } ],
                "sets": [ { "reps": 15, "rir": 1, "weight": 9 }, { "reps": 15, "rir": 1, "weight": 9 } ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Hay un ejemplo completo e importable en **`PROGRAM_TEMPLATE.json`** (en la raíz del repo).

### Campos y reglas

| Campo | Obligatorio | Regla |
|---|---|---|
| `app` | no | si viene, debe ser `"GymAI"` |
| `version` | **sí** | exactamente `1` |
| `type` | **sí** | exactamente `"program"` |
| `program.name` | **sí** | texto, 1 a 80 caracteres |
| `program.phase` | **sí** | `cutting`, `bulking`, `recomp` o `maintenance` |
| `program.startDate`, `program.endDate` | **sí** | `AAAA-MM-DD` válidas; el fin no puede ser anterior al inicio; máximo 730 días |
| `program.goals` | no | lista de hasta 10 metas |
| `goals[].description` | **sí** | 1 a 120 caracteres |
| `goals[].metric` | **sí** | `weightKg`, `bodyFatPercent`, `waistCm`, `exerciseWeight` u `other` |
| `goals[].startValue`, `targetValue` | **sí**, salvo en `other` | número ≥ 0 dentro del límite de la métrica (ver abajo) |
| `goals[].exercise` | **sí** si la métrica es `exerciseWeight` | nombre del ejercicio, igual que en la rutina (sin distinguir mayúsculas) |
| `goals[].targetDate` | no | `AAAA-MM-DD`; si falta, la meta usa el fin del programa |
| `program.nutrition` | no | `calories` 0–10000 · `proteinG` 0–1000 · `fatMinG` 0–500 (números o `null`) · `notes` ≤ 200 caracteres |
| `program.checkpoints` | no | hasta 40: `date` (`AAAA-MM-DD`), `type` (`review` o `deload`), `note` ≤ 200 |
| `program.notes` | no | texto ≤ 600 caracteres |
| `program.routines` | no | hasta 10 rutinas (ver abajo) |

Límite de las métricas: `weightKg` ≤ 500 · `bodyFatPercent` ≤ 75 · `waistCm` ≤ 300 · `exerciseWeight` ≤ 2000 · `other` ≤ 1 000 000.

### Rutinas dentro del programa

Cada elemento de `program.routines` usa el **mismo formato que Import Routine** (`ROUTINE_TEMPLATE.json`); también se acepta envuelto como `{ "type": "routine", "routine": { … } }`. Reglas que la importación **exige** (no corrige en silencio):

| Qué | Regla |
|---|---|
| Rutina | `name` 1–60 caracteres · `complexity` 1, 2 o 3 (si falta, 2) · 1 a 14 `workouts` |
| Workout | `name` 1–60 · hasta 30 ejercicios |
| Ejercicio | `name` 1–80 · hasta 20 series · `unit` ∈ `kg`, `lb`, `kg_db`, `lb_db` (si falta, `kg`) · `restSeconds` 0–1800 |
| Músculos | cada `key` ∈ `chest`, `shoulders`, `triceps`, `biceps`, `upperback`, `lats`, `glutes`, `quads`, `hamstrings`, `calves`; `role` = `primary` o `secondary`. **No existe `abs`/core** ni antebrazos ni trapecios: un músculo inválido rechaza el archivo. |
| Serie | `reps` **entero** 0–500 · `rir` **entero 0–10** · `weight` 0–2000 (0 = peso corporal) |
| RIR obligatorio | en rutinas `complexity` 2 y 3 toda serie lleva `rir`. En `complexity` 1 (simple) puede faltar. |
| Opcionales por serie | `type` ∈ `working`, `warmup`, `backoff`, `amrap`, `restpause`, `cluster` · `tempo` · `note` · `dropsets` `[{reps, weight}]` |

### Errores típicos (mensajes reales de la app)

| Problema en el archivo | Mensaje |
|---|---|
| RIR fuera de rango | `Rutina «Upper A» › Upper A › Press banca › serie 1: el RIR debe ser un entero de 0 a 10 (llegó 12)` |
| Falta el RIR | `… › serie 2: falta el RIR (entero de 0 a 10)` |
| Reps decimales | `… › serie 1: reps debe ser un entero de 0 a 500 (llegó 8.5)` |
| Unidad inválida | `… › Remo con barra: unidad «stone» no válida (usa kg, lb, kg_db, lb_db)` |
| Músculo inválido | `… › Press banca: clave de músculo «abs» no válida (usa chest, shoulders, …)` |
| Fase inválida | `Programa: fase «shred» no válida (usa cutting, bulking, recomp, maintenance)` |
| Fechas al revés | `Programa: endDate debe ser igual o posterior a startDate` |
| Métrica inválida | `Meta 3: métrica «vibes» no válida (usa weightKg, bodyFatPercent, waistCm, exerciseWeight, other)` |
| Falta el ejercicio | `Meta 4: falta el nombre del ejercicio` |
| Versión | `Versión no soportada: se esperaba "version": 1 y llegó 2` |

### Consejos para que el archivo salga bien a la primera

- **Usa los nombres de ejercicio del histórico** (`exercises[].exercise` del informe). El progreso de las metas `exerciseWeight` y la detección de ejercicios saltados comparan por nombre.
- **Pon pesos iniciales realistas** a partir de `bestSet` y `lastSession` del informe, **en la unidad de cada ejercicio** (`kg_db` = por mancuerna).
- **Un nombre de rutina único y descriptivo.** El journal asocia las sesiones por el nombre de la rutina.
- **Fechas en `AAAA-MM-DD`**, en la fecha local del atleta. Si el usuario activa el programa antes de `startDate`, el inicio se adelanta a hoy.
- **`fatMinG` es un mínimo** de grasa diaria, no una meta a alcanzar. La app **no registra comidas**: solo guarda las metas de nutrición.
- **Metas `exerciseWeight`:** `startValue` y `targetValue` en la unidad del ejercicio, y `exercise` igual al nombre dentro de la rutina.
- **Checkpoints:** una `review` cada 2 a 4 semanas y un `deload` cuando toque descarga.
- No hace falta enviar `status`, `id` ni campos de la bitácora: la app los crea.

### Qué ve la Skill después de importar

- Las rutinas aparecen como rutinas normales (`activeRoutine` y `exercises` del informe se llenan en cuanto el usuario entrena con ellas).
- `goals.active` del informe pasa a ser **las metas del programa** (sección 2, regla 10).
- Con el programa activo, el informe trae el bloque **`program`** (sección 6): metas con su avance, nutrición vigente e historial, checkpoints, últimos ajustes, «semana X de Y» y **plan vs. realizado** (sesiones, peso y ritmo semanal, avance esperado de cada meta).
- Al terminar o cancelar el programa, su **informe del programa** (sección 6) trae además `finalSummary`.

## 8. Cómo regenerar los archivos

Todas las exportaciones de **toda la cuenta** viven en **Routine Manager ▸ 🗄 Datos ▸ Exportar y respaldo**. Las exportaciones de **un elemento** están en ese elemento.

| Qué | Dónde |
|---|---|
| **Informe para el coach** (`coachReport`, alcance `last8weeks`) | Datos ▸ 📋 Informe para el coach. Desde la consola del navegador (con sesión iniciada): `buildCoachReport()` devuelve el objeto y `exportCoachReport()` lo descarga (compacto). |
| **Informe del programa** (`coachReport`, alcance `program`) | 🗓 Programas ▸ abrir el programa ▸ ⤓ Informe del programa (no aparece en programas planeados). Desde la consola: `exportProgramReport(id)`; `buildCoachReport({program: p})` devuelve el objeto. |
| **Super Journal** (`journalExport` tipo `superJournal`) | Datos ▸ elegir periodo (4, 8 o 12 semanas, todo o rango) ▸ ⤓ Super Journal (coach). |
| **Una sesión** (`journalExport` tipo `journal`) | War Journal ▸ sesión ▸ ⤓ Exportar para el coach. |
| **Respaldo completo** (`dataBackup`) | Datos ▸ ⤓ Respaldo completo. Incluye todas las listas (también `programs`), el perfil y el perfil del coach. No incluye los Documents y **no se puede restaurar desde la app**. |
| **Una rutina** | La tarjeta de la rutina ▸ ⤓. |
| **Importar** una rutina o un programa | Routine Manager ▸ ⤒ Import Routine (rutina) · 🗓 Programas ▸ ⤒ Importar programa (programa). |

## 9. Pantallas de mantenimiento

Todo lo temporal o de desarrollo está agrupado en **Datos ▸ Herramientas**, separado del uso normal:

- **Borrar datos** por categoría: sesiones; peso corporal y medidas; objetivos y notas; todo menos rutinas; y por separado, mis rutinas.
  - Antes de borrar muestra cuántos registros se van, ofrece un respaldo JSON y exige escribir `BORRAR`.
  - Borra en el dispositivo y en la nube de **esa cuenta**.
  - «Todo menos mis rutinas» conserva las rutinas, el perfil y el perfil del coach, y **sí borra los programas**.
  - Si se borran las rutinas, la app vuelve a cargar las rutinas de ejemplo.
  - El botón «🗑 Borrar sesiones…» del War Journal abre esta misma pantalla.
- **🔍 Modo inspección** (provisional): por categoría muestra el conteo, los últimos 5 registros y la última vez guardado en el dispositivo y en la nube. Es solo lectura. Para quitarlo, borra el bloque `INSPECTION MODE (temporary)` de `HTML/index.html`, la entrada `inspect:viewInspect` en `renderRM()` y el botón «Modo inspección» en `viewDataTools()`.
- **🧪 Datos de prueba** (provisional): ver la sección siguiente.

## 10. Datos de prueba

En Routine Manager ▸ 🗄 Datos ▸ Herramientas ▸ **🧪 Cargar datos de prueba** (o **↻ Recargar datos de prueba** si quedó a medias) se agregan a la cuenta unas 9 semanas de historial realista. Sirven para probar la Skill sin tener que entrenar semanas:

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

## 11. Límites conocidos

- `data/journal` es un solo documento. Con unos cientos de sesiones se acercará al límite de 1 MiB de Firestore. Si pasa, habrá que repartir el journal en varios documentos.
- Las sesiones anteriores a esta versión no tienen `startedAt` ni `at` por serie.
- La detección de ejercicios saltados usa el nombre del ejercicio. Si se renombra un ejercicio en la rutina, las sesiones viejas lo verán como «saltado» contra la rutina actual, salvo que exista una foto de ese día en `routineHistory`.
- Programas: si dos dispositivos editan el mismo programa casi a la vez, gana el último en guardar y podría perderse un ajuste, una entrada de nutrición o un checkpoint hecho en el otro (el programa se combina completo, no campo por campo).
- Tamaño del informe: con 9 semanas de datos densos pesa unos 65–70 KB, sobre todo por `exercises` y `recentSessions`. Si hiciera falta bajarlo habría que recortar campos (no se ha hecho).
- Programas y sesiones: las sesiones se asocian por **fecha**, no por rutina. Si el usuario entrena otra rutina durante el programa, igual cuentan.
- `plannedPerWeek` sale del perfil del coach **de hoy**: si cambia a mitad del programa, se aplica a todas las semanas.
- Un programa activo que ya pasó su `endDate` sigue activo hasta que el usuario lo cierre: `weekNumber` se queda en la última semana y las sesiones posteriores a `endDate` no cuentan.
- Los datos de prueba no incluyen ningún programa; se prueba importando `PROGRAM_TEMPLATE.json`.
- El respaldo completo no incluye los Documents ni se puede restaurar desde la app.
- No existe el músculo abdomen (`abs`): la lista de 10 músculos es cerrada.

## 12. Qué se movió o se quitó en el orden de la app

El orden (Fase 1) **no cambió ningún formato de datos**: los 11 archivos exportados (informe, sesión, Super Journal, respaldos y rutinas) y la importación de rutinas salían byte por byte iguales antes y después de reordenar. Los cambios de formato vinieron después y están en las secciones 3 y 6 (programas e informe `schemaVersion: 2`).

**Pantallas**

| Antes | Ahora |
|---|---|
| El selector de periodo y el botón del Super Journal estaban en la barra del War Journal | Están en **Datos ▸ Exportar y respaldo**, junto al informe y al respaldo completo |
| «📋 Informe para el coach» también estaba en la tarjeta del coach (Perfil) | Quitado de ahí: el informe se descarga solo desde Datos |
| «Clear Journal» (un `confirm` simple) | «🗑 Borrar sesiones…»: abre Datos ▸ Borrar datos, con respaldo y escribir `BORRAR` |
| Datos mezclaba lo de uso normal con lo temporal | Datos muestra primero **Exportar y respaldo** y, aparte, **Herramientas** (borrar por categoría, datos de prueba, modo inspección) |
| Exportar una sesión o una rutina | Igual: siguen en la sesión y en la tarjeta de la rutina |

Regla actual: las exportaciones de **toda la cuenta** viven solo en Datos; las de **un elemento** están en ese elemento.

**Código (`HTML/index.html`).** El script está dividido en secciones con encabezado `§ N · NOMBRE` (se busca por ese texto):

| § | Qué contiene |
|---|---|
| 1 | NÚCLEO: utilidades, fechas, unidades |
| 2 | DATOS Y SINCRONIZACIÓN: listas que solo se agregan, combinar por `id`, marcadores de borrado |
| 3 | RUTINAS |
| 4 | PROGRAMAS: datos, pantalla, importar |
| 5 | JOURNAL Y SESIÓN |
| 6 | PROGRESIONES IA |
| 7 | CUERPO: registro corporal |
| 8 | PERFIL Y COACH, objetivos y notas (`goalsActive()`) |
| 9 | SOCIAL |
| 10 | INFORMES: `buildCoachReport`, `exportCoachReport`, `exportProgramReport`, `journalExport`, Super Journal |
| 11 | AJUSTES Y MANTENIMIENTO: pantalla Datos (exportar y respaldo) y el catálogo `DATA_PARTS` / `DATA_CATS` |
| 12 | HERRAMIENTAS (temporales): borrar datos, datos de prueba, modo inspección |
| 13 | ARRANQUE |

**Quitado** (sin ninguna referencia en el archivo): `rmRenameWorkout`, `rmDeleteWorkout` (la pantalla usa las versiones `*Inline`), `profileEmpty` (la reemplaza `profileAuthView`) y `crewTierColor`.

**Pendiente de decidir** (siguen en el código, sin usarse): `calcBenchRank`, `exportBackup`, `guardarConocimientoYoutube`, `cloudSubscribeNotifs` y `notifyFriends`.
