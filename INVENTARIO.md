# INVENTARIO — GymAI

Inventario descriptivo del repositorio `xPixelIvanx/GymAI` tal como está en el commit `74ff0da` (rama `main`, 10-oct-2026). Solo describe lo que existe; no propone cambios ni valora.

**Cómo se hizo**
- Lectura completa de `HTML/index.html` (8 218 líneas) y de todos los demás archivos del repo.
- Prueba local en Chromium sin interfaz (servidor estático en `127.0.0.1`). La red del entorno bloqueó la CDN de Firebase (`www.gstatic.com`), así que solo se pudo observar el estado «sin nube». Ahí se comprobó qué archivos acepta el importador (sección 5.3) y qué mensajes salen en la consola (sección 8.6).

**Convenciones**
- `index.html:NNNN` = `HTML/index.html`, línea NNNN. Los demás archivos se citan con su ruta.
- **no verificado** = no se puede confirmar leyendo el código del repo (depende de Firebase, Vercel, Google u otro sistema externo).
- «LS» = `localStorage` del navegador. «FS» = Firestore.
- Las claves de LS marcadas `::uid` llevan el sufijo de la cuenta (`<clave>::<uid>`), según `aKey()` en `index.html:1902-1911`.

---

## 1. Mapa general

### 1.1 Archivos

| Ruta | Bytes | Líneas | Qué es |
|---|---:|---:|---|
| `HTML/index.html` | 560 752 | 8 218 | Toda la aplicación: CSS, HTML y JavaScript en un solo archivo |
| `HTML/service-worker.js` | 3 294 | 99 | Service worker de la PWA (caché y modo sin conexión) |
| `HTML/manifest.json` | 1 028 | 42 | Manifiesto de la PWA |
| `HTML/conocimiento_youtube.json` | 179 886 | 56 | 11 objetos `{videoId, url, texto}` con transcripciones de YouTube (11 692 a 19 119 caracteres cada una) |
| `HTML/icon-192.png` | 41 481 | — | Icono 192×192 |
| `HTML/icon-512.png` | 256 799 | — | Icono 512×512 |
| `HTML/icon-maskable-512.png` | 158 709 | — | Icono maskable 512×512 |
| `HTML/apple-touch-icon.png` | 36 597 | — | Icono iOS 180×180 |
| `vercel.json` | 54 | 4 | Configuración de despliegue |
| `FIRESTORE_RULES.txt` | 7 898 | 135 | Reglas de seguridad de Firestore (texto para pegar en la consola de Firebase) |
| `DATA_GUIDE.md` | 54 172 | 775 | Guía de datos y formatos (para la Skill del coach) |
| `CHANGELOG.md` | 4 886 | 43 | Cambios por fase |
| `PROGRAM_TEMPLATE.json` | 11 616 | 396 | Plantilla de programa importable (`version: 1`, `type: "program"`) |
| `ROUTINE_TEMPLATE.json` | 13 601 | 400 | Plantilla de rutina comentada |
| `.gitignore` | 55 | 6 | Ignora `.DS_Store`, `.claude/`, `node_modules/`, `*.log`, `clear`, `clear.pub` |
| **Total** | **1 330 828** | | |

No hay `package.json`, carpeta de pruebas, paso de compilación ni otros scripts.

### 1.2 Estructura interna de `HTML/index.html`

| Bloque | Líneas |
|---|---|
| `<head>`: metas, PWA, iconos, fuentes | `index.html:1-26` |
| `<style>`: tokens, componentes, responsive, capa «Void», animaciones | `index.html:27-1394` |
| `<body>`: HTML estático (barra lateral, pestañas, ventanas) | `index.html:1396-1784` |
| `<script>` principal (`"use strict"`), dividido en 13 secciones | `index.html:1785-7958` |
| § 1 Núcleo | `index.html:1788-1885` |
| § 2 Datos y sincronización | `index.html:1887-2332` |
| § 3 Rutinas | `index.html:2334-3319` |
| § 4 Programas | `index.html:3321-3897` |
| § 5 Journal y sesión | `index.html:3899-4352` |
| § 6 Progresiones IA | `index.html:4354-5165` |
| § 7 Cuerpo | `index.html:5167-5409` |
| § 8 Perfil y coach | `index.html:5411-6386` |
| § 9 Social | `index.html:6388-7303` |
| § 10 Informes | `index.html:7305-7572` |
| § 11 Ajustes y mantenimiento | `index.html:7574-7630` |
| § 12 Herramientas (temporales) | `index.html:7632-7909` |
| § 13 Arranque | `index.html:7911-7957` |
| `<script>` de animaciones (IIFE `fxEnter`, `countUp`, `fxHaptic`) | `index.html:7965-8031` |
| `<script type="module">` de Firebase (`window.Cloud`) | `index.html:8033-8216` |

El archivo declara 560 funciones con `function` (conteo con script sobre el archivo).

### 1.3 Dependencias externas

| Dependencia | Versión | Origen | Dónde |
|---|---|---|---|
| Google Fonts: **Inter** (pesos 300, 400, 500, 600) y **Chivo Mono** (400, 500) | — (CSS2 API) | `fonts.googleapis.com` / `fonts.gstatic.com` | `index.html:24-26` |
| Firebase JS SDK — `firebase-app.js` | 11.6.1 | `https://www.gstatic.com/firebasejs/11.6.1/` | `index.html:8034` |
| Firebase JS SDK — `firebase-auth.js` (getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult) | 11.6.1 | igual | `index.html:8035-8037` |
| Firebase JS SDK — `firebase-firestore.js` (getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, onSnapshot, serverTimestamp, arrayUnion, arrayRemove, query, where, getDocs, orderBy, limit) | 11.6.1 | igual | `index.html:8038-8040` |
| API de Google Gemini, modelo `gemini-2.5-flash`, endpoint `v1beta …:generateContent?key=` | — | `generativelanguage.googleapis.com` | `index.html:2418-2419`, llamada en `index.html:2664` |
| Enlaces de YouTube (solo como datos; no se cargan) | — | `youtu.be` | `index.html:2452-2457`, `HTML/conocimiento_youtube.json` |

- No hay librerías de JavaScript adicionales (sin frameworks, sin librerías de gráficas). Las gráficas son SVG generado a mano (`index.html:1591-1626`, `4709-4770`, `6350-6384`).
- APIs del navegador usadas: `localStorage`, Service Worker y Cache API, Web Audio (`index.html:4236-4260`), `navigator.vibrate` (`index.html:4259`, `8027`), Clipboard (`index.html:7080`), `FileReader` (`index.html:3299`, `5640`), Canvas (`index.html:5727-5729`), `MutationObserver` (`index.html:8012-8024`), Pointer Events (`index.html:5680-5683`), `matchMedia` (`index.html:7973`), `fetch` (solo dos llamadas: `index.html:2564` y `2664`).

### 1.4 Despliegue

- **Vercel.** `vercel.json:1-4` → `"buildCommand": ""` y `"outputDirectory": "HTML"`: se sirve la carpeta `HTML/` como sitio estático, sin compilar. Commits relacionados: `13ee9b9` «Add Vercel config for HTML static deployment» y `84b0892` «Fix Vercel config - remove invalid framework».
  - Dominio, proyecto de Vercel y variables de entorno: **no verificado** (no están en el repo). El código no tiene ningún mecanismo para leer variables de entorno (no hay paso de compilación).
- **PWA.**
  - `HTML/manifest.json:1-42`: nombre «GymAI — Tactical Performance», `short_name` «GymAI», `start_url` `./index.html`, `display: standalone`, orientación vertical, colores `#000000`, `lang: "en"`, 4 iconos.
  - `HTML/service-worker.js`: caché `gymai-v2` (`:10-12`); precarga `./`, `index.html`, `manifest.json`, `conocimiento_youtube.json` y los 4 iconos (`:15-24`); páginas HTML con red primero y caché de respaldo (`:61-76`); el resto con caché primero (`:78-93`); acepta el mensaje `SKIP_WAITING` (`:97-99`).
  - Registro del service worker: `index.html:7951-7957`.
- **Firebase.** Proyecto `gai-2da1d` (`index.html:8045`). Que las reglas de `FIRESTORE_RULES.txt` sean las que están publicadas en la consola de Firebase: **no verificado**.
- **Git.** Ramas `main` y `claude/sharp-dijkstra-bsbsku` en el mismo commit `74ff0da`; 53 commits.

---

## 2. Estructura de la interfaz

Jerarquía de lo que se ve. Entre comillas, el texto exacto del elemento; entre paréntesis, la función que ejecuta y su línea.

### 2.1 Marco general (`#app`, `index.html:1397-1659`)

- **Barra lateral** `#sidebar` (`index.html:1400-1425`); se oculta en pantallas de 768 px o menos (`index.html:992`).
  - Logo «G» + «GymAI» y etiqueta «Tactical Performance» (`index.html:1401-1407`).
  - Botones de navegación (`index.html:1409-1413`), todos con `switchTab()` (`index.html:1824`):
    - «◈ Home Feed»
    - «⬡ Leaderboards»
    - «◎ Routine Manager»
    - «◇ AI Progressions»
    - «◉ Athlete Profile»
  - Pie de usuario (`index.html:1416-1423`): avatar `#sb-avatar`, nombre `#sb-user-name` («Invitado»), estado `#sb-user-status` («SIN CONECTAR · toca para entrar») y punto `#sb-status-dot`. Al tocarlo va a la pestaña Leaderboards (`switchTab('leaderboard')`). Lo actualiza `renderFooter()` (`index.html:6476-6492`).
- **Barra superior** `#topbar` (`index.html:1429-1436`)
  - Título `#topbar-title` (cambia con `TABS`, `index.html:1823`).
  - Insignia fija «[UPLINK: ACTIVE]» (`index.html:1432`).
  - «🔔» (`notifsOpen`, `index.html:6541`) con contador `#bell-badge`.
  - «✉» (`chatsOpen`, `index.html:6592`) con contador `#mail-badge`.
- **Barra inferior móvil** `#bottomnav` (`index.html:1652-1658`), visible a 768 px o menos: «Feed», «Ranks», «Routine», «AI», «Profile».
- **Contenido** `#content` con cinco paneles `.tab-panel` (`index.html:1438-1648`).

### 2.2 Pestaña «Home Feed» — `#tab-feed` (`index.html:1441-1562`), todo escrito en el HTML

- «Stories — 24h Active» (`index.html:1442-1448`): Iván 💪, Andy ⚡, Iker 🔥, Emma 🌟 (esta marcada como vista).
- «Tactical Feed» (`index.html:1450-1561`): 4 publicaciones `.post-card`.
  - Andy, Push Day (`index.html:1453-1478`); Iker, Pull Day (`index.html:1480-1505`); Emma, Leg Day (`index.html:1507-1532`). Cada una tiene filas EXERCISE / SETS / REPS / RIR TARGET / WEIGHT / VOLUME y tres botones:
    - «♡ Like» (`toggleLike`, `index.html:6397`)
    - «💬 Carrilla» (`openComments`, `index.html:6402`)
    - «⬇ Clone Routine» (`cloneRoutine`, `index.html:6412`)
  - Iván · YOU (`index.html:1534-1559`): «♥ Liked» (sin `onclick`, `index.html:1555`), «💬 Comments (3)» (`openComments`), «🔗 Share» (sin `onclick`, `index.html:1557`).

### 2.3 Pestaña «Leaderboards» — `#tab-leaderboard` → `#crew-root`, lo pinta `renderCrew()` (`index.html:7116-7130`)

- Estados sin sesión: «Conectando…» (`:7118`), «Nube no disponible» (`:7119`), y «Compite con tus amigos» con botón «Ir a mi Perfil →» (`:7120-7125`).
- Con sesión: selector «👥 Amigos» / «🛡️ Crew» (`lbToggleHTML`, `index.html:7132-7138`).
  - **Amigos** (`friendsBoardView`, `index.html:7172-7194`)
    - Sin amigos: «Aún no tienes amigos» + «🔍 Buscar amigos» (`friendsOpen`).
    - Con amigos: encabezado «Tú vs tus amigos» y botón «👥 amigos» (`friendsOpen`).
      - «Ranking semanal · volumen»: filas `.cw-row` (`lbRows`, `index.html:7149-7171`). Al tocar una fila se abre la ficha del atleta (`crewOpenMember`).
      - Pie: «↻ Sincronizar mis stats» (`cloudSyncMe`), «＋ Buscar / gestionar amigos», «Cerrar sesión» (`crewSignOut`).
  - **Crew sin crew** (`crewJoinView`, `index.html:7208-7227`)
    - «Hola, …» + «Cerrar sesión».
    - Tarjeta «🔔 Invitaciones a crews» con «Unirme» / «✕» (`crewInvitesHTML`, `index.html:7195-7207`).
    - «➕ Crear un crew»: campo «Nombre del crew (ej. Los Mancuernas)» (máx. 28) + «Crear crew» (`crewCreate`).
    - «🔑 Unirse a un crew»: campo «CÓDIGO» (máx. 5) + «Unirme» (`crewJoin`).
  - **Crew con crew** (`crewBoardView`, `index.html:7228-7245`)
    - Nombre, número de miembros, botón con el código y «📋 copiar» (`crewCopyCode`).
    - Ranking, «👥 Invitar amigos al crew» (`crewInviteOpen`).
    - Pie: «↻ Sincronizar mis stats», «Salir del crew» (`crewLeave`), «Cerrar sesión».

### 2.4 Pestaña «Routine Manager» — `#tab-routine` → `#rm-root`, lo pinta `renderRM()` (`index.html:2346-2371`)

Sin sesión muestra «Routine Manager» + «Iniciar sesión con Google» (`index.html:2352`), «Sin conexión» (`:2354`) o «Conectando…» (`:2356`). Con sesión, la vista depende de `rmView` (mapa en `index.html:2360-2366`):

- **`routines` — «Routine Library»** (`viewRoutines`, `index.html:2374-2409`)
  - Barra de herramientas (`index.html:2398-2407`):
    - «＋ New Routine» (`rmCreateRoutine`)
    - «✨ AI Coach» (`rmGoAIGen`)
    - «📄 Documents» (`rmGoDocs`)
    - «⤒ Import Routine» (`triggerImport`)
    - «🗓 Programas» (`rmGoPrograms`)
    - «📓 War Journal» (`rmGoJournal`)
    - «🗄 Datos» (`rmGoData`)
  - Tarjeta de rutina (`index.html:2379-2392`): icono, nivel («🟢 Simple», «⚡ Standard» o «🔬 Advanced»), nombre, conteos, etiquetas de workouts. Botones: «Open» (`rmOpenRoutine`), «📤» (`sendRoutinePick`), «✎» (`rmRenameRoutine`), «⤓» (`exportRoutine`), «🗑» (`rmDeleteRoutine`).
  - **`workouts`** (`viewWorkouts`, `index.html:2730-2754`): «‹ All Routines», «＋ New Workout» (`rmCreateWorkout`). Las tarjetas de workout se abren con clic (`wkCardClick`) y se reordenan arrastrando (`dragStart`/`dropOn`).
    - **`workout`** (`viewWorkout`, `index.html:2757-2790`)
      - Vista normal: «▶ Start Workout» (`startWorkout`), «✎ Edit Mode» (`rmToggleEdit`), «📤 Enviar a amigo» (`sendWorkoutPick`).
      - Modo edición: «▶ Start Workout», «✓ Done Editing», «🗑 Delete Workout» (`rmDeleteWorkoutInline`), aviso «✎ EDIT MODE — …», título editable (`rmRenameWorkoutInline`), «＋ Add Exercise» (`rmAddExercise`).
      - Bloque de ejercicio (`exerciseBlock`, `index.html:2792-2833`)
        - En edición: asa «⠿», nombre, selector de unidad (KG / LB / KG/DB / LB/DB), «🗑» (`rmRemoveExercise`), descripción, «Rest … sec», «−» / «＋» serie (`rmRemoveSet` / `rmAddSet`), «🎯 Add muscles» / «🎯 Edit muscles» (`openMuscleEditor`).
        - Series según nivel: Simple (`index.html:2872-2893`), Standard (`index.html:2847-2870`), Advanced con tipo, tempo, nota y «＋ Dropset» (`index.html:2895-2941`).
  - **`aigen` — «✨ AI Routine Coach»** (`viewAIGen`, `index.html:2465-2497`)
    - «‹ All Routines».
    - «Enfoque»: Bodybuilding / Powerlifting / Híbrido.
    - «Días de entrenamiento»: 3 a 6 días.
    - «Nivel de experiencia»: Principiante / Intermedio / Avanzado.
    - «Notas para tu coach» (opcional, máx. 600).
    - Caja «🧠 Base científica …» con «↻ Recargar» (`recargarConocimiento`).
    - «✨ Generar Mi Rutina con IA» (`aiGenRun`).
    - Resultado (`aiGenResultView`, `index.html:2499-2526`): «‹ New questionnaire», «✓ Guardar en mis rutinas» (`aiGenSave`), «↻ Regenerar».
  - **`docs` — «Documents 📄»** (`viewDocs`, `index.html:3220-3244`): «＋ New Document». Tarjetas con «Open», «⤓» (.txt) y «🗑».
  - **`programs` — «Programas 🗓»** (`viewPrograms`, `index.html:3499-3512`)
    - «＋ Nuevo programa» (`pgOpenEdit`), «⤒ Importar programa» (`triggerImport`).
    - Bloques «Activo» / «Planeados» / «Terminados». Tarjeta (`pgCardHTML`, `index.html:3484-3498`): «Abrir», «▶ Activar».
    - **`program`** (`viewProgram`, `index.html:3513-3551`)
      - Botones: «▶ Activar», «＋ Registrar ajuste», «＋ Checkpoint», «✎ Editar», «⤓ Informe del programa» (no en planeados), «■ Cerrar programa».
      - Secciones: «Metas», «Rutinas», «Nutrición vigente», «Historial de nutrición», «Checkpoints» (con «✓» marcar hecho), «Bitácora de ajustes».
  - **`j-routines` — «War Journal 📓»** (`viewJournalRoutines`, `index.html:3926-3953`): «🗑 Borrar sesiones…» (`rmGoDataWipe('sessions')`), tarjetas «Open».
    - **`j-workouts`** (`index.html:3956-3976`) → **`j-sessions`** (`index.html:3979-3998`, «View» y «⤓» con título «Exportar para el coach») → **`j-session`** (`index.html:4001-4039`, «⤓ Exportar para el coach», «Session Summary», tabla Set / Target / Actual).
  - **`data` — «Datos 🗄»** (`viewData`, `index.html:3609-3623`)
    - «Exportar y respaldo»: «📋 Informe para el coach» (`exportCoachReport`), «⤓ Respaldo completo» (`dataBackup('all')`), selector de periodo + «⤓ Super Journal (coach)» (`index.html:7343-7345`).
    - «Herramientas» (`viewDataTools`, `index.html:7644-7667`): «🧪 Cargar datos de prueba» (o «↻ Recargar datos de prueba» + «✕ Quitar datos de prueba»), «🔍 Modo inspección», «Borrar datos» (5 tarjetas con «Borrar…»).
    - Confirmar borrado (`viewDataConfirm`, `index.html:7669-7685`): «⤓ Descargar respaldo JSON antes de borrar», campo «Escribe BORRAR para confirmar», «🗑 Borrar definitivamente».
    - **`inspect` — «Modo inspección 🔍»** (`viewInspect`, `index.html:7860-7908`): «↻ Actualizar» y 12 tarjetas de conteo.

