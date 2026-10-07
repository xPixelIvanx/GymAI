# Changelog

Qué cambió en GymAI, por fase. El detalle de formatos está en `DATA_GUIDE.md`.

## Fase 4 — Documentación
- `DATA_GUIDE.md` al día: versiones de cada formato (`coachReport` v1 y v2), bloque `program` del informe con su cálculo, informe del programa, ejemplo real de archivo de programa y de informe con programa (generados por la app, no escritos a mano), qué se movió o quitó en el orden (sección 12) y límites nuevos.
- Este changelog.

## Fase 3 — Informe
- **`coachReport` pasa a `schemaVersion: 2`** (58a7f78): todos los campos de v1 igual, más el bloque `program` (`null` si no hay programa activo) con metas y avance, nutrición e historial, checkpoints, últimos ajustes y `planVsActual` (sesiones planeadas vs hechas por semana, cambio de peso y ritmo semanal, avance esperado vs real por meta). Más `window.scope/from/to`.
- **Informe del programa** (d753e05): botón «⤓ Informe del programa» en el detalle de un programa (no en planeados). Mismo formato, limitado a `[startDate, min(endDate, hoy)]`; si ya terminó o se canceló trae `finalSummary`.
- El archivo del informe se escribe compacto (sin sangrías): con 9 semanas de datos pesa ~65–70 KB en vez de ~115–125 KB. No se acortaron campos de v1.
- Ayudas con límite de fecha para calcular un programa ya terminado (0d56c99); sin el parámetro nuevo se comportan igual que antes.
- Verificado: sin programa el informe es igual a v1 salvo las claves nuevas; el resto de exportaciones, importaciones y sincronización quedaron idénticas.

## Fase 2 — Programas
- **`data/programs`** (aec7a3b, f61441a, 8b8cf85): plan con ventana de fechas, se combina por `id` como los demás historiales.
  - Un solo programa activo; activar uno cierra el anterior y lo anota en la bitácora de ambos.
  - Nutrición y ajustes solo se agregan (`nutrition.history`, `adjustments`).
  - Fuente única de objetivos vigentes: el programa activo, o `data/goals` si no hay.
- **Pantalla 🗓 Programas** (Routine Manager): lista con el activo arriba, detalle con metas y progreso, rutinas, nutrición, checkpoints y bitácora; crear, editar, activar, registrar ajuste, agregar y marcar checkpoint, cerrar.
- **Importar programa**: validación estricta antes de tocar nada (versión, fase, fechas, metas, nutrición, checkpoints y cada rutina: RIR 0–10, unidades, músculos válidos), resumen previo y creación de rutinas con ids nuevos sin pisar las existentes.
- Los programas entran en el respaldo completo, en «Todo menos mis rutinas» y en el modo inspección.
- Arreglo: los botones de peligro salían naranja sobre naranja.

## Fase 1 — Orden (sin cambiar comportamiento de exportar/importar)
- `index.html` reorganizado en secciones con encabezado (70c0dfa): núcleo, datos y sincronización, rutinas, programas, journal y sesión, progresiones IA, cuerpo, perfil y coach, social, informes, ajustes y mantenimiento, herramientas, arranque.
- Datos separado en **Exportar y respaldo** (uso normal) y **Herramientas** (borrar, datos de prueba, inspección) (60e927f).
- Una exportación de toda la cuenta vive en un solo sitio, Datos; las de un elemento están en ese elemento. «Clear Journal» ahora abre el borrado con respaldo y `BORRAR` (2628dab).
- Retiradas 4 funciones sin uso (ecae83b). Pendiente de decidir: `calcBenchRank`, `exportBackup`, `guardarConocimientoYoutube`, `cloudSubscribeNotifs`, `notifyFriends`.
- Verificado: los 11 archivos exportados (informe, sesión, Super Journal, respaldos y rutinas) y la importación de rutinas salen byte por byte iguales que antes.

## Antes de las fases
- Historial de solo agregar, versiones del perfil, objetivos y notas, historial de rutinas (a34dc06).
- `coachReport` schemaVersion 1 (76ad3e7) y `journalExport` con Super Journal y selector de periodo (416ae8a, 1006631).
- Pantalla Datos, modo inspección y datos de prueba (cea80e5, d79a546, 8b44878); arreglo del marcador de borrado (49196b9).
- Rediseño visual y animaciones (4f1fcf3).
