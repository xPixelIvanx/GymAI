# Formatos de datos de GymAI

Esta referencia describe los archivos que produce la app del usuario
(GymAI / Routine Manager). Úsala para interpretar cualquier archivo que
el usuario adjunte con el campo raíz `journalExport`.

## Cómo reconocer qué te dieron

Todo lo que exporta la app viene envuelto así, sea una sesión o un
historial completo:

```json
{ "journalExport": { "app": "GymAI", "version": 2, "type": "...", ... } }
```

El campo `type` dice qué contiene:

| `type` | Qué es | Trae `period` y `totals` |
|---|---|---|
| `"journal"` | Una sesión (o un conjunto chico exportado desde el War Journal) | No |
| `"superJournal"` | El Super Journal: perfil + cuerpo + sesiones de un periodo | Sí |

En ambos casos, el objeto trae siempre `athlete`, `bodyLog`, `activeRoutine`
y `sessions`. El Super Journal añade `routines`, `period` y `totals`.

## Rutina (plan prescrito)

Es un archivo separado (no viene dentro de `journalExport`), exportado o
importado desde la rutina misma:

```json
{ "app": "GymAI", "version": 2, "type": "routine", "routine": { ... } }
```

Jerarquía: `routine.workouts[]` → `exercises[]` → `sets[]`. Cada ejercicio
trae `unit`, `restSeconds`, `muscles[]` (con `key` y `role`: `primary` o
`secondary`) y sus series objetivo (`reps`, `rir`, `weight`).

Esta es la fuente para **lo prescrito**. Las sesiones del journal traen
su propio `target` por serie (ver abajo), que normalmente coincide con la
rutina en el momento en que se hizo esa sesión, pero puede haber quedado
desactualizado si la rutina cambió después.

## `athlete` — perfil del coach

Mismos campos que la plantilla de perfil del usuario. Si el usuario no
ha llenado su Perfil del coach en la app, llegan vacíos o en `null` —
trátalos igual que un perfil no entregado: pide lo que falte si la
decisión lo necesita, no lo asumas.

`coachSettings` indica cómo comportarte. Valores válidos:

| Campo | Valores | Si no coincide con estos valores o viene vacío |
|---|---|---|
| `mode` | `test` \| `normal` | usa `test` |
| `reactionLevel` | `conservative` \| `proactive` | usa `conservative` |
| `responseLength` | `short` \| `detailed` | usa `short` |
| `certaintyLabels` | `always` \| `whenRelevant` | usa `whenRelevant` |

## `bodyLog` — registro corporal

Arreglo de entradas, **de la más reciente a la más antigua**:

```json
{ "id": "", "date": "AAAA-MM-DD", "weightKg": 0, "bodyFatPercent": null,
  "bodyFatMethod": null,
  "measurementsCm": { "waist": null, "chest": null, "arm": null, "thigh": null },
  "note": "" }
```

Todo campo fuera de `date` puede venir en `null`: una entrada puede traer
solo peso, o solo medidas. En el Super Journal, `bodyLog` ya viene
filtrado al periodo exportado (no es todo el historial). `%` de grasa es
siempre una estimación: compara solo entradas con el mismo
`bodyFatMethod`; no compares un valor con otro medido con un método
distinto.

## `sessions` — lo que pasó en el gimnasio

Arreglo de sesiones, **de la más antigua a la más reciente** (orden
opuesto al de `bodyLog`; ordénalas tú si necesitas lo más reciente
primero).

```json
{
  "id": "", "date": "ISO-8601", "routine": "", "workout": "",
  "durationMin": 0, "totalVolumeKg": 0, "totalSets": 0,
  "exercises": [
    {
      "name": "", "unit": "kg | lb | kg_db | lb_db",
      "muscles": [ { "key": "", "role": "primary | secondary" } ],
      "sets": [
        { "set": 1,
          "target": { "reps": 0, "weight": 0, "rir": 0 },
          "actual": { "reps": 0, "weight": 0, "rir": 0 } }
      ]
    }
  ]
}
```

- `target` = lo prescrito para esa serie; `actual` = lo que el usuario
  registró. Compáralos para evaluar si cumplió, se quedó corto o se pasó.
- Solo existen series que el usuario registró. Un ejercicio que no hizo
  **no aparece** en la sesión exportada (no viene vacío ni marcado); para
  detectarlo, compara los ejercicios de la rutina contra los de la
  sesión.
- `totalVolumeKg` y `totalSets` son los totales ya calculados por la app
  para esa sesión completa.

### Unidades (`unit` por ejercicio)

| Valor | Significado |
|---|---|
| `kg` | Kilogramos totales (barra, máquina, etc.) |
| `lb` | Libras totales |
| `kg_db` | Kilogramos **por mancuerna** (una de cada lado) |
| `lb_db` | Libras **por mancuerna** |

La app convierte al registrar: en los journals el peso de cada ejercicio
se guarda en la unidad que define la rutina para ese ejercicio, aunque el
usuario lo haya capturado en otra (si la rutina dice kg, 145 lb se guardan
como kg). Dentro de un mismo ejercicio no hay mezcla de unidades; la
conversión solo hace falta al comparar ejercicios con `unit` distinto, o
el mismo ejercicio si cambió su `unit` entre rutinas.

No sumes ni compares pesos de unidades distintas sin convertir. Un peso
de `0` en un ejercicio sin mancuernas (dominadas, fondos) significa
**peso corporal**: el progreso ahí se mide en repeticiones o en peso
añadido, no en "kilos levantados".

### RIR