### 2.5 Pestaña «AI Progressions» — `#tab-ai` (`index.html:1575-1641`)

- 4 tarjetas fijas (`index.html:1577-1580`): «Weekly Volume 12,850», «Sessions 4», «Avg RIR 1.4», «Model Confidence 91%».
- Gráfica fija «Weekly Tonnage & AI Projection» (SVG, `index.html:1583-1627`).
- Panel «Supervised Progression Engine — Random Forest» (`index.html:1629-1640`)
  - Insignia `#rf-badge` y texto descriptivo.
  - `#rf-browser`, lo pinta `rfRun()` (`index.html:4975-4986`):
    - Cuadrícula de rutinas (`rfGrid`, `index.html:4773-4792`), tarjetas «Abrir progreso →».
    - Detalle (`rfDetail`, `index.html:4795-4823`)
      - «← Rutinas», tira de 4 datos, gráfica de volumen semanal de la rutina, pestañas por workout.
      - Ejercicio plegable (`rfExerciseSection`, `index.html:4826-4856`)
        - Gráfica de progreso.
        - Panel de meta (`rfGoalPanel`, `index.html:4874-4912`): «🎯 Establecer meta» o formulario «Peso inicial / Meta / Plazo» con «Guardar meta» / «Cancelar»; resumen con «✎» y «🗑».
        - Tarjeta de recomendación (`rfRecCard`, `index.html:5029-5092`): «⤴ Aplicar …», «✓ Correcto», «⊻ Bajar mucho», «▼ Bajar», «＝ Mantener», «▲ Subir», «⊼ Subir mucho», «↺ Deshacer» y deslizador de cantidad. Variantes: «🔒 APLICADO» con «↺ Reactivar ayuda ahora» (`index.html:5015-5027`) y «NO DATA» (`index.html:5093-5098`).
      - Pie: «⤴ Aplicar N recomendaciones a "…"» (`rfApplyAll`).
  - Desplegable «⚙ Advanced» → «🗑 Reset Random Forest (borrar correcciones)» (`index.html:1637-1639`).

### 2.6 Pestaña «Athlete Profile» — `#tab-profile` → `#profile-root`, lo pinta `renderProfile()` (`index.html:5432-5455`)

- **Sin sesión** (`profileAuthView`, `index.html:5473-5480`; `authCardHTML`, `index.html:5457-5472`)
  - Título «Crea tu cuenta de atleta» o «Bienvenido de vuelta».
  - «Continuar con Google» (`profileSignInGoogle`).
  - Pestañas «Iniciar sesión» / «Crear cuenta» (`crewSetMode`).
  - Campos «Tu nombre (ej. Iván)», «Correo», «Contraseña (6+)».
  - Botón «Entrar» / «Crear cuenta y continuar» (`crewSubmitAuth`).
- **Con sesión y sin perfil** (`profileCompleteView`, `index.html:5482-5494`): «¡Bienvenido!», «＋ Completar mi perfil» (`profileWizardStart`), «Cerrar sesión».
- **Con perfil** (`profileCV`, `index.html:5737-5799`)
  - Franja de cuenta: correo + «cerrar sesión».
  - Botones sociales: «🔍 Buscar amigos», «👥 Amigos N», «🔔 Solicitudes N» (todos `friendsOpen`).
  - Tarjeta principal: «✎ Edit» (asistente), avatar con «📷» (`profilePickPhotoCV`), nombre, chips de sexo, edad y altura.
  - «Biometric snapshot»: Age, Height, Weight, BMI, Body Fat.
  - Registro corporal: chips de medidas, «⚖️ Registro corporal N» (`bodyLogOpen`), «＋ Nueva entrada» (`bodyLogNew`) — `index.html:5282-5292`.
  - Medidores «📊 Body Mass Index» y «🔬 Body Fat».
  - «Perfil del coach» (`coachSectionHTML`, `index.html:5874-5893`): chips + «✎ Editar perfil del coach», o «↻ Reintentar».
  - «Objetivos y notas» (`goalsNotesSectionHTML`, `index.html:6012-6024`): «🎯 Objetivos N», «🩹 Lesiones y notas N».
  - «Muscle ranks · radar» (`muscleRanksSection`, `index.html:6327-6347`): radar SVG y 10 filas por músculo (al tocar se abre el registro de PR; botón «＋»).
  - «✎ Update my data» (asistente).

### 2.7 Ventanas, superposiciones y controles ocultos

| Id (HTML) | Qué contiene | Dónde se pinta |
|---|---|---|
| `#player-overlay` | Reproductor de sesión. Cabecera con progreso, «⛶»/«❐» (`playerToggleMax`) y «✕» (`playerAskClose`). Fase serie: objetivos, «⇄ View in …», «Log what you actually did», «Next ▸ (save & rest)» / «Finish Workout ✓», «⏭ Skip ejercicio». Fase descanso: «Rest Timer», «+30s», «Skip Rest ▸». Fase final: «Battle Complete», «📓 Save to War Journal». Confirmación «¿Salir del workout?» con «Seguir entrenando» / «Salir». | `index.html:1662-1676`, `4076-4141`, `4178-4190`, `4262-4282`, `4306-4317` |
| `#toast` | Aviso inferior temporal (2,8 s) | `index.html:1679`, `1845-1850` |
| `#comments-overlay` | «Carrilla Section 💬»: 4 comentarios fijos, campo «Add carrilla...», «Send» | `index.html:1682-1699`, `6403-6411` |
| `#routine-modal` | «New Routine» / «Edit Routine»: Name, «Icon — fitness only» (24 emojis), «Complejidad» (3 niveles), Cancel / Save | `index.html:1702-1717`, `3044-3079` |
| `#doc-modal` | «New Document» / «Edit Document»: Title, Content, Cancel / Save | `index.html:1720-1733`, `3245-3262` |
| `#profile-wizard` | Asistente de 7 pasos («STEP n / 7»): nombre y foto, sexo, edad, altura, peso, % grasa, revisión; «‹ Back», «Continue ›», «✓ Save profile» | `index.html:1742`, `5513-5632` |
| `#photo-editor` | «Ajusta tu foto»: arrastrar, zoom, «Cancelar» / «✓ Usar foto» | `index.html:1745`, `5664-5734` |
| `#pr-modal` | «[MÚSCULO] PR»: enfoque, Weight / Reps con −/＋, «Estimated 1RM», insignia de rango, «Current best», «PR history», Cancel / «✓ Save PR» | `index.html:1748`, `6261-6324` |
| `#coach-modal` | «🧠 PERFIL DEL COACH» (campos en la sección 3, F55) | `index.html:1751`, `5927-5971` |
| `#bodylog-modal` | «REGISTRO CORPORAL» (lista) y «NUEVA ENTRADA» / «EDITAR ENTRADA» (formulario) | `index.html:1754`, `5299-5353` |
| `#gn-modal` | «🎯 OBJETIVOS» / «🩹 LESIONES Y NOTAS» (lista y formulario) | `index.html:1757`, `6065-6120` |
| `#pg-modal` | Programas: modos `edit`, `adjust`, `checkpoint`, `close`, `import`, `importError` | `index.html:1760`, `3678-3743` |
| `#muscle-modal` | «🎯 MUSCLE GROUPS · …»: 10 músculos con «—», «Principal», «2.º plano»; Cancel / «✓ Save» | `index.html:1763`, `2988-3015` |
| `#crew-member-modal` | «👤 ATLETA»: comparativa, biométricos, «🏋️ Bench», «Rangos por músculo» | `index.html:1766`, `7246-7303` |
| `#friends-modal` | «👥 AMIGOS»: buscador, «Resultados», «Solicitudes recibidas», «Mis amigos» | `index.html:1769`, `6966-7004` |
| `#crew-invite-modal` | «🛡️ INVITAR AL CREW»: «＋ Invitar», «✓ Ya en el crew» | `index.html:1772`, `7096-7113` |
| `#notifs-modal` | «🔔 NOTIFICACIONES»: solicitudes de amistad, invitaciones a crew, «Actividad» | `index.html:1775`, `6549-6576` |
| `#chats-modal` | Lista «Mensajes»: chat del crew + amigos | `index.html:1777`, `6598-6623` |
| `#chat-modal` | Conversación: «‹», nombre, mensajes, «＋» (adjuntar rutina), campo «Mensaje…», «➤» | `index.html:1779`, `6648-6716` |
| `#send-picker-modal` | «📤 ENVIAR …» (elegir amigo) o «📤 ENVIAR AL CHAT» (elegir rutina/entreno) | `index.html:1781`, `6744-6777` |
| `#rwpreview-modal` | «👁 RUTINA / ENTRENAMIENTO» con «⬇ Clonar»; «⬇ CLONAR ENTRENO» con «Nueva rutina con este entreno» / «Aquí» | `index.html:1783`, `6804-6851` |
| `#import-file` (oculto) | Selector de archivo `.json` | `index.html:1736` |
| `#profile-photo-input` (oculto) | Selector de imagen | `index.html:1739` |

- Cuadros nativos del navegador: 15 llamadas a `confirm()` y 1 a `prompt()` («Name your new workout:», `index.html:3089`).
- Cierre al tocar el fondo: lista en `index.html:7942-7945`. No incluye `gn-modal`, `pg-modal` ni `photo-editor`.

---

## 3. Funciones de usuario

### 3.1 Dónde se guarda cada cosa (abreviaturas usadas en las tablas)

| Abreviatura | LS (dispositivo) | FS (nube) | Definido en |
|---|---|---|---|
| **[Rutinas]** | `gymAI_routines_v2::uid` | `users/{uid}/data/routines` | `index.html:1897`, `2073-2080`, `8097-8098` |
| **[HistRutinas]** | `gymAI_hist_routines_v1::uid` | `users/{uid}/data/routineHistory` | `index.html:2132`, `2216-2249` |
| **[Journal]** | `gymAI_journal_v2::uid` | `users/{uid}/data/journal` | `index.html:1897`, `2081-2087`, `2128` |
| **[Programas]** | `gymAI_hist_programs_v1::uid` | `users/{uid}/data/programs` | `index.html:2133` |
| **[Objetivos]** | `gymAI_hist_goals_v1::uid` | `users/{uid}/data/goals` | `index.html:2130` |
| **[Notas]** | `gymAI_hist_notes_v1::uid` | `users/{uid}/data/notes` | `index.html:2131` |
| **[HistPerfil]** | `gymAI_hist_profile_v1::uid` | `users/{uid}/data/profileHistory` | `index.html:2129`, `2203-2213` |
| **[MetasEj]** | `gymAI_goals_v1::uid` + `gymAI_goals_dirty_v1::uid` | `users/{uid}/data/exerciseGoals` | `index.html:4644-4655` |
| **[Cuerpo]** | `gymAI_bodylog_v1::uid` + `gymAI_bodylog_dirty_v1::uid` | `users/{uid}/data/bodyLog` | `index.html:5186`, `5219-5235` |
| **[Perfil]** | `gymAI_profile_v1::uid` | campo `profile` de `users/{uid}` | `index.html:5426-5428`, `2256-2260` |
| **[PRs]** | `gymAI_musclePR_v1::uid` | campo `musclePRs` de `users/{uid}` | `index.html:6136-6139`, `2262-2266` |
| **[Enfoque]** | `gymAI_focus_v1::uid` | — | `index.html:6137` |
| **[Coach]** | — (solo en memoria, `coachState`) | `users/{uid}/data/coachProfile` | `index.html:5801-5871` |
| **[Pub]** | — | campos `pub` y `nameLower` de `users/{uid}` y, con crew, `crews/{code}/members/{uid}` | `index.html:6445-6470` |
| **[Correcciones]** | `gymAI_corrections_v3::uid` | — | `index.html:4446-4466` |
| **[Bloqueos]** | `gymAI_rflocks_v1::uid` | — | `index.html:4474-4481` |
| **[Docs]** | `gymAI_docs_v1` (sin sufijo de cuenta) | — | `index.html:3215-3218` |
| **[Base]** | `conocimiento_youtube` (sin sufijo de cuenta) | — | `index.html:2539-2573` |
| **[Sync]** | `gymAI_lastsync_v1::uid` y `<clave>_wiped::uid` | — | `index.html:2142`, `2178-2180` |

Detalle de lo que pasa al escribir:
- Escribir **[Rutinas]** (`saveRoutines`, `index.html:2080`) también sube a FS (`cloudPushRoutines`) y actualiza **[HistRutinas]** (`routineHistoryTrack`), las dos solo con sesión.
- Escribir una lista que solo se agrega (**[Journal]**, **[Programas]**, **[Objetivos]**, **[Notas]**, **[HistPerfil]**, **[HistRutinas]**) programa una sincronización: lee la nube, combina por `id` y escribe en los dos lados (`listSave` → `scheduleSync` → `syncList`, `index.html:2141`, `2182-2200`).

### 3.2 Cuenta y navegación

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F01 | Crear cuenta con correo | «Crear cuenta y continuar» → `crewSubmitAuth` (`index.html:7009`) → `Cloud.signUp` (`index.html:8071-8076`) | Pide nombre, correo y contraseña; crea el usuario y su nombre visible | Campos `crew-name`, `crew-email`, `crew-pw` | Firebase Auth; FS `users/{uid}` `{displayName, email, crewId:null}` |
| F02 | Iniciar sesión con correo | «Entrar» → `crewSubmitAuth` → `Cloud.signIn` (`index.html:8077`) | Inicia sesión | Correo y contraseña | Firebase Auth |
| F03 | Iniciar sesión con Google | «Continuar con Google» / «Iniciar sesión con Google» → `profileSignInGoogle` (`index.html:7024`) → `Cloud.signInGoogle` (`index.html:8078-8091`) | Ventana emergente; si falla, redirección de página completa | — | Firebase Auth; FS `users/{uid}` si no existía (`ensureUserDoc`, `index.html:8062-8067`) |
| F04 | Cerrar sesión | «Cerrar sesión» / «cerrar sesión» (5 lugares) → `crewSignOut` (`index.html:7033-7045`) | Cierra la sesión y vacía la memoria de rutinas | — | Borra de LS solo `gymAI_routines_v2`, `gymAI_journal_v2`, `gymAI_profile_v1`, `gymAI_musclePR_v1`, `gymAI_corrections_v3` y `gymAI_focus_v1` de esa cuenta (`index.html:7038-7040`) |
| F05 | Carga de la cuenta al iniciar sesión (automática) | Evento `cloud-auth` (`index.html:2275-2332`), que lanza `onAuthStateChanged` (`index.html:8203-8213`) | Baja perfil, PRs y rutinas; combina las 6 listas; baja metas por ejercicio, cuerpo y perfil del coach; guarda la primera versión del perfil y las rutinas; publica **[Pub]**; se suscribe a crew, amistades e invitaciones | FS `users/{uid}` y `data/*` | **[Perfil]**, **[PRs]**, **[Rutinas]**, las 6 listas, **[MetasEj]**, **[Cuerpo]**, **[HistPerfil]**, **[HistRutinas]**, **[Pub]** |
| F06 | Cambiar de pestaña | Barra lateral, barra inferior → `switchTab` (`index.html:1824-1832`) | Muestra el panel y cambia el título | — | — |

### 3.3 Home Feed (contenido fijo)

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F07 | Like | «♡ Like» → `toggleLike` (`index.html:6397-6401`) | Cambia el texto y el color del botón | — | Nada (solo la página) |
| F08 | Comentarios «Carrilla» | «💬 Carrilla» → `openComments` (`index.html:6402`); «Send» / Enter → `sendComment` (`index.html:6403-6411`) | Abre la ventana y agrega el texto a la lista con autor fijo «Iván (You)» | Campo `comment-input` | Nada (solo la página) |
| F09 | Clonar rutina del feed | «⬇ Clone Routine» → `cloneRoutine` (`index.html:6412-6416`) | Cambia el botón a «✓ Cloned!» 3 s y muestra «Routine template cloned to your library» | — | Nada (no crea ninguna rutina) |

