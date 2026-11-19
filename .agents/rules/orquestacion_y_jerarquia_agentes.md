---
trigger: always_on
description: "Regla de orquestación, jerarquía de 5 niveles, handoffs por puntero de archivo, Smart Scaling y coordinación de memoria del QA Lead Sr (qa_orchestrator)."
---

# Regla: Orquestación, Niveles y Relaciones entre Agentes (`RULE[orquestacion_y_jerarquia_agentes.md]`)

## 1. Jerarquía de 5 Niveles del Equipo QA

1. **Nivel 1 — QA Lead Sr (`qa_orchestrator`):** Interlocutor único con el usuario. Audita `input/index.json` y `memories/`, diseña y valida el **Plan Estratégico (Checkpoint 0)**, dimensiona instancias de agentes, consolida Checkpoints y gobierna `memories/qa_orchestrator/memoria_qa_orchestrator.md`.
2. **Nivel 2A — Ingesta ADO (`qa_ado_importer`):** Extrae Features/HUs desde ADO MCP, limpia HTML a Markdown, controla revisiones (`System.Rev`), descarga adjuntos e indexa en `input/index.json`.
3. **Nivel 2B — Ingesta Figma (`qa_figma_importer`):** Inspecciona frames (`get_metadata`), descarga capturas PNG (`get_screenshot`), extrae textos UI/Post-its UX en `figma_context_<ID_HU>.md` e indexa.
4. **Nivel 3 — Analista QA Sr (`qa_analytics`):** Analiza insumos locales de Nivel 2, triangula 3 fuentes (Texto HU vs. Adjuntos ADO vs. Figma), define alcance por capa (`FE`/`BFF`/`API`) y SO/Dispositivos, y genera `output/analysis/<func>/<ID_HU>/analisis_<ID_HU>.md`.
5. **Nivel 4 — Diseñador QA Sr (`qa_designer`):** A partir del análisis aprobado en Nivel 3 y parámetros globales, diseña las 11 categorías ISTQB en `output/testCases/<func>/<ID_HU>/casos_prueba_<ID_HU>.csv` (12 col) y `_clasificados.md`.
6. **Nivel 5 — Exportador ADO (`qa_ado_exporter`):** Transforma el CSV aprobado en Nivel 4 a `casos_prueba_<ID_HU>_ado_import.csv` (18 col multi-paso) y, solo a demanda explícita, serializa pasos a XML (`Microsoft.VSTS.TCM.Steps`) y exporta a ADO vía API/MCP.

---

## 2. Reglas de Dependencia (*Stage Gating*) y Handoffs

1. **Prohibido saltar de nivel:** Nivel 3 exige insumos persistidos en `input/index.json` (Nivel 2); Nivel 4 exige `analisis_<ID_HU>.md` aprobado (Nivel 3); Nivel 5 exige `casos_prueba_<ID_HU>.csv` aprobado (Nivel 4).
2. **Handoff por Puntero de Archivo (*File-Pointer Return*):**
   - El Orquestador pasa a los subagentes únicamente las **rutas locales** y acuerdos globales (jamás HTML/JSON crudos).
   - Todo subagente escribe su entregable en disco (`output/...`) y devuelve al Orquestador **solo un JSON compacto** con la ruta del archivo, conteos y preguntas/discrepancias pendientes.

---

## 3. Dimensionamiento Inteligente (*Smart Scaling*) y Ahorro de Tokens

1. **1 a 2 HUs:** Ejecución directa/lineal en la sesión actual (sin instanciar subagentes extra ni `run_workflow` para evitar duplicar el costo del System Prompt).
2. **3 o más HUs:** El Orquestador propone en el Checkpoint 0 elegir entre **Modo Paralelo** (`run_workflow` / subagentes aislados con *File-Pointer Return*) o **Modo Secuencial** (1 por 1).
3. **Cambio de Versión (`rev` Diff):** Si una HU ya trabajada cambia en ADO de `rev N` a `rev M`, ejecutar `diff_hu_versions.js` y procesar en Nivel 3 y 4 **únicamente el delta modificado**.
4. **Sincronización de Memorias:** Al cerrar cada fase, actualizar tanto `memories/<skill>/memoria_<skill>.md` como `memories/qa_orchestrator/memoria_qa_orchestrator.md`.
