---
trigger: always_on
description: "Regla de economía de tokens, consulta prioritaria del índice local (input/index.json) y estructura jerárquica obligatoria de carpetas input/ y output/."
---

# Regla: Economía de Tokens, Indexado y Rutas (`RULE[arquitectura_insumos_tokens.md]`)

## 1. Principio Index-First (Ahorro de Tokens)
1. **Consulta Prioritaria a `input/index.json`:** Antes de invocar cualquier herramienta MCP (`azure-devops` o `figma_figma`) o pedir el texto de una HU al usuario, todo agente **DEBE consultar primero `input/index.json`** (o `input/INDEX.md`).
2. **Reutilización Local:** Si la HU e imágenes de Figma ya están indexadas localmente, `qa_analytics` y `qa_designer` leen directamente `hu_<ID_HU>.md`, `attachments/` y `figma/` **sin llamar a los MCPs**. Solo se invoca a `qa_ado_importer` o `qa_figma_importer` cuando el insumo no existe en el índice o el usuario solicita sincronizar versiones.

---

## 2. Estructura Jerárquica Obligatoria

### 2.1 Insumos (`input/`)
- **Índice Maestro:** `input/index.json` e `input/INDEX.md`
- **Contexto Feature:** `input/<web|mobile>/<funcionalidad>/feature_<ID_FEATURE>.md`
- **HU Activa:** `input/<web|mobile>/<funcionalidad>/<ID_HU>/hu_<ID_HU>.md`
- **Historial Versiones ADO:** `input/<web|mobile>/<funcionalidad>/<ID_HU>/versions/hu_<ID_HU>_rev<N>.md`
- **Adjuntos ADO:** `input/<web|mobile>/<funcionalidad>/<ID_HU>/attachments/`
- **Insumos Figma:** `input/<web|mobile>/<funcionalidad>/<ID_HU>/figma/figma_context_<ID_HU>.md`, `figma_manifest.json` y `screens/*.png`

### 2.2 Entregables (`output/`)
- **Análisis (`qa_analytics`):** `output/analysis/<funcionalidad>/<ID_HU>/analisis_<ID_HU>.md`
- **Diseño Funcional (`qa_designer`):** `output/testCases/<funcionalidad>/<ID_HU>/casos_prueba_<ID_HU>.csv` (12 col), `casos_prueba_<ID_HU>_clasificados.md` y `dudas_pendientes_diseno.md`
- **Exportación ADO (`qa_ado_exporter`):** `output/testCases/<funcionalidad>/<ID_HU>/casos_prueba_<ID_HU>_ado_import.csv` (18 col), `ado_payloads_<ID_HU>.json` y `export_summary_<ID_HU>.md`
