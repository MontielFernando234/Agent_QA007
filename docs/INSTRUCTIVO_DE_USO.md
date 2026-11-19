# Instructivo de Uso — AgenteQA (Orquestador Agéntico de QA)

Guía práctica paso a paso para configurar, operar y mantener el ecosistema multi-agente de QA basado en **ISTQB**, **Azure DevOps (ADO)** y **Figma**.

---

## 1. Requisitos Previos

1. **Node.js `>= 20.0`** (verificar con `node -v` y `npx -v`).  
   *Todos los scripts `.js` del proyecto usan librerías nativas de Node.js: no requieren `npm install`.*
2. **Python `>= 3.8`** *(Opcional — solo necesario si ejecutas los scripts de paralelismo `batch_*_workflow.py` mediante `run_workflow` para lotes de 3+ HUs).*
3. **Acceso a Azure DevOps** (con permisos de lectura de Work Items y, si usarás exportación por API, escritura de Work Items / Test Plans).
4. **Acceso a Figma** (cuenta miembro de la organización con permiso de visualización sobre los archivos de diseño).

---

## 2. Configuración Inicial del Proyecto

### 2.1 Parámetros Globales (`qa.config.json`)
Edita [`qa.config.json`](../qa.config.json) en la raíz del proyecto con los datos de tu equipo/tribu:

```json
{
  "organization": "BancorDigital",
  "project": "Soluciones",
  "default_area_code": "CSM_SIF",
  "default_area_path": "Soluciones\\TRB-CashManagement\\PRD-VALORES\\SCT-Valores NVA_APP",
  "default_iteration_path": "Soluciones\\PI 7\\PI7 - Sprint 4",
  "default_assigned_to": "Apellido, Nombre",
  "default_feature_tag": "qa_feature_echeq"
}
```
> Todos los scripts (`convert_to_ado_csv.js`, `export_to_ado_api.js`) leen estos valores por defecto automáticamente.

### 2.2 Configuración del MCP de Azure DevOps (Antigravity)
1. En Azure DevOps, ve a **User Settings > Personal Access Tokens > New Token**.
   - **Permisos recomendados:** `Work Items (Read & Write)`, `Project and Team (Read)`, `Test Management (Read & Write)`.
2. **Importante (Codificación Base64 obligatoria para `@azure-devops/mcp -a pat`):**  
   El paquete oficial de Microsoft espera el token en formato Base64 con el prefijo `:<PAT>`. Genera tu cadena Base64:
   - **En PowerShell (Windows):**
     ```powershell
     [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":" + "TU_PAT_AQUI"))
     ```
   - **En Bash (macOS / Linux):**
     ```bash
     printf ":%s" "TU_PAT_AQUI" | base64
     ```
3. Configura `~/.gemini/config/mcp_config.json`:
   ```json
   {
     "mcpServers": {
       "azure-devops": {
         "command": "npx",
         "args": ["-y", "@azure-devops/mcp", "BancorDigital", "-a", "pat"],
         "env": {
           "PERSONAL_ACCESS_TOKEN": "PEGA_AQUI_TU_TOKEN_EN_BASE64"
         }
       }
     }
   }
   ```
4. Recarga la ventana del IDE (`Ctrl + Shift + P` > `Developer: Reload Window`).

### 2.3 Configuración del MCP de Figma
Instala y autentica el plugin oficial de **Figma** desde el Marketplace de Antigravity (o configura el servidor `https://mcp.figma.com/mcp` según tu IDE).

---

## 3. Cómo Operar el Orquestador en el Día a Día (Workflows `WF-01` a `WF-06`)

El punto de entrada recomendado es hablar siempre con el **QA Lead Sr (`/qa_orchestrator`)**, quien diagnostica `input/index.json`, te propone el **Plan Estratégico (Checkpoint 0)** y delega en el equipo especialista.

### Ejemplos de Prompts Listos para Usar

| Objetivo | Workflow | Ejemplo de Prompt en el Chat |
| :--- | :---: | :--- |
| **Importar una Feature o HU + Figma** | `WF-01` | *"`/qa_orchestrator` Importa la Feature 44719 y el Figma `https://www.figma.com/design/...` para preparar los insumos de consulta de ECHEQ mobile."* |
| **Analizar una HU ya importada (Triangulación)** | `WF-02` | *"`/qa_orchestrator` Ejecuta el análisis estático de la HU 58664 buscando discrepancias entre el texto, las imágenes de ADO y el Figma."* |
| **Diseñar Casos de Prueba (desde Análisis)** | `WF-03` | *"`/qa_orchestrator` Diseña los casos de prueba funcionales de la HU 58664. Release R19, área CSM_SIF, capas FE y BFF Mobile, separados por Android e iOS."* |
| **Generar CSV de 18 col para carga manual** | `WF-04` | *"`/qa_ado_exporter` Genera el archivo CSV de importación manual a Azure DevOps para la HU 58664."* |
| **Exportar directo a ADO por API (XML Steps)** | `WF-04` | *"`/qa_ado_exporter` Exporta y crea los Test Cases de la HU 58664 directamente en Azure DevOps vinculándolos a la HU."* |
| **Ciclo E2E Completo** | `WF-05` | *"`/qa_orchestrator` Trabajemos punta a punta la HU 58664 desde la importación hasta los casos listos para importar en ADO."* |
| **Actualizar tras cambio de versión (`rev`)** | `WF-06` | *"`/qa_orchestrator` La HU 58664 cambió en ADO. Sincroniza la nueva versión, calcula el diff y actualiza solo lo impactado."* |

