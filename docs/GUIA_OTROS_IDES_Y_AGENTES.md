# Guía de Portabilidad: Uso de AgenteQA en Otros IDEs y Agentes de IA

El proyecto **AgenteQA** está diseñado con **rutas 100% relativas**, **scripts Node.js nativos (sin dependencias externas)** y separación estricta entre **Rules**, **Skills** y **Configuración (`qa.config.json`)**.

Si deseas utilizar este mismo ecosistema QA en **Claude Code**, **VS Code (GitHub Copilot)**, **OpenAI Codex CLI** o **Cursor**, esta guía detalla exactamente qué archivos o estructuras debes adaptar en cada herramienta.

---

## 1. Tabla Comparativa de Compatibilidad entre IDEs / Agentes

| Plataforma / IDE | Ubicación de Rules | Ubicación de Skills / Comandos | Archivo de Config MCP | Clave Raíz MCP | Paralelismo Multi-Agente |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Antigravity** *(Nativo)* | `.agents/rules/*.md` | `.agents/skills/<name>/SKILL.md` | `~/.gemini/config/mcp_config.json` | `"mcpServers"` | `invoke_subagent` / `run_workflow` (Python) |
| **VS Code (GitHub Copilot)** | `.github/copilot-instructions.md` y `.github/instructions/*.instructions.md` | `.github/skills/` o `.github/prompts/*.prompt.md` | `.vscode/mcp.json` | **`"servers"`** | Copilot Agent Mode / Custom Agents (`.github/agents/*.agent.md`) |
| **Claude Code (Anthropic)** | `CLAUDE.md` (raíz) y `.claude/rules/*.md` | `.claude/skills/<name>/SKILL.md` | `.mcp.json` (raíz) o `~/.claude.json` | `"mcpServers"` | Subagentes en `.claude/agents/*.md` (`Task`/`Agent` tool) |
| **OpenAI Codex CLI** | `AGENTS.md` (raíz) | `.agents/skills/<name>/SKILL.md` *(Compatible nativo)* | `~/.codex/config.toml` *(TOML)* | `[mcp_servers.<name>]` | Subagentes / ejecución en paralelo vía CLI |
| **Cursor IDE** | `.cursor/rules/*.mdc` | `.cursor/skills/` o `.agents/skills/` | `.cursor/mcp.json` | `"mcpServers"` | Composer / Background Agents |

---

## 2. Adaptaciones Específicas por Herramienta

### A. VS Code + GitHub Copilot (Agent Mode)

1. **Reglas (`.github/`):**
   - Crea `.github/copilot-instructions.md` en la raíz con un índice apuntando a las 5 rules `always_on` de `.agents/rules/`:
     ```markdown
     # Instrucciones Obligatorias del Proyecto AgenteQA
     Antes de ejecutar cualquier tarea, leer y cumplir estrictamente:
     - `.agents/rules/no_suposiciones.md`
     - `.agents/rules/human_in_the_loop.md`
     - `.agents/rules/memoria_agentica.md`
     - `.agents/rules/arquitectura_insumos_tokens.md`
     - `.agents/rules/orquestacion_y_jerarquia_agentes.md`
     ```
   - Opcionalmente, copia las 5 rules contextuales (`criterios_web_y_mobile.md`, `nomenclatura_casos_prueba.md`, etc.) a `.github/instructions/<nombre>.instructions.md` cambiando el frontmatter a `applyTo: "**"`.
2. **Skills:**
   - VS Code Copilot descubre skills en `.github/skills/<name>/SKILL.md` (puedes copiar o crear un symlink desde `.agents/skills/` hacia `.github/skills/`).
3. **Configuración MCP (`.vscode/mcp.json`):**
   - **¡Atención a la clave raíz!** VS Code usa **`"servers"`** (no `"mcpServers"`).
   - **Ventaja en VS Code:** Copilot soporta nativamente la autenticación OAuth con Microsoft Entra ID contra el servidor remoto HTTP de Azure DevOps, sin necesidad de PAT:
     ```json
     {
       "servers": {
         "azure-devops": {
           "type": "http",
           "url": "https://mcp.dev.azure.com/BancorDigital"
         },
         "figma": {
           "type": "http",
           "url": "https://mcp.figma.com/mcp"
         }
       }
     }
     ```
   - *(Si prefieres usar el servidor local con PAT igual que en Antigravity, usa `"type": "stdio"`, `"command": "npx"`, `"args": ["-y", "@azure-devops/mcp", "BancorDigital", "-a", "pat"]` y `"env": { "PERSONAL_ACCESS_TOKEN": "<BASE64>" }`).*

---

### B. Claude Code (Anthropic CLI / Extensión VS Code)

