---
trigger: always_on
---

# Regla Mandatoria: Proceso Human-in-the-Loop (`RULE[human_in_the_loop.md]`)

## 1. Principio de Control Humano
El orquestador agéntico de QA opera bajo supervisión activa del usuario (**Human-in-the-Loop**). Ningún agente debe ejecutar un flujo completo de principio a fin a ciegas cuando existen puntos de decisión, validación funcional o impacto sobre archivos/sistemas externos.

---

## 2. Protocolo de Puntos de Control (Checkpoints)

1. **Pausa Obligatoria al Cierre de Etapa:**
   - Cada etapa definida dentro de una skill (`ETAPA 1`, `ETAPA 2`, etc.) concluye con un **Punto de Control (Checkpoint)** explícito.
   - El agente debe presentar un resumen estructurado y conciso del resultado de la etapa actual y **detenerse a esperar la confirmación o feedback del usuario** antes de avanzar a la siguiente etapa.

2. **Iteración Abierta:**
   - Si el usuario solicita ajustes, correcciones, agregar escenarios o cambiar criterios en un Checkpoint, el agente debe re-procesar la etapa actual incorporando el feedback y volver a presentar el Checkpoint tantas veces como sea necesario hasta obtener el **OK explícito**.

3. **Decisiones Críticas que Requieren Confirmación Previa:**
   - **Antes de escribir o actualizar en `input/`:** Confirmar qué Historias de Usuario importar de una Feature, si se actualiza o conserva una versión local existente (`rev`), y si se sobrescriben imágenes de Figma.
   - **Durante el Análisis (`qa_analytics`):** Confirmar la recepción y entendimiento de los insumos (Checkpoint 1), iterar sobre la matriz de discrepancias y preguntas por rol (`AFU/UX`, `TL`, `PO`), y aprobar el borrador final del reporte antes de darlo por cerrado (Checkpoint 2).
   - **Durante el Diseño (`qa_designer`):** Confirmar parámetros variables (`Release`, código de `Área` como `CSM_SIF`, alcance `FE`/`BFF`/`API` y estrategia de distribución basada en riesgos RBT: en Mobile `CORE` + `iOS` + `UI_TABLET` sin duplicar funcionales con Smoke/Regresión), aprobar el desglose de escenarios (Checkpoint 1), aprobar títulos/nomenclatura (Checkpoint 2) y aprobar el refinamiento multi-paso (Checkpoint 3).
   - **Antes de Exportar por API/MCP a Azure DevOps (`qa_ado_exporter`):** Confirmar con el usuario dónde y cómo cargar los Test Cases (`planId`, `suiteId` principal, `Area Path`, `Iteration Path`, `Assigned To`) y validar la estructura de suites a crear (por defecto: suite estática `"HU <ID> - <Nombre HU>"`, dentro `FE` —con `CORE`, `iOS`, `UI_TABLET` en Mobile— y/o `BFF` y/o `API` según las capas diseñadas, o cualquier otra estructura solicitada por el usuario) antes de crear las carpetas y los Work Items en ADO.
   - **Durante la Automatización con Playwright (`qa_automation`):** Planificar y confirmar con el usuario los casos a automatizar y la arquitectura/archivos del proyecto que se tocarán (Checkpoint 1); validar el mapeo de locators reales extraídos del HTML/DOM y pedir permiso explícito si algún elemento requiere XPath (Checkpoint 2); y confirmar el resultado de ejecución/mantenimiento de los tests generados (Checkpoint 3).
