# Catálogo Oficial de Workflows y Procesos Operativos de QA (`qa_orchestrator`)

> **Documento de Referencia (*Progressive Disclosure*):** Este manual define los **6 Procesos / Workflows Estándar** que el **QA Lead Sr (`qa_orchestrator`)** puede planificar y ejecutar según la necesidad del usuario, optimizando el uso de tokens mediante *Smart Scaling* (1-2 HUs directo vs. 3+ HUs paralelo con `run_workflow`) y *File-Pointer Return*.

---

## Mapa General de los 6 Workflows del Proyecto

| Código | Nombre del Workflow | Nivel(es) Involucrados | Cuándo Activarlo |
| :---: | :--- | :---: | :--- |
| **WF-01** | **Ingesta y Sincronización de Requerimientos (ADO + Figma)** | Nivel 1 + Nivel 2 (`qa_ado_importer`, `qa_figma_importer`) | Cuando el usuario entrega una Feature, una o varias HUs y/o un enlace de Figma para descargarlos, versionarlos e indexarlos localmente en `input/`. |
| **WF-02** | **Refinamiento y Análisis Estático ISTQB (Individual o Lote)** | Nivel 1 + Nivel 3 (`qa_analytics`) | En fase de refinamiento para detectar ambigüedades por rol (`AFU/UX`, `TL`, `PO`), triangular Texto HU vs. Adjuntos ADO vs. Figma y definir alcance `FE`/`BFF`/`API` y SO/Dispositivos. |
| **WF-03** | **Diseño Funcional de Casos de Prueba (Desde Análisis Aprobado)** | Nivel 1 + Nivel 4 (`qa_designer`) | Cuando ya existe `analisis_<ID_HU>.md` aprobado y se requiere diseñar la matriz funcional de 11 categorías ISTQB (`casos_prueba_<ID_HU>.csv` de 12 columnas y `_clasificados.md`). |
| **WF-04** | **Formateo y Exportación a Azure DevOps (Manual CSV o API XML)** | Nivel 1 + Nivel 5 (`qa_ado_exporter`) | Cuando el diseño funcional fue aprobado y se requiere el CSV de 18 columnas para importación manual o la creación automatizada en ADO vía API/MCP con pasos en XML. |
| **WF-05** | **Pipeline E2E Completo (De Requerimiento a Casos en ADO)** | Niveles 1 a 5 completos | Cuando el usuario solicita realizar el ciclo completo de QA sobre una o varias HUs, avanzando etapa por etapa con sus respectivos Checkpoints. |
| **WF-06** | **Impacto Incremental por Cambio de Versión (`rev` Diff en ADO/Figma)** | Niveles 1, 2, 3 y 4 (Modo Delta) | **Máximo ahorro de tokens:** Cuando una HU que ya tenía análisis y/o casos diseñados cambia de versión en ADO (`rev N` -> `rev M`) o cambia en Figma, procesando únicamente las diferencias. |

---

## Detalle Operativo de Cada Workflow

### WF-01: Ingesta y Sincronización de Requerimientos (ADO + Figma)
1. **Diagnóstico:** El Orquestador consulta `input/index.json` (`manage_ado_index.js check --id <ID>`).
2. **Checkpoint 0/1:**
   - Si es una **Feature**: lista sus HUs hijas desde ADO, cruza sus revisiones (`System.Rev`) con `input/index.json` y consulta al usuario cuáles importar o actualizar y bajo qué `<plataforma>` (`web`|`mobile`) y `<funcionalidad>`.
   - Si incluye **Figma**: consulta `get_metadata`, verifica con `check-figma` si ya existen capturas en `figma/screens/` y confirma qué frames descargar sin sobrescribir a ciegas.
3. **Ejecución:** Persiste `hu_<ID_HU>.md`, `versions/hu_<ID_HU>_rev<N>.md`, `attachments/`, `figma/screens/*.png` y `figma_context_<ID_HU>.md`, actualizando `input/index.json` e `input/INDEX.md`.

---

### WF-02: Refinamiento y Análisis Estático ISTQB (Individual o Lote)
1. **Input Gate:** Verifica en `input/index.json` que las HUs objetivo estén persistidas localmente. Si no lo están, ejecuta primero **WF-01**.
2. **Estrategia de Ejecución (*Smart Scaling*):**
   - **Si son 1 o 2 HUs:** El Orquestador ejecuta `qa_analytics` directamente en la sesión actual leyendo `hu_<ID_HU>.md`, `attachments/` y `figma/`.
   - **Si son 3 o más HUs y el usuario eligió Modo Paralelo en el Checkpoint 0:** El Orquestador invoca la herramienta `run_workflow` con el script `[batch_analytics_workflow.py](../scripts/batch_analytics_workflow.py)`, pasando la lista de HUs y sus rutas en `Args`. Cada agente escribe su borrador `output/analysis/<funcionalidad>/<ID_HU>/analisis_<ID_HU>.md` y retorna solo un JSON compacto con el conteo de discrepancias y preguntas.