### 3.4 Rutinas

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F10 | Crear rutina | «＋ New Routine» → `openRoutineModal(null)` → «Save» → `routineModalSave` (`index.html:3071-3079`) | Crea `{id, name, icon, complexity, workouts:[]}` | Ventana de rutina | **[Rutinas]** |
| F11 | Editar nombre, icono y complejidad | «✎» → `rmRenameRoutine` (`index.html:3043`) | Cambia `name`, `icon` y `complexity` | **[Rutinas]** | **[Rutinas]** |
| F12 | Borrar rutina | «🗑» → `rmDeleteRoutine` (`index.html:3080-3084`), con `confirm` | Quita la rutina | **[Rutinas]** | **[Rutinas]** (en **[HistRutinas]** queda un registro `deleted`) |
| F13 | Abrir rutina / workout | «Open», clic en tarjeta → `rmOpenRoutine`, `rmOpenWorkout`, `wkCardClick` (`index.html:3033-3036`, `3127`) | Navega dentro del Routine Manager | **[Rutinas]** | — |
| F14 | Crear workout | «＋ New Workout» → `rmCreateWorkout` (`index.html:3087-3093`), con `prompt` | Agrega `{id, name, exercises:[]}` | — | **[Rutinas]** |
| F15 | Renombrar / borrar workout | Título editable → `rmRenameWorkoutInline` (`index.html:3095`); «🗑 Delete Workout» → `rmDeleteWorkoutInline` (`index.html:3099-3103`) | Cambia el nombre o quita el workout | **[Rutinas]** | **[Rutinas]** |
| F16 | Reordenar arrastrando | Tarjetas de workout y asa «⠿» → `dragStart`, `dragOver`, `dropOn`, `reorderItem` (`index.html:3106-3126`) | Mueve workouts o ejercicios de posición | **[Rutinas]** | **[Rutinas]** |
| F17 | Modo edición | «✎ Edit Mode» / «✓ Done Editing» → `rmToggleEdit` (`index.html:3037`) | Alterna vista y edición | — | — |
| F18 | Ejercicios | «＋ Add Exercise» → `rmAddExercise` (`index.html:3131-3135`); «🗑» → `rmRemoveExercise` (`index.html:3136-3141`); nombre, unidad, descripción y descanso → `rmUpdateExercise` (`index.html:3142-3153`) | Crea «New Exercise» (3 × 10, RIR 2, 20 kg, 90 s) o edita campos | **[Rutinas]** | **[Rutinas]** |
| F19 | Series | «＋»/«−» → `rmAddSet` / `rmRemoveSet` (`index.html:3154-3168`); campos → `rmUpdateSet` (`index.html:3171-3181`); nivel Simple → `rmSetUniform` (`index.html:3183-3189`) | Agrega o quita series; limpia los números (`cleanSetNum`, `index.html:1925`) | **[Rutinas]** | **[Rutinas]** |
| F20 | Dropsets | «＋ Dropset», «✕», campos → `rmAddDrop`, `rmRemoveDrop`, `rmUpdateDrop` (`index.html:3191-3210`) | Nuevo drop = 80 % del peso anterior | **[Rutinas]** | **[Rutinas]** |
| F21 | Etiquetar músculos | «🎯 Add/Edit muscles» → `openMuscleEditor` (`index.html:2971`); `meSet` (`index.html:2979`); «✓ Save» → `meSave` (`index.html:3017-3028`) | Hasta 4 músculos por ejercicio, cada uno «Principal» o «2.º plano» | **[Rutinas]** | **[Rutinas]** |
| F22 | Exportar rutina | «⤓» en la tarjeta → `exportRoutine` (`index.html:3290-3294`) | Descarga `gymai-routine-<nombre>.json` (formato en 5.1) | **[Rutinas]** | Archivo descargado |
| F23 | Importar archivo (rutina o programa) | «⤒ Import Routine» / «⤒ Importar programa» → `triggerImport` (`index.html:3296`) → `importFromFile` (`index.html:3297-3319`) | Decide por el contenido (ver 5.3). Rutina: la clona con ids nuevos | Archivo `.json` | **[Rutinas]**; **[Docs]** si trae `documents` |
| F24 | Enviar rutina o workout a un amigo | «📤» / «📤 Enviar a amigo» → `sendRoutinePick` / `sendWorkoutPick` (`index.html:6734-6743`) → «Enviar» → `doSendRW` (`index.html:6792-6801`) | Manda un mensaje con la rutina o el workout completo | **[Rutinas]**, lista de amigos | FS `chats/{pairId}/messages` |

### 3.5 Generador de rutinas con IA (Gemini)

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F25 | Generar rutina | «✨ Generar Mi Rutina con IA» / «↻ Regenerar» → `aiGenRun` (`index.html:2528-2537`) → `generarRutinaConContexto` (`index.html:2590-2683`) | Arma las instrucciones con las 11 transcripciones, una directriz según el enfoque y el perfil (nombre, sexo, edad, altura, peso, % grasa, IMC); hace POST a Gemini con salida JSON (`GEMINI_SCHEMA`, `index.html:2421-2445`; `temperature 0.8`) | **[Base]**, **[Perfil]** + **[Cuerpo]** (`effProfile`), formulario | Memoria (`aiGen`, `index.html:2459`); envía datos a `generativelanguage.googleapis.com` |
| F26 | Guardar rutina generada | «✓ Guardar en mis rutinas» → `aiGenSave` (`index.html:2703-2727`) | Convierte el resultado: icono ✨, unidad kg, descanso 120 s, peso 0, 1 a 10 series, músculo adivinado por el nombre (`aiGuessMuscles`, `index.html:2686-2701`) | `aiGen.result` | **[Rutinas]** |
| F27 | Recargar base científica | «↻ Recargar» → `recargarConocimiento` (`index.html:2574`); también al arrancar → `seedConocimientoYoutube` (`index.html:2561-2573`, `7936`) | Descarga `conocimiento_youtube.json` y lo guarda | Archivo del sitio | **[Base]** |

### 3.6 Documentos

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F28 | Crear, editar y borrar documento | «＋ New Document», «Open» → `docOpen` (`index.html:3245-3252`); «Save» → `docSave` (`index.html:3253-3262`); «🗑» → `docDelete` (`index.html:3263`) | Notas de texto libre `{id, title, body, dateISO}` | **[Docs]** | **[Docs]** (no se sube a la nube) |
| F29 | Exportar documento | «⤓» → `docExport` (`index.html:3264`) | Descarga `<título>.txt` | **[Docs]** | Archivo descargado |

### 3.7 Programas

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F30 | Crear o editar programa | «＋ Nuevo programa», «✎ Editar» → `pgOpenEdit` (`index.html:3565-3574`); «✓ Crear programa» / «✓ Guardar» → `pgSaveEdit` (`index.html:3614-3643`) | Valida nombre (≤ 80), fase, fechas (≤ 730 días), metas (≤ 10), nutrición; anota «Plan editado: …» | **[Programas]**, **[Rutinas]** | **[Programas]** |
| F31 | Activar programa | «▶ Activar» → `pgActivate` (`index.html:3553-3559`) → `programActivate` (`index.html:3387-3399`) | Cierra el activo anterior (`done`); si el inicio es futuro lo adelanta a hoy; anota en la bitácora de ambos | **[Programas]** | **[Programas]** |
| F32 | Registrar ajuste | «＋ Registrar ajuste» → `pgOpenAdjust` (`index.html:3644`); «✓ Registrar» → `pgSaveAdjust` (`index.html:3653-3664`) → `programAddAdjustment` (`index.html:3409-3417`) | Agrega a `adjustments`; si cambian calorías, proteína o grasa, también a `nutrition.history` | **[Programas]** | **[Programas]** |
| F33 | Checkpoints | «＋ Checkpoint» → `pgOpenCheckpoint` (`index.html:3665`); «✓ Agregar» → `pgSaveCheckpoint` (`index.html:3666-3671`); «✓» → `pgCheckpointDone` (`index.html:3560`) | Agrega `{date, type, note}`; marcar hecho pone `doneDate` | **[Programas]** | **[Programas]** |
| F34 | Cerrar programa | «■ Cerrar programa» → `pgOpenClose` (`index.html:3672`); confirmar → `pgSaveClose` (`index.html:3673-3677`) | Estado `done` o `cancelled`; `endDate` = hoy si aún no pasaba | **[Programas]** | **[Programas]** |
| F35 | Importar programa | Selector de archivo → `importFromFile` → `programImportPreview` (`index.html:3848-3860`) → «✓ Importar programa» → `pgImportConfirm` (`index.html:3886-3897`) | Valida todo (ver 5.3), muestra resumen y avisos, crea las rutinas con ids nuevos (renombra «(2)» si se repite el nombre) y el programa con `source: "coach"` | Archivo | **[Rutinas]**, **[Programas]** |
| F36 | Informe del programa | «⤓ Informe del programa» → `exportProgramReport` (`index.html:7564-7572`) | `coachReport` limitado a las fechas del programa | Ver F70 | Archivo descargado |

### 3.8 Sesión de entrenamiento (reproductor)

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F37 | Iniciar workout | «▶ Start Workout» → `startWorkout` (`index.html:4055-4074`) | Arma una cola con una entrada por serie y abre el reproductor | **[Rutinas]** | Memoria (`player`) |
| F38 | Registrar serie | «Next ▸ (save & rest)» / «Finish Workout ✓» → `playerNext` (`index.html:4144-4176`) | Guarda reps, RIR y peso reales; el peso se registra en la unidad original | Campos `pl-reps`, `pl-rir`, `pl-wt` | Memoria (`player.records`) |
| F39 | Ver el peso en la otra unidad | «⇄ View in …» → `playerToggleUnit` (`index.html:4142`) | Convierte kg↔lb solo para mostrar (`translateWeight`, `index.html:1818`) | — | Memoria |
| F40 | Descanso | Automático tras cada serie (`playerStartRest`, `index.html:4197-4206`); «+30s» → `playerAddRest` (`index.html:4221`); «Skip Rest ▸» → `playerAdvance` (`index.html:4227`) | Temporizador por hora destino; al terminar suenan 3 pitidos y vibra (`playRestAlarm`, `index.html:4243-4260`) | — | Memoria |
| F41 | Saltar ejercicio | «⏭ Skip ejercicio» → `playerSkipExercise` (`index.html:4319-4340`) | Mueve las series que faltan detrás del siguiente ejercicio | — | Memoria |
| F42 | Maximizar / salir | «⛶» → `playerToggleMax` (`index.html:4347`); «✕» → `playerAskClose` (`index.html:4306-4317`) | Al salir con progreso pide confirmación; lo no guardado se pierde | — | — |
| F43 | Guardar sesión | «📓 Save to War Journal» → `playerSave` (`index.html:4284-4304`) | Crea la sesión (formato en 4.3) al inicio del journal y abre esa sesión | Memoria | **[Journal]**, **[Pub]** |

### 3.9 War Journal

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F44 | Navegar el journal | «📓 War Journal» → `rmGoJournal` (`index.html:4048`); `jOpenRoutine`, `jOpenWorkout`, `jOpenSession`, `jBack*` (`index.html:4042-4047`) | Agrupa por nombre de rutina ▸ nombre de workout ▸ sesión | **[Journal]** | — |
| F45 | Exportar sesión para el coach | «⤓» / «⤓ Exportar para el coach» → `exportSession` (`index.html:7337-7341`) | Descarga `journalExport` tipo `journal` | **[Journal]**, **[Coach]**, **[Perfil]**, **[Cuerpo]** | Archivo descargado |

### 3.10 AI Progressions (Random Forest)

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F46 | Explorar progreso | Tarjeta de rutina → `rfOpenRoutine` (`index.html:4636`); pestañas → `rfSelectWorkout` (`index.html:4638`); ejercicio → `rfToggleEx` (`index.html:4639`); «← Rutinas» → `rfBackToGrid` (`index.html:4637`) | Gráficas semanales por ejercicio y por rutina; recomendación del modelo con las sesiones de los últimos 7 días (`rfAggregate`, `index.html:4958-4970`) | **[Rutinas]**, **[Journal]**, **[MetasEj]**, **[Correcciones]**, **[Bloqueos]** | — |
| F47 | Meta por ejercicio | «🎯 Establecer meta», «✎» → `rfEditGoal` (`index.html:4913`); «Guardar meta» → `rfSaveGoal` (`index.html:4915-4927`); «🗑» → `rfRemoveGoal` (`index.html:4928`) | Meta `{startWeight, targetWeight, startISO, deadlineISO}` con clave `rutina::workout::ejercicio` | **[MetasEj]**, **[Journal]** | **[MetasEj]** |
| F48 | Aplicar recomendación | «⤴ Aplicar …» → `rfApplyOne` (`index.html:5099-5110`); «⤴ Aplicar N recomendaciones…» → `rfApplyAll` (`index.html:5111-5128`) | Cambia el peso de todas las series del ejercicio en la rutina y bloquea el ejercicio hasta una sesión nueva | **[Rutinas]**, **[Journal]**, **[Correcciones]** | **[Rutinas]**, **[Bloqueos]** |
| F49 | Corregir o confirmar | Botones de dirección → `rfCorrect` (`index.html:5146-5150`); deslizador → `rfSliderCommit` / `rfCorrectDelta` (`index.html:5141-5156`); «✓ Correcto» → `rfConfirm` (`index.html:5157-5161`); «↺ Deshacer» → `rfClearCorrection` (`index.html:5162-5165`) | Guarda la corrección y reentrena el modelo (`trainRF`, `index.html:4608-4619`) | Memoria (`rfLastFeat`, `rfLastPred`) | **[Correcciones]** |
| F50 | Reactivar ayuda | «↺ Reactivar ayuda ahora» → `rfReactivate` (`index.html:5028`) | Quita el bloqueo del ejercicio | **[Bloqueos]** | **[Bloqueos]** |
| F51 | Reiniciar el modelo | «🗑 Reset Random Forest (borrar correcciones)» (código dentro del `onclick`, `index.html:1638`), con `confirm` | Vacía las correcciones y reentrena | — | **[Correcciones]** = `{}` |

### 3.11 Cuerpo y perfil

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F52 | Registro corporal | «⚖️ Registro corporal», «＋ Nueva entrada», «✎» → `bodyLogOpen`, `bodyLogNew`, `bodyLogEdit` (`index.html:5294-5296`); «✓ Guardar» → `bodyLogSave` (`index.html:5362-5399`); «🗑» → `bodyLogDelete` (`index.html:5400-5404`) | Una entrada por fecha (no futura); todo opcional salvo la fecha; al editar guarda los valores anteriores en `revisions` | **[Cuerpo]** | **[Cuerpo]**, **[Pub]** |
| F53 | Asistente de perfil | «＋ Completar mi perfil», «✎ Edit», «✎ Update my data» → `profileWizardStart` (`index.html:5500-5511`); «✓ Save profile» → `pwSave` (`index.html:5618-5632`) | 7 pasos con rangos fijos: edad 13–90, altura 130–220, peso 30–200, grasa 3–50. Si cambian peso o grasa, crea o actualiza la entrada de hoy en el registro corporal | **[Perfil]**, **[Cuerpo]** | **[Perfil]**, **[HistPerfil]**, **[Cuerpo]**, **[Pub]** |
| F54 | Foto de perfil | Círculo del asistente → `profilePickPhoto`; avatar → `profilePickPhotoCV` (`index.html:5636-5637`); editor → `peSave` (`index.html:5723-5734`) | Recorta a JPEG 480×480 de calidad 0,85 (`index.html:5727-5729`) y la guarda como `data:` URL | Archivo de imagen | **[Perfil]** (campo `photo`); **[Pub]** si mide menos de 200 000 caracteres (`index.html:6450`) |
| F55 | Perfil del coach | «✎ Editar perfil del coach» → `coachOpen` (`index.html:5898-5903`); «✓ Guardar» → `coachSave` (`index.html:5972-6002`); «↻ Reintentar» → `coachRetry` (`index.html:5894`) | Campos: sexo, edad, altura, fase, objetivo estético, músculos prioritarios, experiencia, días por semana, minutos por sesión, equipo, ejercicios preferidos y a evitar, limitaciones, calorías, proteína, modo, nivel de reacción, largo de respuesta, etiquetas de certeza, estilo de explicación | **[Coach]**, **[Perfil]** | **[Coach]**, **[HistPerfil]**; **[Perfil]** si cambian sexo, edad o altura |
| F56 | Objetivos con fecha | «🎯 Objetivos» → `gnOpen('goals')` (`index.html:6026`); «＋ Nuevo objetivo» → `gnNew`; «✓ Guardar» → `gnSave` (`index.html:6042-6064`); «✓» → `gnCloseGoal` (`index.html:6039`); «🗑» → `gnDelete` (`index.html:6041`) | Un objetivo con fase cierra el de fase vigente (`replaced`); borrar pone `deletedAt` | **[Objetivos]**, **[Programas]** (aviso de programa activo) | **[Objetivos]** |
| F57 | Lesiones y notas | «🩹 Lesiones y notas» → `gnOpen('notes')`; «✓ Guardar» → `gnSave`; «✓» → `gnResolve` (`index.html:6040`); «🗑» → `gnDelete` | Tipo lesión o nota, fecha no futura, texto ≤ 500 | **[Notas]** | **[Notas]** |
| F58 | Registrar PR por músculo | Fila del músculo o «＋» → `prOpen` (`index.html:6249-6259`); «−»/«＋» → `prAdjust` (`index.html:6305`); «✓ Save PR» → `prSave` (`index.html:6311-6324`) | Calcula 1RM (Epley) y rango entre 15 niveles según peso corporal, enfoque y músculo | **[Perfil]** + **[Cuerpo]**, **[PRs]**, **[Enfoque]** | **[PRs]**, **[Enfoque]**, **[Pub]** |
| F59 | Ver rangos y radar | Se pinta solo en el perfil: `muscleRanksSection` (`index.html:6327`), `drawMuscleRadar` (`index.html:6350-6384`) | Mejor rango por músculo entre PR manual y sesiones (músculo secundario × 0,6) | **[PRs]**, **[Journal]**, **[Perfil]**, **[Cuerpo]**, **[Enfoque]** | — |

### 3.12 Social

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F60 | Buscar amigos y enviar solicitud | «🔍 Buscar amigos» → `friendsOpen` (`index.html:6907`); buscador → `friendSearchInput` / `friendSearch` (`index.html:6916-6935`); «＋ Agregar» → `friendSend` (`index.html:6936-6942`) | Busca por prefijo de `nameLower` (máx. 20); crea la amistad pendiente y una notificación | FS `users` | FS `friendships/{pairId}`, `notifications/{toUid}/items` |
| F61 | Aceptar, rechazar o eliminar amigo | «Aceptar» → `friendAccept` (`index.html:6943`); «✕» → `friendReject` (`index.html:6949`); «✕» en «Mis amigos» → `friendRemove` (`index.html:6953`, con `confirm`) | Cambia el estado de la amistad o la borra | FS `friendships` | FS `friendships/{pairId}`; `notifications/{otro}/items` (al aceptar) |
| F62 | Ficha de atleta | Fila del ranking o de amigos → `crewOpenMember` (`index.html:7246-7303`) | Muestra biométricos, rangos y comparación contigo | Memoria (miembros del crew, `pub` de amigos, tus datos) | — |
| F63 | Crew: crear, unirse, salir, copiar código | «Crear crew» → `crewCreate` (`index.html:7046`); «Unirme» → `crewJoin` (`index.html:7057`); «Salir del crew» → `crewLeave` (`index.html:7069`, con `confirm`); código → `crewCopyCode` (`index.html:7078`) | Código de 5 caracteres (`index.html:8058-8059`) | FS `crews/{code}` | FS `crews/{code}`, `users/{uid}.crewId`, `crews/{code}/members/{uid}` |
| F64 | Invitaciones a crew | «👥 Invitar amigos al crew» → `crewInviteOpen` (`index.html:7082`); «＋ Invitar» → `crewInviteFriend` (`index.html:7087`); «Unirme» / «✕» → `crewAcceptInvite` / `crewDeclineInvite` (`index.html:6501-6514`) | Crea, acepta o rechaza la invitación | FS `crewInvites` (suscripción) | FS `crewInvites/{code__toUid}`, `crews/{code}.members`, `users/{uid}.crewId` |
| F65 | Sincronizar mis stats | «↻ Sincronizar mis stats» → `cloudSyncMe` (`index.html:6462-6470`); también automático tras guardar sesión, perfil, PR o cuerpo | Publica tu resumen | **[Perfil]**, **[Cuerpo]**, **[PRs]**, **[Journal]** | **[Pub]** |
| F66 | Notificaciones | «🔔» → `notifsOpen` (`index.html:6541`); «✕» de actividad → `notifClear` (`index.html:6577`) | Lista solicitudes de amistad, invitaciones a crew y «Actividad» | Memoria (`friendships`, `crewInvites`, `notifs`) | FS borra `notifications/{uid}/items/{id}` |
| F67 | Chats | «✉» → `chatsOpen` (`index.html:6592`); amigo → `openChat` (`index.html:6626`); crew → `openCrewChat` (`index.html:6636`); «➤» / Enter → `chatSend` (`index.html:6717-6730`) | Conversación con un amigo o con el crew. La consulta pide `orderBy('at','asc')` + `limit(100)` (`index.html:8178`, `8188`), es decir, los 100 mensajes más antiguos | FS `chats/{pairId}/messages`, `crewChats/{code}/messages` | Las mismas colecciones |
| F68 | Enviar rutina o entreno al chat | «＋» en el chat → `sendPickRoutineForChat` (`index.html:6761-6777`) → `doSendRWToChat` (`index.html:6779-6790`) | Mensaje con la rutina o el workout completo | **[Rutinas]** | FS `chats/…` o `crewChats/…` |
| F69 | Ver y clonar lo recibido | «👁 Previsualizar» → `rwPreview` (`index.html:6804-6819`); «⬇ Clonar» → `rwClone` (`index.html:6828-6851`); «Aquí» → `cloneWorkoutInto` (`index.html:6852`); «Crear» → `cloneWorkoutNewRoutine` (`index.html:6861`) | Agrega la rutina o el entreno a tus rutinas con ids nuevos | Mensaje del chat | **[Rutinas]** |