1. **Reglas (`CLAUDE.md` — Sin duplicar archivos):**
   - Crea un archivo `CLAUDE.md` en la raíz del proyecto usando la sintaxis nativa `@import` de Claude Code para referenciar directamente las rules de `.agents/rules/`:
     ```markdown
     # AgenteQA — Reglas del Orquestador QA
     @.agents/rules/no_suposiciones.md
     @.agents/rules/human_in_the_loop.md
     @.agents/rules/memoria_agentica.md
     @.agents/rules/arquitectura_insumos_tokens.md
     @.agents/rules/orquestacion_y_jerarquia_agentes.md
     ```
   - O copia la carpeta `.agents/rules/` a `.claude/rules/`.
2. **Skills:**
   - Copia (o crea un enlace simbólico) de `.agents/skills/` hacia `.claude/skills/`. Claude Code reconoce exactamente el mismo formato `SKILL.md` con frontmatter `name` y `description` y los expone como slash commands (`/qa_orchestrator`, `/qa_analytics`, etc.).
3. **Configuración MCP (`.mcp.json` en la raíz del proyecto):**
   ```json
   {
     "mcpServers": {
       "azure-devops": {
         "command": "npx",
         "args": ["-y", "@azure-devops/mcp", "BancorDigital", "-a", "pat"],
         "env": {
           "PERSONAL_ACCESS_TOKEN": "TU_TOKEN_EN_BASE64"
         }
       },
       "figma": {
         "type": "http",
         "url": "https://mcp.figma.com/mcp"
       }
     }
   }
   ```
4. **Nota sobre Paralelismo (`batch_*_workflow.py`):**
   - Los scripts `.py` en `.agents/skills/qa_orchestrator/scripts/` usan la primitiva `run_workflow` propia de Antigravity. En Claude Code, para lotes de 3+ HUs el Orquestador simplemente delega en paralelo usando la herramienta nativa `Agent` / `Task` de Claude Code (los scripts `.js` de Node funcionan 100% igual sin cambios).

---

### C. OpenAI Codex CLI

1. **Reglas (`AGENTS.md` en la raíz):**
   - OpenAI Codex lee automáticamente `AGENTS.md` en la raíz del repositorio. Crea un `AGENTS.md` que liste las 5 rules `always_on` de `.agents/rules/` y apunte a `.agents/skills/qa_orchestrator/SKILL.md`.
2. **Skills:**
   - **Compatibilidad nativa:** OpenAI Codex descubre automáticamente `.agents/skills/<name>/SKILL.md` sin mover ni renombrar nada.
3. **Configuración MCP (`~/.codex/config.toml`):**
   - Codex utiliza formato **TOML** en lugar de JSON:
     ```toml
     [mcp_servers.azure-devops]
     command = "npx"
     args = ["-y", "@azure-devops/mcp", "BancorDigital", "-a", "pat"]

     [mcp_servers.azure-devops.env]
     PERSONAL_ACCESS_TOKEN = "TU_TOKEN_EN_BASE64"

     [mcp_servers.figma]
     url = "https://mcp.figma.com/mcp"
     ```

---

### D. Cursor IDE

1. **Reglas (`.cursor/rules/*.mdc`):**
   - Copia los archivos de `.agents/rules/*.md` a `.cursor/rules/` con extensión `.mdc`.
   - En el frontmatter de cada `.mdc`:
     - Para las 5 rules `always_on`: reemplazar `trigger: always_on` por `alwaysApply: true`.
     - Para las 5 rules `model_decision`: reemplazar `trigger: model_decision` por `alwaysApply: false` manteniendo el campo `description`.
2. **Configuración MCP (`.cursor/mcp.json`):**
   - Usa el mismo esquema JSON `"mcpServers"` que Antigravity y Claude Code.

---

## 3. Qué Funciona Sin Ningún Cambio en TODOS los IDEs

Independientemente del IDE o modelo de IA que utilices, **el 90% del proyecto funciona de forma idéntica sin tocar una sola línea**:

* ✅ Toda la estructura de carpetas: `input/`, `output/`, `memories/` y `qa.config.json`.
* ✅ Todos los scripts Node.js nativos:
  * `manage_ado_index.js` (limpieza HTML -> Markdown, versionado e indexado `input/index.json`).
  * `diff_hu_versions.js` (cálculo de delta entre revisiones `rev`).
  * `validate_test_cases.js` (auditoría automática de CSVs de 12 columnas).
  * `convert_to_ado_csv.js` (conversor a CSV 18 columnas RFC 4180).
  * `export_to_ado_api.js` (conversor XML `Microsoft.VSTS.TCM.Steps` y exportación directa vía REST API de ADO).
* ✅ Todas las plantillas (`resources/`) y ejemplos (`examples/`).
* ✅ Todas las rutas relativas internas en los archivos Markdown.

> **Tip para Equipos Mixtos (Multi-IDE):**  
> Si en tu equipo una persona usa **Antigravity**, otra **Claude Code** y otra **VS Code / Codex**, mantén `.agents/rules/` y `.agents/skills/` como **única fuente de verdad** y agrega en la raíz solo pequeños archivos puente (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`) que referencien a `.agents/` sin duplicar el contenido.
