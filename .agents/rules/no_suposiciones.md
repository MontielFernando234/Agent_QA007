---
trigger: always_on
description: "Regla de Oro de Cero Suposiciones en todas las fases del orquestador QA (Importación ADO/Figma, Análisis Estático, Diseño de Casos y Exportación)."
---

# Regla: Cero Suposiciones (`RULE[no_suposiciones.md]`)

## 1. Principio Fundamental
Ningún agente del ecosistema QA puede **asumir, inventar o completar silenciosamente** reglas de negocio, comportamientos UI, contratos de API, parámetros de nomenclatura o acciones de sobrescritura/exportación no confirmadas por el usuario.

---

## 2. Reglas por Fase

1. **Importación ADO (`qa_ado_importer`):**
   - Si una HU ya existe en `input/index.json`, **jamás sobrescribirla automáticamente**. Comparar `active_rev` local vs. `System.Rev` de ADO y preguntar al usuario si actualiza a la nueva revisión (preservando la anterior en `versions/`) o mantiene la versión local.
   - Confirmar siempre `<plataforma>` (`web`|`mobile`) y `<funcionalidad>` antes de persistir.
2. **Importación Figma (`qa_figma_importer`):**
   - Si `input/<plat>/<func>/<ID_HU>/figma/screens/` ya tiene imágenes, **jamás sobrescribirlas sin preguntar** (consultar si sobrescribe, agrega nuevas o conserva).
   - En secciones con múltiples frames, listar las pantallas detectadas y confirmar cuáles descargar.
3. **Análisis Estático (`qa_analytics`):**
   - Ante cualquier laguna o discrepancia entre **Texto HU**, **Adjuntos ADO** y **Figma**, no elegir arbitrariamente cuál prevalece. Formular preguntas explícitas clasificadas por rol:
     - **AFU / UX:** Reglas de negocio, flujos funcionales y diferencias HU vs. Figma.
     - **TL:** Contratos API, lógica BFF, códigos HTTP, timeouts e integraciones.
     - **PO:** Alcance funcional, priorización, feature flags y criterios faltantes.
4. **Diseño de Casos (`qa_designer`):**
   - Consultar/confirmar siempre con el usuario: **1) Release** (`[R<N>]`), **2) Código de Área** (proponer `CSM_SIF` por defecto, pero confirmar siempre), **3) Capas** (`FE`, `BFF`, `API`) y **4) Distribución por SO y Dispositivos** (`Android`/`iOS`, `Smartphone`/`Tablet`/`iPad`/`Desktop`).
   - Registrar dudas pendientes en `output/testCases/<func>/<ID_HU>/dudas_pendientes_diseno.md`.
5. **Exportación ADO (`qa_ado_exporter`):**
   - **Jamás crear Work Items en ADO vía API/MCP automáticamente.** Por defecto solo generar el CSV local de 18 columnas. La creación por API/MCP requiere solicitud explícita y aprobación del Checkpoint de resumen.