### 3.13 Informes y datos

| ID | Función | Se activa con | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F70 | Informe para el coach | «📋 Informe para el coach» → `exportCoachReport` (`index.html:7557-7562`) → `buildCoachReport` (`index.html:7465-7556`) | `coachReport` de las últimas 8 semanas, en una sola línea (sin sangría) | **[Journal]**, **[Cuerpo]**, **[Coach]**, **[Perfil]**, **[Objetivos]**, **[Notas]**, **[MetasEj]**, **[Programas]**, **[Rutinas]**, **[HistRutinas]** | Archivo `gymai-coach-report-<fecha>.json` |
| F71 | Super Journal | Selector de periodo + «⤓ Super Journal (coach)» → `exportSuperJournal` (`index.html:7362-7369`) | `journalExport` tipo `superJournal` | **[Journal]**, **[Cuerpo]**, **[Coach]**, **[Perfil]**, **[Rutinas]** | Archivo `gymai-super-journal-<fecha>.json` |
| F72 | Respaldo | «⤓ Respaldo completo» → `dataBackup('all')`; «⤓ Descargar respaldo JSON antes de borrar» → `dataBackup(cat)` (`index.html:7624-7630`) | `dataBackup` con las partes de `DATA_PARTS` | Las 10 partes de `DATA_PARTS` (`index.html:7584-7597`), **[Perfil]**, **[Coach]** | Archivo `gymai-respaldo-<cat>-<fecha>.json` |
| F73 | Borrar datos por categoría | «Borrar…» → `dataPick` (`index.html:7668`); escribir `BORRAR` + «🗑 Borrar definitivamente» → `dataWipe` (`index.html:7686-7698`) | Vacía las partes de la categoría en LS y FS; en las listas guarda `wipedAt` (`wipeList`, `index.html:7643`) | `DATA_CATS` (`index.html:7598-7605`) | Las partes elegidas (ver 4.2) |
| F74 | Datos de prueba | «🧪 Cargar datos de prueba» / «↻ Recargar…» → `demoSeed` (`index.html:7733-7827`); «✕ Quitar datos de prueba» → `demoRemove` (`index.html:7840-7852`) | Unas 9 semanas generadas con semilla fija; todo marcado `demo: true` o con id `demo-…` | — | **[Rutinas]**, **[Journal]**, **[Cuerpo]**, **[Objetivos]**, **[Notas]**, **[HistRutinas]**, **[MetasEj]**; **[Coach]** solo si estaba vacío |
| F75 | Modo inspección | «🔍 Modo inspección» → `rmGoInspect` (`index.html:7859`) | Conteo, últimos 5 registros y última hora guardada (dispositivo y nube) de 12 tipos de dato | Todo lo anterior + **[Sync]** | — |

### 3.14 Procesos automáticos y funciones sin conectar

| ID | Función | Dónde | Qué hace | Lee | Escribe |
|---|---|---|---|---|---|
| F76 | Sincronización de listas | `scheduleSync` / `syncList` (`index.html:2182-2200`) | Lee la nube, combina por `id` (gana el `updatedAt` más reciente; en programas se unen ajustes, nutrición y checkpoints, `index.html:2153-2177`), filtra lo agregado antes de `wipedAt` y escribe en los dos lados | Listas en LS y FS | Listas en LS y FS, **[Sync]** |
| F77 | Versionado automático | `profileSnapshot` (`index.html:2203-2213`), `routineHistoryTrack` (`index.html:2216-2237`), `routineHistoryTrim` (`index.html:2240-2249`) | Versión del perfil o del perfil del coach si cambió; una foto de rutina por día con cambios; recorta fotos viejas pasados ~700 000 caracteres | **[Perfil]**, **[Coach]**, **[Rutinas]** | **[HistPerfil]**, **[HistRutinas]** |
| F78 | Notificaciones de actividad | `cloudSubscribeNotifs` (`index.html:6523-6530`), `notifyFriends` (`index.html:6583-6589`); en el código dice «SIN CONECTAR» (`index.html:6522`, `6582`) | Escuchar y enviar avisos de actividad. Nadie las llama | — | — |
| F79 | Ayudante de consola | `guardarConocimientoYoutube` (`index.html:2553-2557`) | Guarda un array de textos como base científica. Nadie la llama | — | **[Base]** |
| F80 | App instalable y sin conexión | `HTML/service-worker.js`, registro en `index.html:7951-7957`, `HTML/manifest.json` | Guarda en caché la app y sus archivos | Red / caché | Caché `gymai-v2-static` y `gymai-v2-runtime` |
| F81 | Migración de claves | `index.html:7920-7930` | Una sola vez por dispositivo: borra `gymAI_profile_v1`, `gymAI_musclePR_v1`, `gymAI_focus_v1`, `gymAI_journal_v2` sin sufijo y toda clave `…::__none__` | LS | LS (`gymAI_acct_migration_v2 = "1"`) |

---

## 4. Modelo de datos

### 4.1 Firestore: colecciones y campos

Todas las funciones de nube están en el objeto `window.Cloud` (`index.html:8069-8198`).

**`users/{uid}`** (documento por cuenta)

| Campo | Tipo | Se escribe en | Se lee en |
|---|---|---|---|
| `displayName` | string | `index.html:8065`, `8074` | `index.html:8144` (búsqueda, si no hay `pub.name`) |
| `email` | string | `index.html:8065`, `8074` | — (la pantalla usa el correo de Firebase Auth, `index.html:5744`, `8209`) |
| `crewId` | string \| null | `index.html:8065`, `8074`, `8115`, `8123`, `8129`, `8168` | `index.html:8208` |
| `profile` | objeto (ver «Perfil» en 4.3) | `Cloud.saveProfile` `index.html:8093` (desde `index.html:2258`) | `Cloud.getProfile` `index.html:8094` (desde `index.html:2290`) |
| `musclePRs` | objeto `{músculo: [PR…]}` | `Cloud.saveMusclePRs` `index.html:8095` (desde `index.html:2264`, `7592`) | `Cloud.getMusclePRs` `index.html:8096` (desde `index.html:2293`) |
| `pub` | objeto (ver «Resumen público» en 4.3) | `Cloud.savePub` `index.html:8138` (desde `index.html:6467`) | `Cloud.getUserPub` `index.html:8139`; búsqueda `index.html:8144` |
| `nameLower` | string | `index.html:8138` | Consulta de búsqueda `index.html:8142` (rango `>= q` y `<= q + "\uf8ff"`; el carácter invisible está en el archivo) |

**`users/{uid}/data/{documento}`**

| Documento | Campos | Contenido de `payload` | Escribe / lee |
|---|---|---|---|
| `routines` | `payload` (string JSON), `updatedAt` (timestamp del servidor) | lista de rutinas | `index.html:8097` / `8098` |
| `journal`, `profileHistory`, `goals`, `notes`, `routineHistory`, `programs`, `exerciseGoals` | `payload` (string JSON), `wipedAt` (string ISO \| null), `updatedAt` | lista (las 6 primeras) u objeto (`exerciseGoals`) | `Cloud.setData` `index.html:8100` / `Cloud.getData` `index.html:8101` |
| `bodyLog` | `payload` (string JSON), `updatedAt` | lista de entradas corporales | `index.html:8105` / `8106` |
| `coachProfile` | campos directos del perfil del coach + `updatedAt` | — (no usa `payload`) | `index.html:8109` / `8110` |

**`crews/{code}`**: `name` (string), `code` (string de 5 caracteres), `members` (array de uid), `createdBy` (uid), `createdAt` (timestamp). Se crea en `index.html:8114`; `members` cambia con `arrayUnion`/`arrayRemove` en `index.html:8122`, `8127`, `8167`; se lee en `index.html:8120`, `8131`.

**`crews/{code}/members/{uid}`**: mismo objeto que el resumen público (`cloudBuildMyData`, `index.html:6445-6461`). Escribe `index.html:8132`; escucha `index.html:8133-8135`; borra `index.html:8128`.

**`friendships/{pairId}`** (`pairId` = los dos uid ordenados y unidos con `__`, `index.html:8061`): `users` (array de 2 uid), `status` (`"pending"` \| `"accepted"`), `requestedBy` (uid), `names` (mapa uid → nombre), `at` (timestamp). Escribe `index.html:8151`, `8155`; escucha `index.html:8159-8161`; borra `index.html:8158`. Se usa en `friendLists` (`index.html:6883-6897`).

**`crewInvites/{code}__{toUid}`**: `code`, `crewName`, `toUid`, `fromUid`, `fromName`, `toName`, `status: "pending"`, `at`. Escribe `index.html:8164`; escucha `index.html:8172-8174`; borra `index.html:8169`, `8171`.

**`chats/{pairId}/messages/{id}`** y **`crewChats/{code}/messages/{id}`**: `at` (timestamp), `from` (uid), `fromName` (string), `type` (`"text"` \| `"routine"` \| `"workout"`), y según el tipo `text` (string) o `name` (string) + `payload` (rutina o workout completos). Escribe `index.html:8177`, `8187` (desde `index.html:6724-6726`, `6783-6786`, `6797`); escucha `index.html:8178`, `8188`.

**`notifications/{uid}/items/{id}`**: `type`, `fromUid`, `fromName`, `at`, `read: false`. El código escribe `type: "friend_request"` (`index.html:8152`) y `"friend_accepted"` (`index.html:8156`). `renderNotifs` también sabe leer `type: "pr"` con `muscle` y `rango`, y `text` (`index.html:6557-6562`), pero ningún código escribe esos campos y la suscripción no se activa (F78). Borra `index.html:8197`.

### 4.2 Datos en el dispositivo (`localStorage`)

| Clave | Por cuenta | Tipo del valor | Se escribe en | Se lee en |
|---|---|---|---|---|
| `gymAI_routines_v2` | sí | array de rutinas | `index.html:2080`, `2296`, `2299` | `index.html:2076`, `2299` |
| `gymAI_routines_v2` (sin sufijo) | no | array de rutinas | `seedRoutines`, `index.html:2070` | ninguna lectura sin sufijo |
| `gymAI_journal_v2` | sí | array de sesiones | `index.html:2087`, `2195` | `index.html:2082`, `2139` |
| `gymAI_hist_profile_v1` | sí | array de versiones de perfil | `listSave` `index.html:2141` | `listLoad` `index.html:2139` |
| `gymAI_hist_goals_v1` | sí | array de objetivos | igual | igual |
| `gymAI_hist_notes_v1` | sí | array de lesiones y notas | igual | igual |
| `gymAI_hist_routines_v1` | sí | array de fotos de rutina | igual | igual |
| `gymAI_hist_programs_v1` | sí | array de programas | igual | igual |
| `<clave de lista>_wiped` (p. ej. `gymAI_journal_v2_wiped`) | sí | string ISO | `index.html:2142`, `2193` | `index.html:2189-2190`, `7837` |
| `gymAI_lastsync_v1` | sí | objeto `{nombre: ISO}` | `index.html:2180` | `index.html:2179`, `7861` |
| `gymAI_goals_v1` | sí | objeto de metas por ejercicio | `index.html:2306`, `4647`, `7590` | `index.html:4645` |
| `gymAI_goals_dirty_v1` | sí | `"1"` | `index.html:4647`, `7590` | `index.html:2305`; se borra en `index.html:4653` |
| `gymAI_bodylog_v1` | sí | array de entradas corporales | `index.html:2314`, `5225` | `index.html:5220` |
| `gymAI_bodylog_dirty_v1` | sí | `"1"` | `index.html:5226` | `index.html:2313`; se borra en `index.html:5233` |
| `gymAI_profile_v1` | sí | objeto perfil | `index.html:5428` | `index.html:5427` |
| `gymAI_musclePR_v1` | sí | objeto de PRs | `index.html:6139` | `index.html:6138` |
| `gymAI_focus_v1` | sí | string (`bodybuilder` \| `hibrido` \| `powerlifter`) | `index.html:6319` | `index.html:6216`, `6253` |
| `gymAI_corrections_v3` | sí | objeto de correcciones | `index.html:4463`, `4466` | `index.html:4448` |
| `gymAI_corrections_v2` | sí | objeto (versión anterior) | — | `index.html:4454` (migración) |
| `gymAI_corrections_v1` | no | objeto (versión anterior) | — | `index.html:4455` (migración) |
| `gymAI_rflocks_v1` | sí | objeto `{clave: ISO}` | `index.html:4476` | `index.html:4475` |
| `gymAI_docs_v1` | no | array de documentos | `index.html:3218` | `index.html:3217` |
| `conocimiento_youtube` | no | array (strings u objetos) | `index.html:2555`, `2568` | `index.html:2543`, `2563` |
| `gymAI_acct_migration_v2` | no | `"1"` | `index.html:7929` | `index.html:7922` |
| `<clave>::__none__` | — | valor de cualquier clave escrito sin sesión (`aKey`, `index.html:1910`) | cualquier escritura sin sesión | se borran en la migración `index.html:7926` |

**Catálogo de partes de datos** (`DATA_PARTS`, `index.html:7584-7597`), usado por el respaldo y el borrado:

| Parte | Etiqueta | Cómo se borra |
|---|---|---|
| `journal` | sesiones | `wipeList('journal')` |
| `bodyLog` | registros de peso, % grasa y medidas | `saveBodyLog([])` |
| `goals` | objetivos | `wipeList('goals')` |
| `notes` | lesiones y notas | `wipeList('notes')` |
| `exerciseGoals` | metas por ejercicio | `{}` en LS + marca pendiente + subir a FS |
| `musclePRs` | PRs por músculo | `{}` en LS y en FS |
| `profileHistory` | versiones guardadas del perfil | `wipeList` |
| `programs` | programas | `wipeList` |
| `routineHistory` | cambios de rutina registrados | `wipeList` |
| `routines` | rutinas | `routines = []` + `saveRoutines()` |

Categorías de borrado (`DATA_CATS`, `index.html:7598-7605`):
- «Sesiones» → `journal`.
- «Peso corporal y medidas» → `bodyLog`.
- «Objetivos y notas» → `goals`, `notes`, `exerciseGoals`.
- «Todo menos mis rutinas» → `journal`, `bodyLog`, `goals`, `notes`, `exerciseGoals`, `programs`, `musclePRs`, `profileHistory`, `routineHistory`.
- «Mis rutinas» → `routines` (marcada `danger`).

### 4.3 Estructuras de datos (campo, tipo y dónde se usa)

**Rutina** — crea `routineModalSave` (`index.html:3076`), `aiGenSave` (`index.html:2705`), `cloneRoutineFresh` (`index.html:3268`), `seedRoutines` (`index.html:2011`)

| Campo | Tipo | Dónde se usa |
|---|---|---|
| `id` | string (`'id' + tiempo base36 + 4 al azar`, `index.html:1797`) | búsquedas `findRoutine` `index.html:2090`; `routineIds` de programas |
| `name` | string | Journal, metas y Random Forest enlazan por **nombre** (`index.html:3909`, `4656`, `4665`, `7383`) |
| `icon` | string (emoji) | tarjetas `index.html:2380` |
| `complexity` | 1 \| 2 \| 3 (opcional; sin él cuenta como 2) | `rxLvl` `index.html:2105` |
| `workouts` | array de workouts | todo el Routine Manager |
| `demo` | boolean (solo datos de prueba) | `isDemo` `index.html:7709` |

**Workout**: `id` (string), `name` (string), `exercises` (array).

**Ejercicio**

| Campo | Tipo | Dónde se usa |
|---|---|---|
| `id` | string | edición, `startWorkout` |
| `name` | string (se recorta, `cleanExName` `index.html:1926`) | journal, Random Forest y metas por nombre |
| `meta` | string (descripción libre) | `index.html:2806`, `2819`, `4133` |
| `unit` | `"kg"` \| `"lb"` \| `"kg_db"` \| `"lb_db"` (`UNITS`, `index.html:1798`) | volumen (`toKg`, `index.html:1800`), pasos del modelo (`index.html:4931`) |
| `restSeconds` | número (0–600 en el editor, `index.html:2808`) | temporizador `index.html:4173` |
| `muscles` | array `{key, role}`; `key` ∈ 10 músculos (`MUSCLE_GROUPS`, `index.html:6165-6176`), `role` ∈ `primary` \| `secondary` | rangos (`index.html:6208-6239`), informe (`index.html:7503`) |
| `sets` | array de series | — |

**Serie**: `reps` (entero ≥ 0), `rir` (entero 0–10), `weight` (número ≥ 0; 0 = peso corporal); opcionales de nivel 3: `type` (`working`, `warmup`, `backoff`, `amrap`, `restpause`, `cluster`; `index.html:2109-2116`), `tempo` (string), `note` (string), `dropsets` (array `{reps, weight}`). Limpieza en `index.html:1921-1955`.

**Sesión del journal** — `playerSave` (`index.html:4292-4298`)

| Campo | Tipo | Dónde se usa |
|---|---|---|
| `id` | string | navegación, exportación |
| `dateISO` | string ISO (hora de fin) | orden, ventanas de tiempo |
| `startedAt` | string ISO | informe `index.html:7552` |
| `routineName`, `workoutName` | string | agrupación del journal (por nombre) |
| `durationSec` | número | detalle, informe |
| `totalVolumeKg` | número (convertido a kg) | tarjetas del journal |
| `totalSets` | número | tarjetas del journal |
| `exercises[]` | `{exId, name, unit, muscles, sets[]}` | todo |
| `exercises[].sets[]` | `{setNum, target{reps,rir,weight}, actual{reps,rir,weight}, at}` | Random Forest, rangos, informe |
| `addedAt` | string ISO (solo datos de prueba) | filtro de borrado `index.html:2128`, `7792` |
| `demo` | boolean (solo prueba) | `isDemo` |

