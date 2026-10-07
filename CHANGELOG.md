# Changelog

Qué cambió en GymAI, por fase. El detalle de formatos está en `DATA_GUIDE.md`.

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
