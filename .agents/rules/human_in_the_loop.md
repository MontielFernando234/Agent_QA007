---
trigger: always_on
description: "Regla de control interactivo Human-in-the-Loop con puntos de control obligatorios (Checkpoints) entre etapas de cada skill."
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
   - **Durante el Diseño (`qa_designer`):** Confirmar parámetros variables (`Release`, código de `Área` como `CSM_SIF`, estrategia de distribución por SO/Dispositivos y alcance FE/BFF/API), aprobar el desglose de escenarios en las 11 categorías (Checkpoint 1), aprobar títulos/nomenclatura (Checkpoint 2) y aprobar el refinamiento multi-paso antes de generar los entregables finales (Checkpoint 3).
   - **Antes de Exportar por API a Azure DevOps (`qa_ado_exporter`):** Mostrar el resumen de ejecución (cantidad de Test Cases, ID de HU padre, `Area Path`, `Iteration Path`, `Assigned To`) y esperar autorización explícita antes de crear los Work Items en ADO.