**Entrada corporal** — `normBodyEntry` (`index.html:5204-5215`): `id` (string), `date` (`AAAA-MM-DD`), `weightKg` (número ≤ 500 \| null), `bodyFatPercent` (≤ 75 \| null), `bodyFatMethod` (string \| null), `measurementsCm` `{waist, chest, arm, thigh, hips, neck}` (≤ 300 \| null cada una; `index.html:5187`), `note` (string), `createdAt`, `updatedAt` (ISO), `revisions` (array con `replacedAt` + valores anteriores, `index.html:5191-5197`). Las claves desconocidas se conservan.

**Perfil del atleta** — `pwSave` (`index.html:5621`): `name` (string ≤ 32), `sex` (`male` \| `female`), `age`, `heightCm`, `weightKg`, `bodyFat` (números), `photo` (string `data:image/jpeg;base64,…` o `''`). Peso y grasa «vigentes» salen del registro corporal si existe (`effProfile`, `index.html:5249-5256`).

**Perfil del coach** — `normCoach` (`index.html:5832-5854`)

| Campo | Tipo / valores | Dónde se usa |
|---|---|---|
| `goal.phase` | `cutting` \| `bulking` \| `recomp` \| `maintenance` \| `''` | chips del perfil; informe `goals.coachProfileGoal` |
| `goal.aestheticGoal` | string | editor |
| `goal.priorityMuscles` | array de claves de músculo | editor, chips |
| `experience` | string | editor |
| `availability.daysPerWeek` | número > 0 y ≤ 7, redondeado (`cNum`, `index.html:5825`) \| null | adherencia del informe (`index.html:7504`, `7538`) |
| `availability.sessionMinutes` | número > 0 y ≤ 300, redondeado \| null | chips |
| `equipment` | string | editor |
| `preferences.liked`, `preferences.avoided` | array de strings (se escriben separados por comas) | editor |
| `limitations` | string | editor |
| `nutrition.calories`, `nutrition.proteinG` | número > 0 redondeado (≤ 10000 / ≤ 1000) \| null | chips |
| `coachSettings.mode` | `test` \| `normal` (por defecto `test`) | chips |
| `coachSettings.reactionLevel` | `conservative` \| `proactive` | chips |
| `coachSettings.responseLength` | `short` \| `detailed` | chips |
| `coachSettings.certaintyLabels` | `always` \| `whenRelevant` | editor |
| `coachSettings.explanationStyle` | string | editor |

`sex`, `age` y `heightCm` no se guardan aquí: se toman del perfil del atleta (`coachProfileFull`, `index.html:5856-5861`).

**Versión de perfil** (`profileHistory`, `index.html:2211`): `id`, `source` (`profile` \| `coach`), `createdAt`, `updatedAt`, `data` (perfil sin foto o perfil del coach), `deletedAt` opcional.

**Objetivo** (`goals`, `index.html:6053`): `id`, `phase` (o null), `description` (≤ 200), `startDate`, `targetDate` (o null), `endDate` (o null), `status` (`active` \| `done` \| `replaced`), `createdAt`, `updatedAt`, `deletedAt` opcional.

**Lesión o nota** (`notes`, `index.html:6060`): `id`, `type` (`injury` \| `note`), `date`, `text` (≤ 500), `resolvedDate` (o null), `createdAt`, `updatedAt`, `deletedAt` opcional.

**Foto de rutina** (`routineHistory`, `index.html:2222-2223`): `id`, `routineId`, `name`, `action` (`snapshot` \| `created` \| `edited` \| `deleted`), `date` (`AAAA-MM-DD`), `createdAt`, `updatedAt`, `routine` (copia completa o null), `trimmed` (true si se recortó, `index.html:2246`).

**Programa** — `normProgram` (`index.html:3342-3355`) y `programCreate` (`index.html:3372-3385`)

| Campo | Tipo / valores | Dónde se usa |
|---|---|---|
| `id` | string | navegación, informe |
| `name` | string ≤ 80 | todo |
| `phase` | `cutting` \| `bulking` \| `recomp` \| `maintenance` (`PG_PHASES`, `index.html:3334`) | etiquetas |
| `status` | `planned` \| `active` \| `done` \| `cancelled` (`index.html:3335`) | orden, programa activo |
| `startDate`, `endDate` | `AAAA-MM-DD` | semanas, ventanas del informe |
| `goals[]` | `{description ≤ 120, metric, startValue, targetValue, targetDate?, exercise?}`; `metric` ∈ `weightKg`, `bodyFatPercent`, `waistCm`, `exerciseWeight`, `other` (`index.html:3336`) | progreso `programGoalProgress` (`index.html:3429-3439`) |
| `routineIds[]` | ids de rutina | sección «Rutinas» |
| `nutrition` | `{calories ≤ 10000, proteinG ≤ 1000, fatMinG ≤ 500, notes ≤ 200, history[{date, calories, proteinG, fatMinG, reason}]}` | sección nutrición, informe |
| `checkpoints[]` | `{date, type: review \| deload, note, doneDate?}` | próximo checkpoint, informe |
| `adjustments[]` | `{date, change, reason, source: user \| coach}` | bitácora |
| `notes` | string ≤ 600 | detalle |
| `createdAt`, `updatedAt`, `deletedAt?` | ISO | combinación entre dispositivos |

**Meta por ejercicio** (`exerciseGoals`, `index.html:4924`): objeto con claves `"rutina::workout::ejercicio"` y valores `{startWeight, targetWeight, startISO, deadlineISO, demo?}`.

**PR por músculo** (`musclePRs`, `index.html:6317`): `{chest: [ … ], shoulders: [ … ], …}`; cada PR = `{date (ISO), weightKg, reps, bw (peso corporal), focus, rm (1RM estimado), nivel (0–14), rango (texto)}`.

**Corrección del modelo** (`index.html:5148`, `5154`, `5159`): `{label: 0–4, feat: array de 9 números, delta?: número, confirmed?: true}`, con clave `rutina::workout::ejercicio`.

**Bloqueo del modelo** (`index.html:4477`): `{clave: fecha ISO del último log aplicado}`.

**Documento** (`index.html:3258`): `{id, title, body, dateISO}`.

**Resumen público** (`pub` y miembros de crew; `cloudBuildMyData`, `index.html:6445-6461`)

| Campo | Tipo | Dónde se usa |
|---|---|---|
| `name` | string | ranking, búsqueda, chat |
| `photo` | string `data:` (solo si mide menos de 200 000 caracteres) | avatares |
| `sex` | string | — |
| `age`, `heightCm`, `weightKg`, `bodyFat`, `bmi` | número \| null | ficha de atleta `index.html:7263-7269` |
| `muscles` | `{músculo: {nivel, rango}}` | ficha y comparación |
| `topRank` | `{nivel, rango, key}` \| null | ranking, búsqueda |
| `bench` | `{rango, weightKg, reps, nivel}` \| null | ficha |
| `weeklyVolumeKg` | número (últimos 7 días, en kg) | orden del ranking `index.html:7151` |
| `updatedAt` | número (ms) | — |

**Base científica** (`conocimiento_youtube`): el lector acepta strings u objetos con `texto`, `transcript` o `text` (`index.html:2541-2551`). El archivo trae `{videoId, url, texto}`.

**Estados que solo viven en memoria**: `cloudState` (`index.html:2251-2254`), `coachState` (`index.html:5823`), `player` (`index.html:4068`), `aiGen` (`index.html:2459`), `rfModel` (`index.html:4365`), y los estados de cada ventana: `pgState`/`pgDraft`, `blState`, `gnState`, `pwState`, `prState`, `peState`, `coachDraft`, `meMuscles`.

---

## 5. Importar y exportar

### 5.1 Archivos que genera la app

Todas las descargas pasan por `downloadFile` (`index.html:1860-1865`): crea un `Blob` y un enlace temporal. No se envía nada a ningún servidor.

| Formato | Función | Nombre del archivo | Sangría | Requiere sesión |
|---|---|---|---|---|
| Rutina (`type: "routine"`) | `exportRoutine` `index.html:3290-3294` | `gymai-routine-<nombre>.json` (nombre: caracteres no alfanuméricos → `_`, máx. 40; `safeName`, `index.html:1866`) | 2 espacios | No (el botón solo se ve con sesión) |
| `journalExport` tipo `journal` | `exportSession` `index.html:7337-7341` | `gymai-journal-<workout>-<AAAA-MM-DD>.json` (fecha tomada de `dateISO`, en UTC) | 2 espacios | No |
| `journalExport` tipo `superJournal` | `exportSuperJournal` `index.html:7362-7369` | `gymai-super-journal-<AAAA-MM-DD>.json` (fecha de `toISOString()`, en UTC) | 2 espacios | No |
| `coachReport` (alcance `last8weeks`) | `exportCoachReport` `index.html:7557-7562` | `gymai-coach-report-<AAAA-MM-DD>.json` (fecha local, `todayStr`) | Ninguna (compacto) | Sí (`index.html:7558`) |
| `coachReport` (alcance `program`) | `exportProgramReport` `index.html:7564-7572` | `gymai-program-report-<slug>-<AAAA-MM-DD>.json` (slug: minúsculas, sin acentos, máx. 30) | Ninguna | Sí (`index.html:7565`) |
| `dataBackup` | `dataBackup` `index.html:7624-7630` | `gymai-respaldo-<categoría>-<AAAA-MM-DD>.json` | 1 espacio | No |
| Documento de texto | `docExport` `index.html:3264` | `<título>.txt` | — | No |

Además, los mensajes de chat transportan rutinas o workouts como `{type: "routine" | "workout", name, payload}` (`index.html:6736`, `6741`, `6783`).

### 5.2 Estructura de cada formato

**Rutina** (`index.html:3292`)
```json
{ "app": "GymAI", "version": 2, "type": "routine", "exportedAt": "ISO",
  "routine": { "...rutina completa, con sus ids (ver 4.3)..." } }
```

**`journalExport`** (`buildJournalExport`, `index.html:7322-7336`; cada sesión con `exportSessionObj`, `index.html:7315-7320`)
```text
{ "journalExport": {
  "app": "GymAI", "version": 2, "type": "journal | superJournal", "exportedAt": "ISO",
  "athlete": { "...perfil del coach completo, con sex/age/heightCm del perfil del atleta..." },
  "bodyLog": [ "..." ],
  "activeRoutine": "nombre de la rutina de la sesión más reciente | null",
  "sessions": [ { "id", "date", "routine", "workout", "durationMin", "totalVolumeKg", "totalSets",
                  "exercises": [ { "name", "unit", "muscles",
                                   "sets": [ { "set", "target": {"reps","rir","weight"}, "actual": {"reps","rir","weight"} } ] } ] } ],
  "routines": [ "...solo superJournal: rutinas actuales completas..." ],
  "period": { "from": "AAAA-MM-DD", "to": "AAAA-MM-DD" },
  "totals": { "sessions", "firstSession", "lastSession" }
} }
```
- `journal` (una sesión): `bodyLog` lleva solo la entrada más reciente (`index.html:7326`); `sessions` lleva una sesión; no lleva `routines`, `period` ni `totals`.
- `superJournal`: `bodyLog` filtrado por periodo; `sessions` de la más vieja a la más nueva (`index.html:7367`); `period` es `null` si se eligió «Todo el historial».
- Periodos del selector (`index.html:7344-7357`): «Últimas 4 semanas», «Últimas 8 semanas», «Últimas 12 semanas» (desde hoy − 7·N días), «Todo el historial», «Rango personalizado…» (exige desde ≤ hasta). Sin sesiones en el periodo: aviso «No hay sesiones en ese periodo».
- Las series exportadas no incluyen `at` y las sesiones no incluyen `startedAt` (`index.html:7316-7319`).

**`coachReport`** (`buildCoachReport`, `index.html:7465-7556`), claves en orden:

| Clave | Contenido | Líneas |
|---|---|---|
| `app`, `type`, `schemaVersion`, `generatedAt` | `"GymAI"`, `"coachReport"`, `2` (`COACH_REPORT_SCHEMA`, `index.html:7376`), ISO | `index.html:7531` |
| `units` | `weights`, `legend` (`UNIT_INFO`, `index.html:7377`), `bodyWeight: "kg"`, `measurements: "cm"`, `toKg` | `index.html:7532-7533` |
| `window` | `weeks8From`, `sessionDetailFrom`, `bodySeriesFrom`, `today`, `scope` (`last8weeks` \| `program`), `from`, `to` | `index.html:7534` |
| `athlete` | perfil del coach completo | `index.html:7535` |
| `goals` | `coachProfileGoal`, `active[]` (`phase`, `description`, `startDate`, `targetDate`), `exerciseGoals[]` (`routine`, `workout`, `exercise`, `unit`, `startWeight`, `targetWeight`, `startDate`, `deadline`) | `index.html:7536-7537`, `7524-7526` |
| `program` | bloque del programa activo (o del programa pedido), o `null` | `index.html:7538`, `7421-7462` |
| `injuriesAndNotes` | `activeInjuries[]` (`date`, `text`), `recent[]` (`date`, `type`, `text`, `resolvedDate`) | `index.html:7539-7540` |
| `body` | `latest`, `weight[]` (`date`, `kg`), `bodyFat[]` (`date`, `pct`, `method`), `measurements[]`, `weeklyAvgWeightKg[]` (`weekStart`, `avg`, `n`) | `index.html:7541-7545` |
| `activeRoutine` | rutina compacta (`compactRoutine`, `index.html:7389-7392`) de la última sesión | `index.html:7546` |
| `exercises[]` | `exercise`, `unit`, `muscles`, `bestSet`, `lastSession`, `trend` (≤ 6 sesiones), `e1rmChange` | `index.html:7478-7494` |
| `weeklyDirectSetsByMuscle[]` | `weekStart`, `partial`, `sets` (series por músculo principal) | `index.html:7548` |
| `adherence` | `plannedPerWeek`, `weeks[]`, `fullWeeks`, `done`, `planned`, `pct` | `index.html:7549-7550` |
| `skippedExercises` | `bySession[]` (`date`, `routine`, `workout`, `planSource`, `skipped[]`, `incomplete[]`), `countByExercise` | `index.html:7507-7515`, `7551` |
| `recentSessions[]` | sesiones de los últimos 14 días con series `{set, target, actual, at}` | `index.html:7552-7554` |

- Ventanas del alcance general (`index.html:7470`): 8 semanas que empiezan en lunes (desde hace 49 días), detalle de 14 días y serie corporal de 112 días.
- Alcance de programa: todo limitado a `[startDate, min(endDate, hoy)]` (`index.html:7468-7473`).
- Bloque `program` (`programReportBlock`, `index.html:7421-7462`): `id`, `name`, `phase`, `status`, `startDate`, `endDate`, `weekNumber`, `totalWeeks`, `notes`, `routines` (nombres), `goals[]` (con `current`, `unit`, `pct`, `reached`), `nutrition` (`current` + `history`), `checkpoints[]`, `nextCheckpoint`, `adjustmentsTotal`, `latestAdjustments` (10), `planVsActual` (`asOf`, `sessions`, `weight`, `goals` con `expectedPct`, `actualPct`, `pace`), `finalSummary` (solo si está terminado o cancelado), `legend` (textos explicativos).

**`dataBackup`** (`index.html:7628`)
```json
{ "app": "GymAI", "type": "dataBackup", "category": "all | sessions | body | goalsNotes | allButRoutines | routines",
  "createdAt": "ISO",
  "data": { "<parte>": "...", "profile": "...solo en all...", "coachProfile": "...solo en all..." } }
```
- Con `all` incluye las 10 partes de `DATA_PARTS`.
- Las listas se exportan completas, también con los registros borrados (`deletedAt`), porque usan `listLoad` (`index.html:7587-7595`).
- No incluye documentos, correcciones ni bloqueos del modelo, enfoque ni base científica.

### 5.3 Archivos que acepta la app y cómo se validan

Hay una sola entrada: el selector oculto `#import-file` (acepta `.json,application/json`, `index.html:1736`). Lo abren «⤒ Import Routine» (`index.html:2403`) y «⤒ Importar programa» (`index.html:3509`). `importFromFile` (`index.html:3297-3319`) decide por el contenido, en este orden:

1. Si no es JSON válido → aviso «Import failed — invalid file» (`index.html:3316`).
2. Si `type === "program"` → importación de programa con validación estricta (abajo).
3. Si `type === "backup"` o trae `routines` como array en la raíz → aviso «This is a full backup — export individual routines to import them one by one» (`index.html:3305`).
4. Si `type === "routine"` y trae `routine` → importa esa rutina.
5. Si trae `name` y `workouts` → importa el objeto como rutina.
6. Cualquier otra cosa → «Unrecognized file format» (`index.html:3308`).
7. En los casos 4 y 5, si además trae `documents[]`, los agrega a **[Docs]** (`index.html:3309-3313`).

**Prueba hecha en el navegador** (archivos de muestra pasados a `importFromFile`):

| Archivo | Resultado observado |
|---|---|
| Rutina exportada (`type: "routine"`, `version: 2`) | «Imported 1 routine» |
| `ROUTINE_TEMPLATE.json` | «Imported 1 routine» |
| Objeto rutina suelto `{name, workouts}` | «Imported 1 routine» |
| `PROGRAM_TEMPLATE.json` | Abre «🗓 IMPORTAR PROGRAMA» con el resumen; `pgValidateImport` devuelve 0 errores |
| Programa con `version: 2` | «ARCHIVO NO VÁLIDO»: «Versión no soportada: se esperaba "version": 1 y llegó 2» |
| `journalExport` (`journal`) | «Unrecognized file format» |
| `journalExport` (`superJournal`) | «Unrecognized file format» |
| `coachReport` | «Unrecognized file format» |
| `dataBackup` | «Unrecognized file format» |
| JSON roto | «Import failed — invalid file» |

**Rutinas (casos 4 y 5).** No hay rechazo por contenido; se normaliza con `cloneRoutineFresh` (`index.html:3265-3279`) y `cleanImportedSet` (`index.html:3281-3289`):
- ids nuevos para rutina, workouts y ejercicios; `name` por defecto «Imported», `icon` por defecto «📋», `complexity` 1/2/3 (otro valor → 2).
- `unit` fuera de las 4 válidas → `kg`; `restSeconds` no numérico → 90.
- Músculos: `back`, `lowerback`, `erector`, `traps` → `upperback`; `forearms` → `biceps`; cualquier otra clave fuera de las 10 se descarta (en la prueba, `abs` desapareció y `traps` pasó a `upperback`); `role` distinto de `primary` → `secondary`.
- Series: `reps` y `rir` enteros (RIR máx. 10), `weight` ≥ 0; `type` solo si es válido; `tempo` y `note` recortados; `dropsets` limpiados.
- No se revisan `app` ni `version`, ni límites de cantidad.