---

## 4. Reglas de Oro durante la Ejecución

1. **Human-in-the-Loop (Checkpoints):** El agente se detendrá al final de cada etapa para pedir tu validación. Puedes corregir escenarios, responder dudas de `AFU/UX`, `TL` o `PO`, o ajustar criterios tantas veces como necesites.
2. **Cero Suposiciones:**
   - Nunca sobrescribe una versión local (`rev`) de una HU ni capturas de Figma sin preguntarte.
   - Siempre confirma **Release**, **Código de Área (`CSM_SIF`)**, **Capas (`FE`, `BFF` Web/Mobile, `API` agnóstica)** y **Estrategia de Distribución por SO/Dispositivos (`Android`/`iOS`, `Smartphone`/`Tablet`/`iPad`/`Desktop`)**.
   - Nunca crea Work Items en Azure DevOps por API a menos que lo pidas explícitamente y apruebes el resumen final.
3. **Economía de Tokens:**
   - **1 a 2 HUs:** Se ejecutan en línea en tu conversación actual (cero overhead de subagentes).
   - **3+ HUs:** El Orquestador te ofrece elegir entre **Modo Paralelo** (`run_workflow` con retorno por puntero de archivo) o **Modo Secuencial**.

---

## 5. Referencia Rápida de Scripts CLI (Uso Manual o Automatizado)

Todos los comandos se ejecutan desde la raíz del proyecto (`AgenteQA/`):

```bash
# 1. Consultar si una HU o Feature ya está indexada localmente
node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js check --id 58664

# 2. Verificar si una HU ya tiene imágenes de Figma descargadas
node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js check-figma --id 58664

# 3. Buscar HUs indexadas por palabra clave o plataforma
node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js find --query consulta_echeq

# 4. Comparar diferencias (Delta) entre dos revisiones de una HU (WF-06)
node .agents/skills/qa_orchestrator/scripts/diff_hu_versions.js --id 58664 --old-rev 21 --new-rev 22

# 5. Auditar calidad del CSV funcional de 12 columnas (0 tokens LLM)
node .agents/skills/qa_designer/scripts/validate_test_cases.js output/testCases/consulta_echeq/58664/casos_prueba_58664.csv

# 6. Convertir CSV funcional (12 col) a CSV de importación manual ADO (18 col RFC 4180)
node .agents/skills/qa_ado_exporter/scripts/convert_to_ado_csv.js \
  output/testCases/consulta_echeq/58664/casos_prueba_58664.csv \
  output/testCases/consulta_echeq/58664/casos_prueba_58664_ado_import.csv \
  "Soluciones\TRB-CashManagement\PRD-VALORES\SCT-Valores NVA_APP" \
  "Montiel, Fernando Javier" \
  "Soluciones\PI 7\PI7 - Sprint 4" \
  "Mobile"

# 7. Preparar payloads JSON Patch con pasos en XML (Dry-Run sin tocar ADO)
node .agents/skills/qa_ado_exporter/scripts/export_to_ado_api.js prepare \
  --csv output/testCases/consulta_echeq/58664/casos_prueba_58664.csv \
  --hu-id 58664 --platform mobile \
  --output output/testCases/consulta_echeq/58664/ado_payloads_58664.json

# 8. Ejecutar creación real de Test Cases en Azure DevOps (vía REST API)
node .agents/skills/qa_ado_exporter/scripts/export_to_ado_api.js execute \
  --payloads output/testCases/consulta_echeq/58664/ado_payloads_58664.json \
  --hu-id 58664
```

---

## 6. Mantenimiento de Memoria (`memories/`)

* El inventario técnico de HUs (`rev`, pantallas de Figma, rutas e IDs de Test Cases) vive exclusivamente en **`input/index.json`**.
* Las memorias en `memories/<skill>/memoria_<skill>.md` guardan **solo el contexto vivo del Sprint/Feature actual** (máximo ~150 líneas).
* Al cerrar un Release o Feature, pídele al Orquestador: *"Archiva las decisiones de la Feature `<ID>` del Release `<R>` en `memories/archive/`"* para mantener las memorias activas livianas.
