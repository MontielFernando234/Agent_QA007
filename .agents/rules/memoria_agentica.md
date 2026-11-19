---
trigger: always_on
description: "Regla de gestión de memoria agéntica liviana: separación entre inventario técnico (index.json) y memoria semántica activa, ventana deslizante con archivado y patrón escritor único en paralelo."
---

# Regla: Gestión de Memoria Agéntica (`RULE[memoria_agentica.md]`)

## 1. Principio de Memoria Liviana (Anti-Bloat)
Para evitar el crecimiento descontrolado de tokens a lo largo del tiempo:
1. **Separación Inventario vs. Memoria Semántica:**
   - El **estado técnico e inventario** de HUs (`rev`, pantallas Figma, rutas `input/`/`output/`, IDs de Test Cases en ADO) vive **únicamente en `input/index.json`** (se consulta puntual por ID con `manage_ado_index.js check --id <ID>`). **No duplicar inventarios completos en `memories/`.**
   - Los archivos `memories/*.md` almacenan **solo contexto vivo**: acuerdos globales vigentes (Release, Área, SO/Dispositivos), decisiones de negocio/discrepancias del sprint en curso y bloqueos abiertos.
2. **Ventana Deslizante y Archivado (`memories/archive/`):**
   - Cada archivo de memoria activa debe mantenerse acotado (**máximo ~150 líneas**, reflejando solo los Sprints/Features en curso).
   - Al cerrar un Release o Feature, mover sus decisiones históricas a `memories/archive/<funcionalidad>_<release>.md` (nunca se lee al inicio, solo bajo consulta histórica explícita).
3. **Patrón Escritor Único (*Single-Writer*) en Paralelo:**
   - Cuando se ejecutan subagentes en paralelo (`run_workflow`), **los subagentes tienen prohibido escribir en `memories/*.md`** para evitar colisiones. Solo `qa_orchestrator` actualiza la memoria tras el Checkpoint.

---

## 2. Ubicación Estándar de Memorias Activas

- **`qa_orchestrator` (Memoria Maestra Global):** `memories/qa_orchestrator/memoria_qa_orchestrator.md`
- **`qa_ado_importer`:** `memories/qa_ado_importer/memoria_qa_ado_importer.md`
- **`qa_figma_importer`:** `memories/qa_figma_importer/memoria_qa_figma_importer.md`
- **`qa_analytics`:** `memories/qa_analytics/memoria_qa_analytics.md`
- **`qa_designer`:** `memories/qa_designer/memoria_qa_designer.md`
- **`qa_ado_exporter`:** `memories/qa_ado_exporter/memoria_qa_ado_exporter.md`
- **Archivo Histórico (Solo lectura bajo demanda):** `memories/archive/`

---

## 3. Ciclo de Vida (Lectura y Escritura)
1. **Al Iniciar:** Leer la memoria activa del agente (y `memoria_qa_orchestrator.md` si aplica) para recuperar acuerdos vigentes sin repetir preguntas al usuario.
2. **Al Cerrar / Pausar:** Actualizar únicamente lo activo (Fecha, Feature/HU en curso, Checkpoint alcanzado, Acuerdos confirmados y Bloqueos abiertos).