**Programa (caso 2).** `programImportPreview` (`index.html:3848-3860`) → `pgValidateImport` (`index.html:3804-3847`). Si hay errores no se importa nada y se muestran hasta 12 (`index.html:3851-3854`). Reglas:
- `app`, si viene, debe ser `"GymAI"`; `version` debe ser exactamente `1` (`index.html:3806-3807`).
- `program`: objeto obligatorio. `name` 1–80 caracteres. `phase` ∈ `cutting`, `bulking`, `recomp`, `maintenance`. `startDate` y `endDate` válidas (`AAAA-MM-DD`), fin ≥ inicio, duración ≤ 730 días (`index.html:3810-3816`).
- `goals`: lista ≤ 10; cada una con `description` 1–120 caracteres, `metric` válida, `startValue` y `targetValue` numéricos dentro del máximo de la métrica (obligatorios salvo `other`), `exercise` obligatorio con `exerciseWeight`, `targetDate` opcional válida (`pgCleanGoal`, `index.html:3594-3613`; máximos en `index.html:3337`).
- `nutrition`: objeto; `calories` ≤ 10000, `proteinG` ≤ 1000, `fatMinG` ≤ 500, `notes` ≤ 200 (`index.html:3822-3830`).
- `checkpoints`: lista ≤ 40; `date` válida, `type` `review` \| `deload`, `note` ≤ 200 (`index.html:3832-3839`).
- `notes` ≤ 600 (`index.html:3840`).
- `routines`: lista ≤ 10, validada con `pgValidateRoutine` (`index.html:3756-3802`). Acepta una rutina suelta o envuelta como `{type: "routine", routine}`. Reglas: nombre 1–60; `complexity` 1/2/3; 1–14 workouts con nombre; ≤ 30 ejercicios por workout; nombre de ejercicio 1–80; `unit` válida; `restSeconds` 0–1800; músculos con clave válida y `role` `primary`/`secondary`; 1–20 series; `reps` entero 0–500; `rir` entero 0–10 (obligatorio salvo complejidad 1); `weight` 0–2000; `type` válido; `dropsets` con `reps` entero y peso válido.
- Si es válido, muestra un resumen con avisos (`pgImportBodyHTML`, `index.html:3861-3884`): el programa ya terminó, hay nombres de rutina repetidos (se crean como «Nombre (2)»), hay un programa activo. El usuario elige «Planeado» o «Activar ahora».

### 5.4 Plantillas del repositorio

- `PROGRAM_TEMPLATE.json`: programa completo «Definición octubre–diciembre» (`version: 1`, `type: "program"`, `PROGRAM_TEMPLATE.json:15-17`) con reglas en `_rules` (`PROGRAM_TEMPLATE.json:4-14`), 5 metas, nutrición, 3 checkpoints y 2 rutinas. Pasa la validación (prueba en 5.3).
- `ROUTINE_TEMPLATE.json`: rutina «💪 Complete Feature Demo» (`complexity: 2`, 3 workouts) con claves explicativas que empiezan con `_` (`_FEATURE_REFERENCE`, `_FOR_AI_CREATORS`, etc.), que la importación ignora. Se importa como objeto suelto (caso 5).

---

## 6. Conexión con el coach

Hay dos cosas distintas que la app llama «coach»:
- el **coach externo** (Skill `coach-gym`), que recibe archivos;
- el **«AI Coach»**, el generador de rutinas con Gemini (sección 3.5).

### 6.1 Coach externo (Skill `coach-gym`)

No existe conexión directa por red: todo pasa por archivos que el usuario descarga y sube a mano. Las únicas llamadas `fetch` del código son a `conocimiento_youtube.json` y a Gemini (`index.html:2564`, `2664`). `DATA_GUIDE.md:18` lo dice así: «La app no guarda nada en servidores de la Skill».

| Elemento | Texto exacto | Dónde | Qué hace |
|---|---|---|---|
| Sección del perfil | «Perfil del coach» + chips + «✎ Editar perfil del coach» / «↻ Reintentar» | `index.html:5874-5893` | Muestra y edita el perfil del coach (F55). Se guarda solo en la nube; el comentario dice que es «context for the external AI coach (coach-gym Skill)» (`index.html:5802`) |
| Ventana de edición | «🧠 PERFIL DEL COACH» | `index.html:5927-5971` | Campos en 4.3 |
| Botón en Datos | «📋 Informe para el coach» | `index.html:7618` | Descarga `coachReport` (F70) |
| Botón en el programa | «⤓ Informe del programa» | `index.html:3521` | Descarga `coachReport` con alcance de programa (F36) |
| Botón en la sesión | «⤓ Exportar para el coach» | `index.html:4027` | Descarga `journalExport` tipo `journal` (F45) |
| Botón en la lista de sesiones | «⤓» (título «Exportar para el coach») | `index.html:3989` | Igual que el anterior |
| Botón en Datos | «⤓ Super Journal (coach)» | `index.html:7344` | Descarga `journalExport` tipo `superJournal` (F71) |
| Avisos | «Sesión exportada para el coach», «Informe para el coach descargado», «Informe del programa descargado» | `index.html:7340`, `7561`, `7571` | — |
| Programas vacíos | «Crea uno a mano o importa el archivo que te genera tu coach.» | `index.html:3511` | Texto |
| Error de importación | «No se importó nada. Corrige el archivo (o pide a tu coach que lo regenere) y vuelve a intentarlo.» | `index.html:3852` | Texto |
| Importar programa | — | `index.html:3893` | El programa importado se crea con `source: "coach"` y el ajuste «Programa importado» (`index.html:3380`) |
| Origen de un ajuste | «Origen»: «Tú» / «Coach» | `index.html:3720` | Se guarda `source: "user"` o `"coach"` |
| Bitácora del programa | chip «Coach» o «Tú» | `index.html:3530` | Muestra el origen de cada ajuste |
| Datos de prueba | comentario «to try the coach Skill» | `index.html:7703` | Llena 9 semanas y el perfil del coach si está vacío (`index.html:7815-7824`) |
| Comentarios técnicos | «COACH REPORT — compact summary for the coach-gym Skill»; «Enumerations are exactly the values SKILL.md understands» | `index.html:7371`, `5807` | El archivo `SKILL.md` no está en este repo: **no verificado** |
| Documentación | Tabla «Para la Skill: qué puede leer y qué puede escribir» | `DATA_GUIDE.md:5-20` | Describe el flujo informe → programa → informe |
| Plantillas | `PROGRAM_TEMPLATE.json`, `ROUTINE_TEMPLATE.json` | raíz del repo | Formato que debe generar la Skill |

Qué datos del coach entran en cada archivo:
- `athlete` = `coachProfileFull()` en `journalExport` (`index.html:7325`) y en `coachReport` (`index.html:7535`).
- `goals.coachProfileGoal` (`index.html:7536`).
- `availability.daysPerWeek` como sesiones planeadas por semana para la adherencia (`index.html:7504`, `7459`).

### 6.2 «AI Coach» (Gemini), dentro de la app

| Elemento | Texto exacto | Dónde |
|---|---|---|
| Botón en Routine Library | «✨ AI Coach» | `index.html:2400` |
| Título de la vista | «✨ AI Routine Coach» | `index.html:2483` |
| Campo | «Notas para tu coach» (opcional) | `index.html:2489` |
| Botón mientras carga | «El Coach de IA está programando…» | `index.html:2478` |
| Instrucción al modelo | «Eres GymAI Expert Coach. …» | `index.html:2628-2644` |
| Aviso | «Generado por Gemini 2.5 Flash · revisa siempre la rutina antes de entrenar.» | `index.html:2495` |

---

## 7. Seguridad

### 7.1 Inicio de sesión

- Proveedor: Firebase Authentication (`index.html:8035-8037`, `8051-8056`).
  - **Correo y contraseña**: alta con `createUserWithEmailAndPassword` + `updateProfile` (`index.html:8071-8076`); entrada con `signInWithEmailAndPassword` (`index.html:8077`). La pantalla pide «Contraseña (6+)» (`index.html:5468`) y traduce el error `weak-password` a «La contraseña debe tener 6+ caracteres» (`index.html:6431`).
  - **Google**: `signInWithPopup`; si falla por ventana emergente bloqueada, operación no soportada o cancelada, usa `signInWithRedirect` (`index.html:8078-8091`); al cargar revisa `getRedirectResult` (`index.html:8202`).
- No hay en el código: verificación de correo, recuperación de contraseña ni configuración de persistencia de sesión. Ninguna de esas funciones se importa (`index.html:8035-8037`). La persistencia que use Firebase por defecto: **no verificado**.
- Cierre de sesión: `crewSignOut` (`index.html:7033-7045`). Borra del dispositivo solo 6 claves de la cuenta (ver F04). Quedan en LS, con el sufijo de esa cuenta: `gymAI_bodylog_v1`, `gymAI_goals_v1`, las 5 listas `gymAI_hist_*`, `gymAI_rflocks_v1`, `gymAI_lastsync_v1`, las marcas `_wiped` y `_dirty`. También quedan `gymAI_docs_v1` y `conocimiento_youtube`, que no tienen sufijo de cuenta.
- Qué se ve sin sesión:
  - Routine Manager y Athlete Profile muestran solo el acceso (`index.html:2350-2358`, `5437-5446`).
  - Leaderboards pide ir al perfil (`index.html:7120-7125`).
  - Home Feed (contenido fijo) y AI Progressions (con los números fijos) se ven completos.
  - Sin sesión, `aKey()` usa el sufijo `::__none__` (`index.html:1910`).
- La sesión se comunica a la app con eventos del navegador: `cloud-auth` lleva `{uid, email, name, crewId}` (`index.html:8209-8212`) y `cloud-ready` lleva `{available}` (`index.html:8215`). El valor también queda en `window.__cloudAuth` (`index.html:8211`).

### 7.2 Reglas de Firestore (`FIRESTORE_RULES.txt`)

El archivo dice «Copy-paste these rules into Firebase Console → Firestore → Rules» (`FIRESTORE_RULES.txt:3`). Que estén publicadas así: **no verificado**.

| Ruta | Regla | Líneas |
|---|---|---|
| `users/{uid}` | Leer y escribir: el dueño. **Leer: cualquiera (`if true`)**, también sin sesión | `FIRESTORE_RULES.txt:13-17` |
| `users/{uid}/data/{docId}` | Leer y escribir: solo el dueño | `FIRESTORE_RULES.txt:20-22` |
| `crews/{code}` | Leer: cualquiera (`if true`). Crear: el creador debe estar en `members` y en `createdBy`. Actualizar: quien ya es miembro **o quien se agrega a sí mismo** | `FIRESTORE_RULES.txt:28-38` |
| `crews/{code}/members/{memberId}` | Leer: miembros del crew. Escribir: el propio `memberId` (la regla de escritura aparece dos veces: `allow write` y `allow create, update`) | `FIRESTORE_RULES.txt:41-46` |
| `friendships/{pairId}` | Leer, actualizar y borrar: quien está en `users`. Crear: quien se incluye en `users` | `FIRESTORE_RULES.txt:52-62` |
| `crewInvites/{inviteId}` | Leer y actualizar: el destinatario. Crear: el remitente (`fromUid`). Borrar: remitente o destinatario | `FIRESTORE_RULES.txt:67-81` |
| `chats/{pairId}/messages/{msgId}` | Leer: los dos uid de `pairId`. Crear: si `from` es el usuario. **Borrar: cualquier usuario con sesión** (el comentario dice «both can delete their own») | `FIRESTORE_RULES.txt:86-97` |
| `crewChats/{code}/messages/{msgId}` | Leer y borrar: miembros. Crear: miembro con `from` propio | `FIRESTORE_RULES.txt:102-110` |
| `notifications/{uid}/items/{itemId}` | Leer, actualizar y borrar: el dueño. **Crear: cualquier usuario con sesión** | `FIRESTORE_RULES.txt:115-126` |
| Todo lo demás | Denegado | `FIRESTORE_RULES.txt:131-133` |

Datos relacionados con estas reglas:
- En el documento `users/{uid}` (lectura pública según la línea 17) el código guarda:
  - `profile`: nombre, sexo, edad, altura, peso, % grasa y foto (`index.html:2258`, `8093`).
  - `musclePRs` (`index.html:8095`).
  - `email` y `displayName` (`index.html:8065`, `8074`).
  - `pub` (incluye foto, edad, altura, peso, % grasa e IMC; `index.html:6450-6455`) y `nameLower` (`index.html:8138`).
  - `crewId`.
- La búsqueda de amigos consulta toda la colección `users` por `nameLower` (`index.html:8142`).
- Las reglas no revisan el contenido ni el tamaño de los campos, salvo los uid indicados arriba.
- `DATA_GUIDE.md:25` dice que las reglas «solo dejan leer y escribir `users/{uid}/data/*` al dueño», lo cual coincide con `FIRESTORE_RULES.txt:20-22`; no menciona la lectura pública del documento raíz.

### 7.3 Claves y configuración en el código

| Qué | Dónde | Valor |
|---|---|---|
| Configuración web de Firebase | `index.html:8042-8049` | `apiKey` `AIzaSyAcA-…I3o` (completa en el archivo), `authDomain` `gai-2da1d.firebaseapp.com`, `projectId` `gai-2da1d`, `storageBucket` `gai-2da1d.firebasestorage.app`, `messagingSenderId` `175102022489`, `appId` `1:175102022489:web:439aebf4b5721b3120b248` |
| Clave de Gemini | `index.html:2418` | `GEMINI_API_KEY = ''` (vacía). El endpoint queda terminado en `?key=` (`index.html:2419`) |
| Comentario sobre la clave de Gemini | `index.html:2411-2417` | «⚠️ The API key below ships in client code and is therefore PUBLIC. … Restrict it (HTTP referrer / quota) in Google AI Studio, or proxy the call through a backend.» |
| Historial de git | commits `b4889df` y `0169d4a` | En el historial existe un valor no vacío de `GEMINI_API_KEY`. Entró en `b4889df` («Add .gitignore for local files», 22-jun-2026) y se reemplazó por `''` en `0169d4a` («Remove exposed Gemini API key - use environment variable instead»). El valor sigue legible en el historial (no se copia aquí). Si se revocó la clave y si el repositorio es público: **no verificado** |
| `.gitignore` | `.gitignore:5-6` | Ignora `clear` y `clear.pub` (commit `a082458` «Ignore SSH key files»). Ningún commit del historial contiene archivos con esos nombres (`git log --all -- clear clear.pub` vacío) |

### 7.4 Datos que salen del dispositivo

- **A Gemini** (solo al pulsar «Generar»): nombre, sexo, edad, altura, peso, % grasa e IMC del perfil, las notas del formulario y las 11 transcripciones (`index.html:2614-2659`).
- **A Firestore**: todo lo de las secciones 4.1 y 4.2 que tiene equivalente en la nube.
- **Al CDN de Google**: las fuentes y el SDK de Firebase (`index.html:24-26`, `8034-8040`). El service worker guarda en caché también las respuestas de otros orígenes (`HTML/service-worker.js:84-88`).

### 7.5 Cómo se inserta texto en la página

- Los textos del usuario se pasan por `esc()` (`index.html:1796`), que escapa `& < > " '`, antes de meterlos en plantillas `innerHTML`.
- Casos en que el contenido va en atributos sin `esc()` (descripción del código; si se puede aprovechar: **no verificado**):
  - El `payload` de los mensajes de chat (rutinas o workouts de otro usuario) se escribe dentro de atributos `onclick='…'` con comillas simples usando `JSON.stringify` (`index.html:6704-6705`). `JSON.stringify` no escapa la comilla simple.
  - `sendPickRoutineForChat` hace lo mismo con rutinas propias (`index.html:6765`, `6768`).
  - Las fotos (`photo`) de otros usuarios se insertan en `style="background-image:url('…')"` sin `esc()` (`index.html:6683`, `6961`, `7156`, `7262`).
  - Los ids de documentos de Firestore (`inv.id`, `n.id`) sí pasan por `esc()` (`index.html:6555`, `6563`, `7202-7203`).

---

## 8. Cosas raras

### 8.1 Código sin uso o sin conectar

| Elemento | Dónde | Situación |
|---|---|---|
| `cloudSubscribeNotifs()` | `index.html:6523-6530` | Nadie la llama. El comentario dice «SIN CONECTAR … función a medio hacer» (`index.html:6522`; también `CHANGELOG.md:7`) |
| `notifyFriends()` | `index.html:6583-6589` | Nadie la llama (comentario `index.html:6582`) |
| `Cloud.lastMessage` | `index.html:8181-8184` | Nadie la llama |
| `Cloud.available` | `index.html:8070` | No se lee; la app usa el dato del evento `cloud-ready` (`index.html:2274`) |
| `guardarConocimientoYoutube()` | `index.html:2553-2557` | Nadie la llama (ayudante de consola, según `DATA_GUIDE.md:775`) |
| `YT_FUENTES` | `index.html:2452-2457` | Lista de 11 URLs que no se lee en ningún lugar |
| `window.__cloudAuth` | `index.html:8211` | Se asigna y no se lee |
| `profileForceAuth` | declarada `index.html:5431` | Se asigna en `index.html:2277`, `5508`, `7036` y no se lee. Comentario «profileGoAuth removed» (`index.html:5495`) |
| `#mail-badge` | `index.html:1434` | Ningún código lo actualiza; `updateBadges` solo toca `#bell-badge` (`index.html:6537-6540`) |
| Bucle vacío en `notifsOpen` | `index.html:6546` | `forEach` cuyo cuerpo es solo un comentario |
| Variable `r` en `sendWorkoutPick` | `index.html:6740` | Se declara y no se usa |
| `drawRadar()` | `index.html:6386` | Alias de `drawMuscleRadar`; solo se llama al arrancar (`index.html:7933`), cuando aún no existe `#radar-host` (`index.html:6351-6352`) |
| `rfSync()` | `index.html:4630` | Alias de `rfRun()` «kept for the many callers» |
| Encabezado «RADAR CHART» vacío | `index.html:5417-5419` | Bloque de comentario sin código debajo |
| `@keyframes fxBar` | `index.html:1358` | No se usa |
| Selector `.rm-panel` | `index.html:1332` | No hay elemento con esa clase |
| Botones del post de Iván | `index.html:1555`, `1557` | «♥ Liked» y «🔗 Share» no tienen `onclick` |
| `cloudState.unsubNotifs` | `index.html:2254`, `6525` | Solo se asignaría desde la función sin conectar; el cambio de cuenta no lo cancela (`index.html:2278-2283`) |

