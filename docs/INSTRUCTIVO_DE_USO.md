# Instructivo de Uso — AgenteQA (Orquestador Agéntico de QA)

Guía operativa integral para configurar, operar y mantener el ecosistema multi-agente de ingeniería de calidad de software basado en **ISTQB**, **Azure DevOps (ADO)**, **Figma** y **Playwright**.

---

## 1. Requisitos Previos

1. **Node.js `>= 20.0`** (verificar con `node -v` y `npx -v`).  
   *Todos los scripts `.js` del proyecto utilizan librerías nativas de Node.js: no requieren `npm install` ni librerías de terceros.*
2. **Playwright `>= 1.59` / `@playwright/cli`** *(Requerido para el Nivel 6 — `qa_automation` + `playwright-cli`)*:  
   - Verificar en el repositorio de pruebas destino con `npx --no-install playwright --version` o instalar el CLI con `npm install -g @playwright/cli@latest`.
3. **Python `>= 3.8`** *(Opcional — requerido si ejecutas scripts de paralelismo `batch_*_workflow.py` vía `run_workflow` para procesar lotes masivos de 3+ HUs).*
4. **Acceso a Azure DevOps**: Cuenta con permisos de lectura de Work Items y, si se utiliza exportación por API, permisos de escritura en Work Items y Test Plans / Test Suites.
5. **Acceso a Figma**: Permiso de visualización sobre los archivos y proyectos de diseño de la organización.

---

## 2. Configuración Inicial del Proyecto

### 2.1 Parámetros Globales (`qa.config.json`)
Edita [`qa.config.json`](../qa.config.json) en la raíz del proyecto para definir los valores por defecto de tu equipo y proyecto:

```json
{
  "organization": "BancorDigital",
  "project": "Soluciones",
  "default_area_code": "CSM_SIF",
  "default_area_path": "Soluciones\\TRB-CashManagement\\PRD-VALORES\\SCT-Valores NVA_APP",
  "default_iteration_path": "Soluciones\\PI 7\\PI7 - Sprint 5",
  "default_assigned_to": "Apellido, Nombre",
  "default_feature_tag": "qa_feature_echeq"
}
```
> Todos los scripts (`convert_to_ado_csv.js`, `export_to_ado_api.js`) toman estos valores como referencia cuando no se indican por argumento.

### 2.2 Configuración del Servidor MCP de Azure DevOps
1. En Azure DevOps, dirígete a **User Settings > Personal Access Tokens > New Token**.
   - **Scopes mínimos requeridos:** `Work Items (Read & Write)`, `Project and Team (Read)`, `Test Management (Read & Write)`.
2. **Codificación Base64 obligatoria para `@azure-devops/mcp -a pat`:**  
   El paquete oficial de Microsoft exige el token codificado en Base64 con el prefijo `:<PAT>`.
   - **PowerShell (Windows):**
     ```powershell
     [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":" + "TU_PAT_AQUI"))
     ```
   - **Bash (macOS / Linux):**
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
4. Recarga la ventana del entorno (`Ctrl + Shift + P` > `Developer: Reload Window`).

### 2.3 Configuración del Servidor MCP de Figma
Instala y autoriza el plugin oficial de **Figma** desde el Marketplace del entorno. Si la API REST de Figma presenta restricciones de cuota o rate limit (HTTP 429), puedes exportar manualmente las pantallas PNG del prototipo a la carpeta `input/<plataforma>/<funcionalidad>/<ID_HU>/figma/screens/` e indexarlas con `manage_ado_index.js register-figma`.

---

## 3. Catálogo de Workflows Operativos (`WF-01` a `WF-07`)

El punto de contacto recomendado es interactuar siempre con el **QA Lead Sr (`/qa_orchestrator`)**, quien diagnostica el estado del índice local (`input/index.json`), propone el **Plan Estratégico (Checkpoint 0)** y coordina la ejecución de las skills especialistas.