Entero de 0 a 10. La app ya lo valida al capturar, pero si un archivo
viejo o pegado a mano trae un valor fuera de ese rango, señálalo como
dato incoherente (ver la sección "Datos del usuario" de SKILL.md) y no
lo uses sin confirmar.

## `routines` (solo en Super Journal)

Arreglo con las rutinas completas del usuario, en el mismo formato que
la sección "Rutina" de arriba. Úsalo para comparar lo prescrito en una
sesión contra la rutina vigente, o para proponer cambios directamente
sobre ella.

## `period` y `totals` (solo en Super Journal)

```json
"period": { "from": "AAAA-MM-DD", "to": "AAAA-MM-DD" },
"totals": { "sessions": 0, "firstSession": "ISO-8601", "lastSession": "ISO-8601" }
```

- `period` puede venir en `null`: significa que se exportó **todo el
  historial**, sin filtro.
- `totals` cuenta solo lo que viene en este archivo (las sesiones del
  periodo exportado), no el historial completo del usuario.

## Ejercicios saltados

La app no marca explícitamente un ejercicio como "saltado": si el
usuario no registró ninguna serie de un ejercicio, ese ejercicio no
aparece en la sesión. Para saber si un ejercicio prescrito se saltó,
compara la lista de ejercicios de la rutina (o de `routines`, en el
Super Journal) contra los ejercicios presentes en la sesión. No asumas
el motivo del salto (lesión, falta de tiempo, falta de equipo); si
importa para la decisión, pregúntalo.

## Generar una rutina para importar en la app

Para un plan de varias semanas con metas y nutrición, entrega un
**programa** (ver `programas.md`); aquí quedan las reglas de una rutina
suelta y los pesos iniciales, que también aplican dentro del programa.
Para una rutina sola, entrégala como archivo JSON importable (Import
Routine) con esta estructura, tomada de una rutina real exportada:

```json
{
  "app": "GymAI", "version": 2, "type": "routine",
  "exportedAt": "AAAA-MM-DDTHH:MM:SS.000Z",
  "routine": {
    "id": "id<10-12 caracteres alfanuméricos únicos>",
    "name": "Nombre de la rutina", "icon": "⚡",
    "workouts": [
      { "id": "id...", "name": "Monday: Push 1",
        "exercises": [
          { "id": "id...", "name": "Barbell Bench Press",
            "meta": "Primary · Horizontal Push",
            "unit": "kg", "restSeconds": 210,
            "muscles": [ { "key": "chest", "role": "primary" },
                         { "key": "triceps", "role": "secondary" } ],
            "sets": [ { "reps": 8, "rir": 2, "weight": 65 } ] }
        ] }
    ] } }
```

Reglas:
- Un `workout` por día de entrenamiento; el nombre sigue el patrón
  "Día: Tipo N" que usa el usuario. Cada `id` es único.
- `unit`: `kg`, `lb`, `kg_db` o `lb_db` (por mancuerna). Pesos de
  ejercicios con peso corporal: `0`.
- `muscles[].key` válidos: `chest`, `lats`, `upperback`, `shoulders`,
  `biceps`, `triceps`, `quads`, `hamstrings`, `glutes`, `calves`.
  La lista es cerrada (guía de la app): **no existe `abs`**, ni antebrazos
  ni trapecios, y un músculo inválido hace que se rechace el archivo. El
  abdomen se programa sin clave de músculo; avísalo y no lo cuentes en el
  volumen semanal.
- Pesos iniciales: no dejes todo en 0 si hay datos. Todas estas cifras son **Estimación** (sin fuente verificada); sirven solo para arrancar y se corrigen con el registro.
  1. Fuente del dato, en orden: (a) el historial del usuario (su mejor serie reciente del mismo ejercicio o de uno del mismo patrón); (b) una pregunta única: "¿con cuánto haces 8 repeticiones en [un ejercicio de referencia]?"; (c) sin datos: deja 0 y di que se calibra la primera semana con RIR 2.
  2. Un dato de referencia por patrón (empuje horizontal, empuje vertical, tirón, pierna). No cruces patrones (de un press no deduzcas el remo): pide o usa otra referencia.
  3. Proporciones de partida (a las mismas repeticiones, con rangos amplios): mancuerna por mano ≈ 35–40 % de la barra en el mismo press; press inclinado o en Smith ≈ 80–90 % del plano con barra; máquinas varían mucho por marca (60–110 %): usa la serie real si la hay. Aislamientos: sin proporción fiable; parte del peso con que el usuario ya los hace o del más ligero razonable.
  4. Escribe el peso un poco ligero (queda 1 RIR extra) y márcalo en `meta` con "peso estimado". Si el usuario es mujer, principiante o tiene lesión, sé más conservador; no uses edad o sexo para fijar cargas sin dato propio.
  5. Con un Super Journal, calibra por ejercicio: si en todas las series el RIR real supera el objetivo en 2 o más, sube el peso de partida ~5–10 %; si no completa las repeticiones, bájalo ~5–10 %. El factor personal pesa más que cualquier proporción general. Cifras del 5–10 %: Estimación.
- `meta` es texto libre ("Primary · Horizontal Push"); `rir` va de 0 a 10.
- Escribe una serie por entrada de `sets`; el peso y las repeticiones son
  la prescripción de partida, no un máximo.
- Los nombres de ejercicio van en el idioma que ya usa su rutina (en los
  archivos vistos, inglés).
- Si el usuario ya tiene una rutina exportada, parte de ella para
  conservar ejercicios, unidades y claves.
- Valida antes de entregar: JSON válido, `type` = "routine", ningún `id`
  repetido, `rir` entre 0 y 10, unidades de la lista.