**Clases CSS sin ningún elemento que las use** (no aparecen en el HTML ni en las plantillas del JavaScript):
- Ranking antiguo: `.lb-header-row`, `.lb-rank`, `.r1/.r2/.r3`, `.lb-athlete`, `.lb-av`, `.lb-name`, `.lb-vol`, `.lb-dots`, `.lb-legend`, `.lb-legend-item`, `.legend-dot` (`index.html:222-245`). `.lb-row` solo aparece en CSS y en la lista de animación (`index.html:7979`).
- Insignias por nivel: `.rank-badge.platinum/.gold/.silver/.bronze/.copper`, `.badge-wings`, `.tier-bar`, `.tier-fill` (`index.html:235-242`).
- Panel antiguo de IA: `.rl-console`, `.rl-header`, `.rl-indicator`, `.rl-title`, `.rl-text`, `.rl-actions`, `.rl-confirm-btn`, `.rl-override-btn`, `.model-state` (`index.html:488-500`).
- Perfil antiguo: `.toggle-row`, `.toggle-label`, `.toggle-sub`, `.ios-toggle`, `.profile-grid`, `.muscle-grid`, `.muscle-row`, `.muscle-name`, `.muscle-sub`, `.radar-container`, `.radar-title`, `.pr-showcase`, `.pr-main`, `.pr-sub`, `.pr-progress`, `.pr-bar-bg`, `.pr-bar-fill`, `.pr-nums` (`index.html:541-562`).
- Tarjeta de rango antigua: `.bp-empty`, `.bp-empty-ico`, `.bp-empty-txt`, `.bp-rankcard`, `.bp-rank-emblem`, `.bp-rank-info`, `.bp-rank-tier`, `.bp-rank-sub`, `.bp-rank-stats`, `.bp-rank-date`, `.bp-tier-ladder`, `.bp-pip` (`index.html:670-686`).
- Varias: `.two-col` (`:186`), `.font-mono` (`:187`), `.card` (`:184`; solo en la lista de animación `index.html:7978`), `.jr-group-label` (`:461`), `.jr-clear` (`:478`), `.rf-controls` (`:1063`), `.rf-select` (`:1064`), `.rf-demo` (`:1137`), `.rf-applyall-locked` (`:1180-1182`), `.toggle-mini` (`:1188-1191`).

### 8.2 Duplicados

| Qué | Dónde |
|---|---|
| Tres fórmulas de 1RM | `e1rmRIR` con RIR y tope 30 (`index.html:4486-4489`, modelo); `estimate1RM` Epley (`index.html:6180-6183`, rangos); `e1rm` Epley redondeado (`index.html:7378`, informe) |
| Dos factores lb → kg | `0.453592` (`toKg`, `index.html:1800`; texto del informe `index.html:7533`) y `KG_PER_LB = 0.45359237` (`index.html:1805`) |
| Dos cálculos de «lunes de la semana» | `weekStartOf` devuelve texto (`index.html:1868`); `weekStartMs` devuelve milisegundos (`index.html:4683`) |
| Dos funciones que dan `AAAA-MM-DD` local | `ymdOf` (`index.html:1867`) y `todayStr` (`index.html:1873`) |
| Dos formas de clonar | `cloneRoutineFresh` (`index.html:3265-3279`) mapea músculos y conserva tipo, tempo, nota y dropsets; `cloneWorkoutFresh` (`index.html:6820-6826`) no mapea músculos y solo copia `reps`, `rir` y `weight` |
| Cuatro cosas llamadas «goals» | objetivos con fecha `gymAI_hist_goals_v1` / `data/goals` (`index.html:2130`); metas por ejercicio guardadas en `gymAI_goals_v1` con las funciones `loadGoals`/`saveGoals` (`index.html:4644-4647`) y en `data/exerciseGoals`; `program.goals` (`index.html:3348`); `coachProfile.goal` (`index.html:5837`) |
| Lista de fases repetida | `PG_PHASES` (`index.html:3334`) y `COACH_ENUMS.phase` (`index.html:5811`) |
| Enfoques repetidos con etiquetas distintas | `AI_FOCUS` («Bodybuilding», «Powerlifting», «Híbrido», `index.html:2446-2450`) y `FOCUS_META` («Bodybuilder», «Powerlifter», «Híbrido», `index.html:6150-6154`) |
| Dos tablas de nombres de unidad | `UNITS` (`index.html:1798`) y `UNIT_INFO` (`index.html:7377`) |
| `.rank-badge` definida dos veces con estilos distintos | `index.html:234` y `index.html:667` |
| Dos barras de navegación con nombres distintos | barra lateral «Leaderboards», «Routine Manager»… (`index.html:1409-1413`) y barra inferior «Ranks», «Routine»… (`index.html:1653-1657`) |
| «Cerrar sesión» en 5 lugares | `index.html:5492`, `5744`, `7192`, `7213`, `7243` |
| Un solo selector de archivo para dos botones | «⤒ Import Routine» (`index.html:2403`) y «⤒ Importar programa» (`index.html:3509`) |
| El nombre `uid` se reutiliza | función `uid()` (`index.html:1797`) y constantes locales `uid` (`index.html:2285`, `7034`) |
| Pantallas «Conectando…» / «Sin conexión» repetidas | `index.html:2352-2356`, `5439-5443`, `7118-7119` |
| Regla de Firestore repetida | `FIRESTORE_RULES.txt:44-45` |

### 8.3 Valores fijos escritos a mano

| Qué | Dónde |
|---|---|
| Home Feed completo: historias, 4 publicaciones con números, nombres Iván / Andy / Iker / Emma | `index.html:1442-1559` |
| Comentarios de «Carrilla» y autor «Iván (You)» | `index.html:1689-1692`, `6409` |
| Tarjetas de AI Progressions: «12,850», «4», «1.4», «91%» y sus variaciones («▲ +8.3% vs last week», etc.) | `index.html:1577-1580` |
| Gráfica «Weekly Tonnage & AI Projection» (puntos, «12.85k», «~14.2k») | `index.html:1591-1626` |
| Insignia «[UPLINK: ACTIVE]», siempre verde | `index.html:1432` |
| Textos iniciales del reproductor «Exercise 1/7 · Set 1/3» y «PPL1 · Push 1» (se reemplazan al empezar) | `index.html:1666-1667` |
| Texto inicial del aviso «Set logged successfully» | `index.html:1679` |
| Cabecera de chat «En línea» para todo chat directo | `index.html:6649` |
| Rutinas de ejemplo PPL1, ARNOLD SPLIT2, BODY COMBAT con pesos y músculos | `index.html:1976-2072` |
| Escalas de rango: 15 niveles, porcentajes, multiplicadores por enfoque, proporción por músculo, factor secundario 0,6 | `index.html:6143-6176` |
| Colores de nivel (Bronce, Plata, Oro, Platino, Diamante) | `index.html:6155-6161` |
| Modelo: 40 árboles, profundidad 10, mínimo 4, 3 variables por corte, 5 clases, 9 variables | `index.html:4366-4368` |
| Reglas de verdad del modelo (umbrales 0,5 / 0,25 / 1,09 / 0,90 / 1,03 / 0,965) | `index.html:4553-4565` |
| Entrenamiento con 1 400 sesiones simuladas; cada corrección se repite 22 veces | `index.html:4609`, `4613` |
| Corrección «mucho» si el delta es ≥ 15 o ≤ −15, en cualquier unidad | `index.html:5153` |
| Ventana del modelo: 7 días | `index.html:4959` |
| Pasos por unidad: kg 2,5 · kg_db 2 · lb y lb_db 5 | `index.html:4931` |
| Ventanas del informe: 49, 14 y 112 días; tendencia de 6 sesiones; 10 ajustes | `index.html:7470`, `7487`, `7451` |
| Valores iniciales: asistente (25 años, 170 cm, 70 kg, 18 %); ejercicio nuevo (3 × 10, RIR 2, 20 kg, 90 s); PR (40 kg × 5); programa (8 semanas, fase cutting); meta por ejercicio (+10, 8 semanas) | `index.html:5502`, `3133`, `6256`, `3568-3572`, `4879`, `4885` |
| Gemini: modelo `gemini-2.5-flash`, `temperature: 0.8`, 4 días por defecto | `index.html:2419`, `2658`, `2593` |
| Foto: 480 px, calidad 0,85; límite para publicarla 200 000 caracteres | `index.html:5727-5729`, `6450` |
| Recorte de historial de rutinas a 700 000 caracteres | `index.html:2241` |
| Tiempos: sincronización 1 200 ms y 300 ms; búsqueda 220 ms; aviso 2 800 ms | `index.html:2182`, `2272`, `6920`, `1849` |
| Códigos de crew: 5 caracteres de `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | `index.html:8058-8059` |
| Datos de prueba con semilla fija `20261007` | `index.html:7739` |
| Colores escritos dentro del JavaScript y del SVG (`#3c3c3c`, `#737373`, `#ff4f2b`, `#5fd08a`, `#1a1a1a`, `#5A5A5E`) | p. ej. `index.html:4728-4741`, `5036`, `6366`, `6607`, `6961` |
| Colores de una paleta anterior: `rgba(52,199,89,.35)` y `rgba(255,159,10,.35)` en las etiquetas del modelo; `rgba(191,90,242,0.08)` y `rgba(52,199,89,0.1)` en el feed | `index.html:5038`, `1487`, `1514` |
| Idioma declarado «en» en el HTML y en el manifiesto | `index.html:2`, `HTML/manifest.json:13` |

### 8.4 Textos y comentarios que no coinciden con el código

| Texto | Dónde | Lo que hace el código |
|---|---|---|
| «Routines/docs stay device-shared» | `index.html:1900-1901` | Las rutinas se guardan por cuenta (`aKey(RKEY)`, `index.html:2076`, `2080`); los documentos sí son del dispositivo |
| Vistas `'routines' \| 'workouts' \| 'workout' \| 'journal'` | `index.html:2343` | No existe la vista `journal`; hay 13 vistas (`index.html:2360-2366`) |
| «{decrease, maintain, increase}» | `index.html:4362-4363` | 5 clases (`RF_NCLASS = 5`, `index.html:4367`) |
| «{app,type:'coachReport',schemaVersion:1,…}» | `index.html:7372` | `COACH_REPORT_SCHEMA = 2` (`index.html:7376`) |
| `measurementsCm:{waist,chest,arm,thigh}` | `index.html:5178-5179` | 6 medidas, también `hips` y `neck` (`index.html:5187`) |
| Bloque «FIREBASE CLOUD LAYER» | `index.html:7960-7964` | Está encima del script de animaciones (`index.html:7965`), no del módulo de Firebase (`index.html:8033`) |
| «The API key below ships in client code…» | `index.html:2413` | La clave está vacía (`index.html:2418`). El commit `0169d4a` dice «use environment variable instead», pero no hay forma de leer variables de entorno |
| «Only real data — no invented numbers» | `index.html:1635` | La recomendación usa sesiones reales de 7 días (`index.html:4958-4970`); el modelo se entrena con sesiones simuladas (`index.html:4570-4607`) |
| Insignia «🌲 40 trees · N% acc» | `index.html:4617-4618` | El porcentaje es el acierto sobre los mismos datos de entrenamiento (`index.html:4615-4616`) |
| «Model Confidence 91% · prediction accuracy» | `index.html:1580` | Número fijo; no se calcula |
| «Después se cargan las rutinas de ejemplo» (borrar «Mis rutinas») | `index.html:7604` | El borrado deja `routines = []` (`index.html:7596`); las de ejemplo se crean cuando `loadRoutines` encuentra la lista vacía con sesión (`index.html:2078`), lo que pasa al volver a iniciar sesión (`index.html:2298`, `2328`). Comportamiento en ejecución: **no verificado** |
| «This is a full backup — export individual routines…» | `index.html:3305` | Responde a `type: "backup"`, formato de la función `exportBackup`, que ya no existe (`CHANGELOG.md:7`, `DATA_GUIDE.md:773`). El respaldo actual (`dataBackup`) cae en «Unrecognized file format» |
| «fully offline» | `HTML/manifest.json:4` | Rutinas, journal y perfil piden sesión e internet («Necesitas internet para acceder a tus rutinas», `index.html:2354`) |
| «SIN CONECTAR · toca para entrar» | `index.html:1420` | Lleva a Leaderboards (`index.html:1416`), que a su vez manda al Perfil para entrar (`index.html:7120-7125`) |
| `ROUTINE_TEMPLATE.json` «→ ⤒ Import Routine → Paste» | `ROUTINE_TEMPLATE.json:3` | No hay campo para pegar; solo selector de archivo (`index.html:1736`) |
| «View, edit, duplicate, or delete routines» | `ROUTINE_TEMPLATE.json:357` | No existe función para duplicar rutinas |
| «'Start Session'» | `ROUTINE_TEMPLATE.json:363` | El botón dice «▶ Start Workout» (`index.html:2771`, `2776`) |
| «radar_chart: 7-day volume per muscle» | `ROUTINE_TEMPLATE.json:381` | El radar dibuja el nivel de rango por músculo (`index.html:6350-6384`) |
| «muscle_keys» con 17 claves (incluye `abs`, `obliques`, `forearms`, `back`…) | `ROUTINE_TEMPLATE.json:385-390` | La app acepta 10 (`index.html:6165-6176`) y mapea o descarta el resto (`index.html:3267-3275`) |
| «auto_tagging: … muscles auto-populate» | `ROUTINE_TEMPLATE.json:398` | `SEED_MUSCLES` solo se usa al crear las rutinas de ejemplo (`index.html:2068`), no al importar |
| «Eliminar un programa es una lápida (`deletedAt`)» | `DATA_GUIDE.md:84` | No hay botón ni función para eliminar un programa; solo cerrarlo |

### 8.5 Funciones a medio terminar o con comportamiento parcial

- **Home Feed**: todo es fijo. «Like», «Carrilla» y «Clone Routine» solo cambian la página; no guardan ni clonan nada (`index.html:6397-6416`).
- **Notificaciones de actividad**: la sección «Actividad» y el tipo `pr` existen en la vista (`index.html:6556-6564`), pero ningún código crea notificaciones `pr` y la suscripción no se activa (F78).
- **Contador de mensajes** `#mail-badge`: nunca se muestra (8.1).
- **Generador con Gemini**: la clave está vacía, así que la petición sale a `…generateContent?key=` (`index.html:2419`). La respuesta real de la API: **no verificado** (no se llamó).
- **Documentos**: sin sufijo de cuenta (cualquier cuenta del mismo dispositivo los ve), no se suben a la nube y no entran en el respaldo (`index.html:3215-3218`, `7584-7597`).
- **Respaldo**: se genera pero la app no lo puede importar (prueba en 5.3; también `DATA_GUIDE.md:735`).
- **Solo en el dispositivo**: correcciones y bloqueos del modelo y el enfoque de rangos (`index.html:4466`, `4476`, `6319`).
- **Sesiones**: no hay forma de borrar o editar una sesión suelta; solo borrar todas desde Datos (`index.html:3951`, `7585`).
- **Programas**: no se pueden eliminar, solo cerrar (8.4).
- **Registro corporal**: se borra de verdad (filtra la lista, `index.html:5402`); las listas de objetivos y notas usan `deletedAt` (`index.html:6041`).
- **Reproductor**: las series registradas viven en memoria hasta «📓 Save to War Journal»; salir o recargar las pierde (`index.html:4068`, `4306-4317`).
- **Clonar un workout recibido por chat**: pierde tipo, tempo, nota y dropsets, y no filtra claves de músculo (`index.html:6820-6826`).
- **Chats**: muestran los 100 mensajes más antiguos (`index.html:8178`, `8188`).
- **Enlace por nombre**: journal, metas por ejercicio, modelo e informe enlazan rutina, workout y ejercicio por **nombre**, no por id (`index.html:3909-3918`, `4656`, `4665`, `4964`, `7383`, `7524-7526`). `DATA_GUIDE.md:728` lo anota para los ejercicios saltados.
- **Cierre al tocar el fondo**: no aplica a `gn-modal`, `pg-modal` ni `photo-editor` (`index.html:7942`).
- **Cierre de sesión**: borra solo parte de los datos locales de la cuenta (7.1).
- **Rutinas de ejemplo**: `seedRoutines` escribe en `gymAI_routines_v2` sin sufijo de cuenta (`index.html:2070`); esa clave no se lee en ningún lugar.
- **Arranque frágil**: `aKey` usa `try/catch` porque se llama antes de que exista `cloudState` (comentario `index.html:1903-1907`).
- **Sin Firebase no hay salida**: el evento `cloud-ready` se lanza dentro del módulo de Firebase (`index.html:8215`). Si el módulo no carga, Leaderboards, Routine Manager y Athlete Profile se quedan en «Conectando…» (observado en la prueba local; ver 8.6). La pantalla «Nube no disponible» (`index.html:7119`) solo aparece si el módulo carga pero `initializeApp` falla.

### 8.6 Errores y advertencias visibles

**Prueba local** (Chromium sin interfaz, `http://127.0.0.1`, sin sesión, con `www.gstatic.com` bloqueado por la red del entorno):
- Consola: 3 × `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED` (los 3 archivos de Firebase) y `[GymAI] Service worker registered · scope: http://127.0.0.1:8765/`.
- Pantallas: Leaderboards, Routine Manager y Athlete Profile mostraron «🛰️ Conectando…» indefinidamente; Home Feed y AI Progressions se vieron completos. El modelo mostró «🌲 40 trees · 99.2% acc».
- Con la CDN accesible estos errores no tendrían por qué aparecer; en producción: **no verificado**.

**Mensajes de consola en el código**:
- `console.warn`: `index.html:2187`, `2197`, `4654`, `5234`, `5870`, `5988`, `7692`, `8135`, `8161`, `8174`, `8180`, `8190`, `8196`.
- `console.error`: `index.html:7955`, `8056`; en `HTML/service-worker.js:32`.
- `console.log`: `index.html:7954`.

**Mensajes de error para el usuario**:
- `cloudErr` (`index.html:6426-6436`): «No existe un crew con ese código», «Ese correo ya tiene cuenta — inicia sesión», «Correo inválido», «La contraseña debe tener 6+ caracteres», «Correo o contraseña incorrectos», «Sin conexión a la nube», «Permiso denegado (revisa las reglas de Firestore)», o «Error: [código]».
- Gemini (`index.html:2665-2681`): «No se pudo conectar con la API (revisa tu conexión).», «La API respondió [código]. …», «La IA no devolvió contenido.», «La respuesta de la IA no es JSON válido.», «La rutina generada no contiene días.».
- Registro corporal sin subir: «Registro corporal guardado en este dispositivo · pendiente de sincronizar» (`index.html:5234`).
- Perfil del coach: «No se pudo cargar (se guarda solo en la nube).» (`index.html:5878`); «No se pudo guardar en la nube — revisa tu conexión» (`index.html:5989`).
- Datos de prueba: «Sin conexión: no se pudo quitar todo, intenta de nuevo» (`index.html:7845`).