| Objetivo | Workflow | Ejemplo de Prompt en el Chat |
| :--- | :---: | :--- |
| **Ingesta de Feature o HU + Figma** | `WF-01` | *"`/qa_orchestrator` Importa la Feature 44719 y el Figma para preparar los insumos de consulta de ECHEQ mobile."* |
| **Análisis Estático y Triangulación** | `WF-02` | *"`/qa_orchestrator` Analiza la HU 78500 triangulando el texto de la HU, las capturas de ADO y las pantallas de Figma. Apóyate en qa_istqb_mobile."* |
| **Diseño Funcional con ISTQB RBT** | `WF-03` | *"`/qa_orchestrator` Diseña los casos funcionales de la HU 78500 para Release R19, área CSM_SIF, aplicando la estrategia de 3 suites Mobile (CORE, iOS, UI_TABLET)."* |
| **Generación de CSV de 18 col (Carga Manual)** | `WF-04` | *"`/qa_ado_exporter` Genera los archivos CSV de importación manual a ADO para las 3 suites de la HU 78500 con Iteration: Soluciones\PI 7\PI7 - Sprint 5."* |
| **Exportación Directa a ADO vía API/MCP** | `WF-04` | *"`/qa_ado_exporter` Crea los Test Cases de la HU 78500 en ADO en el Test Plan 36339, suite principal 36341, bajo la jerarquía FE -> CORE, iOS y UI_TABLET, vinculándolos a la HU."* |
| **Flujo E2E Completo** | `WF-05` | *"`/qa_orchestrator` Trabajemos la HU 58664 de principio a fin, desde la importación hasta la exportación a ADO con validación en cada checkpoint."* |
| **Actualización por Nueva Revisión (`rev` Delta)** | `WF-06` | *"`/qa_orchestrator` La HU 78500 se actualizó en ADO. Sincroniza la nueva versión, calcula las diferencias y ajusta solo los casos impactados."* |
| **Automatización E2E con Playwright** | `WF-07` | *"`/qa_automation` Automatiza los casos de la suite CORE de la HU 78500 (`output/testCases/consulta_echeq/78500/`) sobre `./e2e-mobile`, inspeccionando el DOM real."* |
| **Mantenimiento y Reparación de Tests** | `WF-07` | *"`/qa_automation` Revisa y repara el test `tests/echeq/permisos.spec.ts` verificando el DOM en vivo con `playwright-cli` y respetando los Page Objects del proyecto."* |

---

## 4. Principios y Reglas de Calidad Obligatorias

### 4.1 Estrategia ISTQB Risk-Based Testing (RBT)
* **En Mobile Banking (Consumo de `qa_istqb_mobile`):**  
  En lugar de multiplicar idénticamente los casos por cada dispositivo del parque (lo que generaría suites redundantes de 70+ casos), se diseñan **3 suites especializadas**:
  1. **Suite `CORE`:** Valida el 100% de la lógica de negocio, reglas bancarias, caminos positivos y errores sobre el dispositivo principal Tier 1 (`Android Smartphone` `[AS]`).
  2. **Suite `iOS`:** Valida exclusivamente riesgos y diferenciales nativos de Apple (`[iOSS]`): Face ID, selectores de fecha con ruedas (`UIDatePicker`), teclado numérico sin botón OK, gestos swipe-back y Safe Area de notch/Dynamic Island.
  3. **Suite `UI_TABLET`:** Valida consistencia de layout responsivo, distribución de grillas/columnas, rotación horizontal/vertical y márgenes en pantallas grandes (`[TA]` e `[iPad]`).
* **En Web Banking (Consumo de `qa_istqb_web`):**  
  Se priorizan los riesgos de aplicaciones web de escritorio: grillas de datos complejas, paginación, filtros combinados, ordenamiento de columnas, navegación accesible por teclado (Tab/Shift+Tab), sesión concurrente en múltiples pestañas, refresco intempestivo (F5) y exportaciones (.xlsx / PDF).

### 4.2 Política Anti-Duplicidad y Taxonomía de Tags
* **Cero Duplicación de Casos:** Los casos funcionales no se clonan en suites separadas de regresión o smoke. Durante el sprint de desarrollo se corre la suite completa; para ciclos posteriores se ejecutan solo los casos etiquetados como Smoke o Regresión.
* **Restricción de Tags en Azure DevOps:**
  - **`1 - Smoke`**: Lleva el tag de funcionalidad (ej. `qa_feature_echeq`) y `qa_type_smoke`. **Nunca lleva el tag `_regression`** (para no mezclarse en ejecuciones de regresión), pero conserva la marca `[R<release>]` en el título para trazabilidad.
  - **`2 - Regresión`**: Lleva el tag de funcionalidad y `qa_feature_<modulo>_regression`.
  - **`3 - Funcional`**: Lleva únicamente el tag de funcionalidad `qa_feature_<modulo>`.