3. **Checkpoint 2 Consolidado:** El Orquestador presenta al usuario la Matriz de Discrepancias (HU vs. Adjuntos ADO vs. Figma) y las preguntas para `AFU/UX`, `TL` y `PO`. Tras iterar las respuestas, cierra los reportes de análisis y actualiza la memoria maestra.

---

### WF-03: Diseño Funcional de Casos de Prueba (Desde Análisis Aprobado)
1. **Input Gate:** Verifica que exista `output/analysis/<funcionalidad>/<ID_HU>/analisis_<ID_HU>.md` aprobado.
2. **Checkpoint 3A (Parámetros Globales de Diseño):** El Orquestador valida con el usuario (si no consta ya en `memoria_qa_orchestrator.md`):
   - **Release (`[R<N>]`)**
   - **Código de Área (por defecto `CSM_SIF`)**
   - **Capas (`FE` Web/Mobile, `BFF` Web/Mobile, `API` agnóstica)**
   - **Distribución por SO (`Android`, `iOS`, `Windows`, `macOS`) y Dispositivos (`Smartphone`, `Tablet`, `iPad`, `Desktop`)**.
3. **Estrategia de Ejecución (*Smart Scaling*):**
   - **Si son 1 o 2 HUs:** Ejecución directa de `qa_designer` con sus Checkpoints de Escenarios (11 categorías), Nomenclatura y Refinamiento Multi-Paso.
   - **Si son 3 o más HUs en Modo Paralelo:** Invoca `run_workflow` con `[batch_designer_workflow.py](../scripts/batch_designer_workflow.py)` inyectando los parámetros globales confirmados. Cada agente genera `casos_prueba_<ID_HU>.csv` (12 columnas RFC 4180) y `casos_prueba_<ID_HU>_clasificados.md`, retornando solo el resumen JSON compacto.
4. **Checkpoint 3B:** Revisión y aprobación de las suites diseñadas por parte del usuario.

---

### WF-04: Formateo y Exportación a Azure DevOps (Manual CSV o API XML)
1. **Input Gate:** Verifica que exista `output/testCases/<funcionalidad>/<ID_HU>/casos_prueba_<ID_HU>.csv` aprobado.
2. **Paso 1 (Por defecto — CSV Manual 18 Columnas):** Ejecuta `convert_to_ado_csv.js` de `qa_ado_exporter` para generar `casos_prueba_<ID_HU>_ado_import.csv`.
3. **Paso 2 (Solo a demanda explícita — Exportación por API/MCP con XML):**
   - Ejecuta `export_to_ado_api.js prepare` para serializar los pasos a XML (`Microsoft.VSTS.TCM.Steps`) y armar el enlace `TestedBy-Reverse`.
   - Presenta el **Checkpoint 4** (cantidad de casos, HU padre, `Area Path`, `Iteration Path`).
   - Con el OK explícito del usuario, ejecuta `export_to_ado_api.js execute`, genera `export_summary_<ID_HU>.md` y registra los IDs de ADO en `input/index.json`.

---

### WF-05: Pipeline E2E Completo
Encadena secuencialmente **WF-01 -> WF-02 -> WF-03 -> WF-04**, respetando cada Checkpoint intermedio y actualizando `memories/qa_orchestrator/memoria_qa_orchestrator.md` al cierre de cada fase para que el proceso pueda pausarse y retomarse en cualquier momento sin perder contexto.

---

### WF-06: Impacto Incremental por Cambio de Versión (`rev` Diff en ADO / Figma) — *Ahorro Máximo de Tokens*
Cuando el usuario informa que una HU ya trabajada fue modificada en Azure DevOps (o cuando `qa_ado_importer` detecta `rev_ado > rev_local` y el usuario autoriza actualizarla):
1. **Sincronización con Preservación:** `qa_ado_importer` descarga la nueva revisión `rev M` guardándola en `versions/hu_<ID_HU>_rev<M>.md` (mientras `versions/hu_<ID_HU>_rev<N>.md` permanece intacta).
2. **Cálculo de Delta sin LLM (`diff_hu_versions.js`):**
   El Orquestador ejecuta:
   ```bash
   node .agents/skills/qa_orchestrator/scripts/diff_hu_versions.js --id <ID_HU> --old-rev <N> --new-rev <M>
   ```
   Este script extrae únicamente las líneas agregadas, eliminadas o modificadas entre ambas revisiones.
3. **Re-análisis y Rediseño Incremental:**
   - En lugar de leer toda la HU desde cero, `qa_analytics` analiza **únicamente el bloque Delta** para actualizar `analisis_<ID_HU>.md`.
   - Luego, `qa_designer` agrega, modifica o depreca **únicamente los casos de prueba afectados por ese cambio** en `casos_prueba_<ID_HU>.csv`.