**Variables CSS que no existen** (el navegador las trata como no válidas):
- `var(--muted)` en `.player-skip` y `.pce-sub` (`index.html:446`, `452`).
- `var(--accent)` en el fondo de `.pce-cancel` («Seguir entrenando», `index.html:454`).

**Peso de fuente que no se carga**: se pide `font-weight: 700` (`index.html:1524`, `1685`, `6372`), pero Inter se carga solo con 300, 400, 500 y 600 (`index.html:26`). Cómo dibuja cada navegador ese 700 (negrita simulada o el peso más cercano): **no verificado**.

### 8.7 Mezcla de idiomas

La interfaz combina inglés y español:
- **Inglés**: asistente de perfil («What's your name?», «Biological sex», «Looking good!», «✓ Save profile», `index.html:5565-5608`); registro de PR («Pick your focus…», «Estimated 1RM», «PR history», `index.html:6274-6294`); Routine Manager («Routine Library», «New Routine», «Start Workout», `index.html:2396-2408`, `2771`); reproductor («Battle Complete», `index.html:4272`); «NO DATA» del modelo (`index.html:5095-5096`); avisos como «Routine created», «Import failed — invalid file».
- **Español**: Programas, Datos, Perfil del coach, registro corporal, objetivos, social y la mayoría de los avisos.
- **Mezclado en la misma pantalla**: «⏭ Skip ejercicio» (`index.html:4140`), «Up to 4 muscle groups per exercise» junto a «Principal» / «2.º plano» (`index.html:2983`, `2997-2998`).

---

## 9. Estilos

Todo el CSS está en un solo bloque `<style>` (`index.html:27-1394`), en tres capas:
1. Estilos de componentes (`index.html:63-1192`).
2. «VOID DESIGN LAYER», que pisa a los anteriores, muchas veces con `!important` (`index.html:1194-1344`).
3. Animaciones (`index.html:1346-1393`).

Además hay 215 atributos `style="…"` dentro del HTML y de las plantillas del JavaScript (conteo con `grep`).

### 9.1 Variables (tokens) — `:root`, `index.html:29-62`

| Token | Valor | Nota en el código |
|---|---|---|
| `--bg` | `#000000` | «void black» |
| `--card` | `#000000` | superficies sobre el fondo |
| `--card2` | `#1a1a1a` | «carbon»: pozos, campos, filas anidadas |
| `--card3` | `#262626` | — |
| `--border`, `--border2` | `#3c3c3c` | «graphite hairline» |
| `--blue` | `#ff4f2b` | «ember orange — the one action color (legacy token name)» |
| `--blue-dim` / `--blue-mid` | `rgba(255,79,43,0.12)` / `0.4` | — |
| `--ember` | `#ff4f2b` | — |
| `--green` | `#5fd08a` | «data only: target met / on track» |
| `--red`, `--orange`, `--pink` | `#ff4f2b` | los tres valen lo mismo que `--ember` |
| `--yellow` | `#f5f5f5` | — |
| `--sky`, `--violet`, `--violet-ink`, `--olive` | `#bfbfbf` | — |
| `--slate`, `--gray` | `#737373` | «steel: metadata, timestamps» |
| `--gray2` | `#5a5a5a` | — |
| `--white` | `#f5f5f5` | «bone white» |
| `--white80` / `--white60` | `#bfbfbf` / `#8c8c8c` | — |
| `--white40` / `--white10` / `--white5` | `rgba(245,245,245,0.4 / 0.1 / 0.05)` | — |
| `--sidebar` / `--header` | `260px` / `70px` (60 px en móvil, `index.html:996`) | — |
| `--font`, `--display` | `'Inter', system-ui, …` | — |
| `--mono` | `'Chivo Mono', ui-monospace, …` | — |
| `--fw-body`, `--fw-mid`, `--fw-label`, `--fw-display` | `400` | — |
| `--fw-strong` | `500` | — |
| `--r-card`, `--r-row`, `--r-btn`, `--r-tag`, `--r-input` | `0px` | — |
| `--shadow-card`, `--shadow-glow`, `--shadow-press` | `none` | — |
| `--ease-out` / `--ease-spring` / `--ease-io` | `cubic-bezier(.16,1,.3,1)` / `(.34,1.56,.64,1)` / `(.65,0,.35,1)` | — |
| `--rc1`, `--rc2` | se definen en línea con el color del nivel (`index.html:6295`) | — |

### 9.2 Colores

- **Paleta base** (comentario `index.html:30-31`, «Binary palette: black void, bone white, one ember orange that means "action"»):
  - negro `#000`; carbón `#1a1a1a` / `#262626`; grafito `#3c3c3c`;
  - hueso `#f5f5f5`; grises `#bfbfbf`, `#8c8c8c`, `#737373`, `#5a5a5a`;
  - naranja de acción `#ff4f2b`; verde de datos `#5fd08a`.
- **Fuera de la paleta**:
  - niveles de rango Bronce `#CD7F32`/`#8C5A2B`, Plata `#C7CCD4`/`#8A9099`, Oro `#F7C948`/`#C79100`, Platino `#5AD1C5`/`#2B9E94`, Diamante `#9BE4FF`/`#3FA9F5` (`index.html:6155-6161`);
  - puestos 1–3 del ranking `#F7C948`, `#C7CCD4`, `#CD7F32` (`index.html:806`) y `#FFD700`, `#C0C0C0`, `#CD7F32` en las clases sin uso (`index.html:228`);
  - botón de Google blanco con texto `#1f1f1f` y logo de 4 colores (`index.html:779`, `5456`);
  - medidor de IMC y grasa con degradado verde → hueso → naranja (`index.html:645`).
- **Uso del naranja** (`index.html:1276-1279`, `1300-1301`): botón principal, estado seleccionado, pestaña activa, foco de campo, cuadrado de las etiquetas de sección (`index.html:1236`), franja final del reproductor (`index.html:1340-1344`) y selección de texto (`index.html:1206`).

### 9.3 Tipografía

- **Familias**:
  - Inter para texto y números grandes (`--font`, `--display`).
  - Chivo Mono para etiquetas, botones, chips y lecturas (`--mono`).
  - Ambas desde Google Fonts (`index.html:26`).
- **Pesos**:
  - Cargados: Inter 300/400/500/600; Chivo Mono 400/500.
  - La capa Void fija 300 para títulos y números grandes (`index.html:1231`, `1237-1239`), 400 para el resto y 500 para `b`/`strong` (`index.html:1205`).
  - Pesos escritos a mano: 300 (5×), 400 (18×), 500 (4×), 600 (6×) y 700 (2× en CSS: `index.html:1524`, `1685`; más el atributo SVG `font-weight="700"` en `index.html:6372`).
- **Estilo de etiqueta repetido**: monoespaciada, mayúsculas y `letter-spacing` 0,02–0,06 em. Lo usan la navegación (`index.html:1215`), el título de la barra (`index.html:1222`), las etiquetas de sección (`index.html:1235`), los botones (`index.html:1276-1286`), los chips (`index.html:1317-1319`) y el aviso (`index.html:1273`).
- **Tamaños principales**:

| Elemento | Tamaño | Línea |
|---|---|---|
| Temporizador de descanso | 96 px (64 px en móvil) | `index.html:1240`, `1007` |
| Número grande del asistente | 48 px | `index.html:592`, `789` |
| Título de vista `.rm-title` | 40 px (32 px a ≤ 560 px) | `index.html:1231`, `1242` |
| Nombre en la tarjeta de perfil | 36 px (30 px a ≤ 560 px) | `index.html:1237`, `1242` |
| Números de tarjetas (`.stat-val`, `.finish-stat-val`) | 22 px | `index.html:504`, `444` |
| Texto de cuerpo | 13–15 px | p. ej. `index.html:100`, `1232` |
| Etiquetas y chips | 11–12,5 px | `index.html:1215`, `1235`, `1319` |
| Metadatos pequeños | 9–10 px | p. ej. `index.html:212`, `1227` |

Frecuencia de `font-size` en el archivo (las más usadas): 12 px (70), 13 px (65), 11 px (65), 10 px (39), 14 px (31), 15 px (25), 16 px (22), 9 px (16), 18 px (15), 22 px (12), 20 px (12), 12,5 px (12).

### 9.4 Forma, sombras y fondos

- La capa Void quita esquinas redondeadas, sombras y sombras de texto a todo (`*{border-radius:0!important; box-shadow:none!important; text-shadow:none!important}`, `index.html:1199`). Solo deja redondos avatares e indicadores (`index.html:1201-1202`).
- Quita el desenfoque de fondo de barras y ventanas (`index.html:1208`) y los degradados de los rellenos (`index.html:1325-1337`).
- Los estilos anteriores a esa capa siguen escritos con radios (p. ej. `.card` 16 px, `index.html:184`), sombras y degradados, pero quedan pisados.
- Superficies: negras con borde de 1 px grafito (`index.html:1245-1247`); pozos y filas en `#1a1a1a` (`index.html:1248`).

### 9.5 Distribución y puntos de corte

- Escritorio: barra lateral de 260 px + contenido con relleno de 28 px (`index.html:71-82`, `178`).
- Puntos de corte:
  - ≤ 1100 px: estadísticas en 2 columnas (`index.html:975-977`).
  - ≤ 900 px (`index.html:978-990`).
  - ≤ 768 px: barra lateral oculta, barra inferior visible, cabecera de 60 px (`index.html:887-891`, `991-1011`).
  - ≤ 560 px (`index.html:1012-1026`, `1242`, `1337`, `1344`).
  - ≤ 480 px: rejilla de emojis (`index.html:1192`).
  - ≥ 720 px: panel de chat flotante (`index.html:906`).
- Efecto al pasar el ratón solo con puntero fino (`@media (hover:hover) and (pointer:fine)`, `index.html:1376-1389`).
- `prefers-reduced-motion` anula animaciones (`index.html:1391-1393`) y el JavaScript también lo respeta (`index.html:7973-7974`).
- Zonas seguras de iPhone con `env(safe-area-inset-bottom)` (`index.html:132`, `578`, `959`, `994`, `1024`).

### 9.6 Movimiento

- Animaciones definidas:
  - de componentes: `fadeIn`, `pulse-dot`, `pfFloat`, `pwSlide`, `aiSpin` (`index.html:123`, `181`, `569`, `586`, `752`);
  - de la capa de movimiento: `fxRise`, `fxFade`, `fxVeil`, `fxSheet`, `fxPop`, `fxWipe`, `fxTick` y `fxBar` (esta última sin uso) (`index.html:1351-1358`).
- Entrada escalonada de elementos (`fxEnter`, 45 ms entre cada uno, máx. 16), números que cuentan hasta su valor (`countUp`, 900 ms), ventanas que suben al abrirse (`MutationObserver`) y vibraciones cortas (`fxHaptic`) — `index.html:7972-8031`.
- Respuesta al pulsar: escala 0,955 (`index.html:1370-1372`).

### 9.7 Componentes repetidos

| Componente | Clases | Dónde se define / ejemplos |
|---|---|---|
| Ventana tipo hoja | `.pw-card` + `.pw-top` + `.pw-step-count` + `.pw-close` + `.pw-body` + `.pw-nav` | `index.html:578-617`; se usa en 17 plantillas (asistente, coach, cuerpo, objetivos, programas, músculos, PR, amigos, crew, notificaciones, enviar, vista previa…) |
| Ventana genérica | `.modal-overlay` + `.gm-modal` | `index.html:899-900`, `1029-1053`; 16 contenedores `.modal-overlay` en el HTML (`index.html:1682-1783`) |
| Botón de acción | `.rm-btn` y variantes `ghost`, `green`, `danger`, `big`, `ai-coach-btn` (45 usos) | `index.html:254-262`, `1276-1290` |
| Otros botones | `.pw-btn`, `.gm-save` / `.gm-cancel`, `.crew-btn`, `.crew-link`, `.pf-social-btn`, `.fr-add` / `.fr-rej`, `.icon-btn`, `.action-btn`, `.rf-*` | `index.html:610-613`, `1051-1052`, `774-777`, `792-793`, `846-850`, `866-868`, `168-175`, `216-220` |
| Tarjetas | `.rm-card`, `.jr-card`, `.rf-rcard`, `.rf-rec`, `.crew-card`, `.cv-gauge`, `.stat-card`, `.bio-card`, `.post-card` | `index.html:266`, `462`, `1069`, `1138`, `766`, `641`, `502`, `510`, `198`; unificadas en `index.html:1245-1248` |
| Filas de lista | `.bl-row`, `.fr-row`, `.cw-row`, `.mr-row`, `.nf-row`, `.ig-chat-row` | `index.html:521`, `859`, `801`, `698`, `965`, `918` |
| Control segmentado | `.cp-seg`, `.pw-seg`, `.lb-toggle`, `.crew-tabs`, `.me-seg`, `.rx-lvl-pick` | `index.html:535-538`, `599-605`, `841-843`, `768-770`, `728-732`, `1041-1048`; unificado en `index.html:1296-1303` |
| Chips y etiquetas | `.bl-chip`, `.rm-tag`, `.cv-chip`, `.rx-badge`, `.rx-type`, `.rec-pill`, `.rf-goalchip`, `.ex-musc-chip`, `.rf-feat`, `.pr-badge` | unificados en `index.html:1317-1323` |
| Campos | `.crew-input` (lo usan casi todos los formularios), `.gm-input`, `.set-input`, `.pw-input`, `.ex-name-input`, `.rf-select`, `.ai-textarea` | unificados en `index.html:1309-1314` |
| Estados vacíos y de espera | `.rm-empty`, `.crew-hero`, `.rf-empty`, `.fr-empty`, `.ig-empty`, `.rf-chart-empty` | `index.html:389-390`, `762-765`, `1177`, `858`, `933`, `1092` |
| Etiqueta de sección | `.section-label` con cuadrado naranja | `index.html:185`, `1235-1236` |
| Aviso | `#toast` | `index.html:894-896`, `1273` |
| Interruptores | `.ios-toggle`, `.toggle-mini` (definidos, sin uso) | `index.html:544-547`, `1188-1191`, `1304-1306` |

---

## Tabla de decisión por función

Una fila por función de la sección 3. Las tres últimas columnas están vacías a propósito.

| ID | Función | Conservar | Mejorar | Desechar |
|---|---|:---:|:---:|:---:|
| F01 | Crear cuenta con correo | | | |
| F02 | Iniciar sesión con correo | | | |
| F03 | Iniciar sesión con Google | | | |
| F04 | Cerrar sesión | | | |
| F05 | Carga de la cuenta al iniciar sesión | | | |
| F06 | Cambiar de pestaña | | | |
| F07 | Like (feed) | | | |
| F08 | Comentarios «Carrilla» (feed) | | | |
| F09 | Clonar rutina del feed | | | |
| F10 | Crear rutina | | | |
| F11 | Editar nombre, icono y complejidad de rutina | | | |
| F12 | Borrar rutina | | | |
| F13 | Abrir rutina / workout | | | |
| F14 | Crear workout | | | |
| F15 | Renombrar / borrar workout | | | |
| F16 | Reordenar arrastrando | | | |
| F17 | Modo edición | | | |
| F18 | Ejercicios (agregar, quitar, editar) | | | |
| F19 | Series (agregar, quitar, editar) | | | |
| F20 | Dropsets | | | |
| F21 | Etiquetar músculos | | | |
| F22 | Exportar rutina | | | |
| F23 | Importar archivo (rutina o programa) | | | |
| F24 | Enviar rutina o workout a un amigo | | | |
| F25 | Generar rutina con Gemini («AI Coach») | | | |
| F26 | Guardar rutina generada | | | |
| F27 | Recargar base científica | | | |
| F28 | Documentos (crear, editar, borrar) | | | |
| F29 | Exportar documento .txt | | | |
| F30 | Crear o editar programa | | | |
| F31 | Activar programa | | | |
| F32 | Registrar ajuste de programa | | | |
| F33 | Checkpoints de programa | | | |
| F34 | Cerrar programa | | | |
| F35 | Importar programa | | | |
| F36 | Informe del programa | | | |
| F37 | Iniciar workout | | | |
| F38 | Registrar serie | | | |
| F39 | Ver el peso en la otra unidad | | | |
| F40 | Descanso (+30 s, saltar, alarma) | | | |
| F41 | Saltar ejercicio | | | |
| F42 | Maximizar / salir del reproductor | | | |
| F43 | Guardar sesión en el War Journal | | | |
| F44 | Navegar el War Journal | | | |
| F45 | Exportar sesión para el coach | | | |
| F46 | Explorar progreso (AI Progressions) | | | |
| F47 | Meta por ejercicio | | | |
| F48 | Aplicar recomendación del modelo | | | |
| F49 | Corregir o confirmar el modelo | | | |
| F50 | Reactivar ayuda del modelo | | | |
| F51 | Reiniciar el modelo | | | |
| F52 | Registro corporal | | | |
| F53 | Asistente de perfil | | | |
| F54 | Foto de perfil | | | |
| F55 | Perfil del coach | | | |
| F56 | Objetivos con fecha | | | |
| F57 | Lesiones y notas | | | |
| F58 | Registrar PR por músculo | | | |
| F59 | Ver rangos por músculo y radar | | | |
| F60 | Buscar amigos y enviar solicitud | | | |
| F61 | Aceptar, rechazar o eliminar amigo | | | |
| F62 | Ficha de atleta | | | |
| F63 | Crew: crear, unirse, salir, copiar código | | | |
| F64 | Invitaciones a crew | | | |
| F65 | Sincronizar mis stats | | | |
| F66 | Notificaciones | | | |
| F67 | Chats (directo y de crew) | | | |
| F68 | Enviar rutina o entreno al chat | | | |
| F69 | Ver y clonar rutina o entreno recibido | | | |
| F70 | Informe para el coach | | | |
| F71 | Super Journal | | | |
| F72 | Respaldo (completo o por categoría) | | | |
| F73 | Borrar datos por categoría | | | |
| F74 | Datos de prueba | | | |
| F75 | Modo inspección | | | |
| F76 | Sincronización automática de listas | | | |
| F77 | Versionado automático de perfil y rutinas | | | |
| F78 | Notificaciones de actividad (sin conectar) | | | |
| F79 | Ayudante de consola de la base científica | | | |
| F80 | App instalable y sin conexión (PWA) | | | |
| F81 | Migración de claves locales | | | |