### 4.3 Jerarquía de Suites en Azure DevOps
Para exportar a ADO vía API/MCP, se aplica la jerarquía acordada con el usuario bajo supervisión Human-in-the-Loop:
```text
Test Plan
└── Suite Principal (del equipo / sprint)
    └── Suite Estática: "HU <ID_HU> - <Nombre HU>"
        ├── Sub-suite: FE
        │   ├── CORE
        │   ├── iOS
        │   └── UI_TABLET
        ├── Sub-suite: BFF  (si aplica)
        └── Sub-suite: API  (si aplica)
```
> **Cero Suposiciones:** Toda la estructura, el `planId`, el `suiteId` principal y los paths deben confirmarse con el usuario antes de crear suites o Work Items.

### 4.4 Restricciones de Automatización Playwright (`qa_automation` + `playwright-cli`)
1. **Inspección Obligatoria del DOM Real:** Está prohibido inventar o deducir locators. Todo selector debe validarse contra el HTML real de la aplicación en ejecución.
2. **Jerarquía Oficial de Locators:**
   `getByRole` > `getByLabel` > `getByPlaceholder` > `getByText` > `getByTestId` > `.locator(css_estable)`.
3. **Prohibición de XPath:** No se utiliza XPath salvo autorización explícita del usuario cuando ningún selector estándar resulte viable.
4. **Respeto a la Arquitectura Existente:** Se siguen estrictamente los patrones, Page Objects, fixtures y utilidades del proyecto de automatización destino sin imponer estructuras nuevas.

---

## 5. Referencia de Scripts CLI (Zero-Token Utilities)

Todos los comandos se ejecutan desde la raíz del workspace:

```bash
# 1. Consultar si una HU o Feature ya está indexada localmente
node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js check --id 78500

# 2. Verificar estado de pantallas de Figma indexadas
node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js check-figma --id 78500

# 3. Registrar pantallas de Figma cargadas manualmente
node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js register-figma --id 78500

# 4. Comparar diferencias entre dos revisiones de una HU (WF-06)
node .agents/skills/qa_orchestrator/scripts/diff_hu_versions.js --id 78500 --old-rev 1 --new-rev 2

# 5. Auditar calidad del CSV funcional de 12 columnas
node .agents/skills/qa_designer/scripts/validate_test_cases.js output/testCases/consulta_echeq/78500/casos_prueba_78500_CORE.csv

# 6. Convertir CSV funcional a CSV de importación manual ADO (18 columnas RFC 4180)
node .agents/skills/qa_ado_exporter/scripts/convert_to_ado_csv.js \
  output/testCases/consulta_echeq/78500/casos_prueba_78500_CORE.csv \
  output/testCases/consulta_echeq/78500/casos_prueba_78500_CORE_ado_import.csv \
  "Soluciones\TRB-CashManagement\PRD-VALORES\SCT-Valores NVA_APP" \
  "Montiel, Fernando Javier" \
  "Soluciones\PI 7\PI7 - Sprint 5" \
  "Mobile"

# 7. Preparar payloads JSON Patch con pasos en XML (Dry-Run de exportación)
node .agents/skills/qa_ado_exporter/scripts/export_to_ado_api.js prepare \
  --csv output/testCases/consulta_echeq/78500/casos_prueba_78500_CORE.csv \
  --hu-id 78500 --platform mobile \
  --output output/testCases/consulta_echeq/78500/ado_payloads_78500_CORE.json

# 8. Auditar arquitectura de un proyecto Playwright existente
node .agents/skills/qa_automation/scripts/inspect_playwright_project.js ./ruta-a-proyecto-playwright

# 9. Auditar locators y buenas prácticas en tests de Playwright
node .agents/skills/qa_automation/scripts/audit_playwright_locators.js ./ruta-a-proyecto-playwright/tests
```

---

## 6. Mantenimiento y Ciclo de Vida de Memorias (`memories/`)

* **Inventario Técnico:** Vive exclusivamente en `input/index.json` (rutas locales, revisiones de ADO, pantallas de Figma e IDs de Test Cases generados).
* **Memoria Activa:** Los archivos `memories/<skill>/memoria_<skill>.md` registran únicamente acuerdos vigentes del sprint en curso, decisiones de negocio abiertas y bloqueos (máximo ~150 líneas).
* **Archivado:** Al finalizar un Release o Feature, los acuerdos se archivan en `memories/archive/<funcionalidad>_<release>.md` manteniendo limpias y livianas las memorias activas.
