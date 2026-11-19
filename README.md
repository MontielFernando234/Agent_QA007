# AgenteQA — Orquestador Agéntico de Ingeniería de Calidad

Ecosistema multi-agente basado en **ISTQB**, **Azure DevOps (ADO)** y **Figma** para automatizar y estandarizar el ciclo de QA (Ingesta -> Análisis Estático y Triangulación -> Diseño Funcional -> Exportación a ADO).

---

## Arquitectura del Equipo (5 Niveles + 10 Rules)

| Nivel | Skill | Responsabilidad |
| :---: | :--- | :--- |
| **1** | `qa_orchestrator` | **QA Lead Sr:** Planifica, dimensiona instancias de agentes (*Smart Scaling*), coordina Checkpoints y gobierna `memories/qa_orchestrator/memoria_qa_orchestrator.md`. |
| **2A** | `qa_ado_importer` | Ingesta Features y HUs desde ADO MCP, limpia HTML a Markdown, versiona revisiones (`System.Rev`) e indexa en `input/index.json`. |
| **2B** | `qa_figma_importer` | Inspecciona prototipos en Figma MCP, descarga capturas PNG y extrae textos UI/Post-its UX en `input/<plat>/<func>/<ID_HU>/figma/`. |
| **3** | `qa_analytics` | Análisis estático ISTQB, triangulación de 3 fuentes (HU vs. Adjuntos ADO vs. Figma), alcance `FE`/`BFF`/`API` y preguntas por rol (`AFU/UX`, `TL`, `PO`). |
| **4** | `qa_designer` | Diseño funcional en las 11 categorías ISTQB, nomenclatura oficial, distribución SO/Dispositivos (`casos_prueba_<ID>.csv` 12 col + `_clasificados.md`). |
| **5** | `qa_ado_exporter` | Genera CSV de 18 columnas RFC 4180 para carga manual y, a demanda, exporta por API/MCP convirtiendo pasos a XML (`Microsoft.VSTS.TCM.Steps`). |

---

## Requisitos y Configuración Inicial

1. **Node.js `>= 20`** (todos los scripts `.js` usan módulos nativos sin dependencias externas).
2. **Servidores MCP configurados en `~/.gemini/config/mcp_config.json`:**
   - `azure-devops` (`@azure-devops/mcp` con `-a pat` en Base64 `:<PAT>`).
   - `figma_figma` (Plugin oficial de Figma).
3. **Configuración del Proyecto:** Ajustar los valores por defecto de organización, proyecto, área y asignado en [`qa.config.json`](./qa.config.json).

---

## Documentación y Guías

* 📖 **[Instructivo de Uso Completo](./docs/INSTRUCTIVO_DE_USO.md):** Configuración inicial, generación del PAT en Base64, catálogo de prompts para los 6 workflows (`WF-01` a `WF-06`), comandos CLI de scripts y mantenimiento de memoria.
* 🔌 **[Guía para Otros IDEs y Agentes de IA](./docs/GUIA_OTROS_IDES_Y_AGENTES.md):** Instrucciones exactas de adaptación (carpetas, rules, skills y MCP) para ejecutar **AgenteQA** en **VS Code (GitHub Copilot)**, **Claude Code**, **OpenAI Codex CLI** y **Cursor**.

---

## Estructura del Workspace

```text
AgenteQA/
├── .agents/                    # Rules (10) y Skills (6) del orquestador QA
├── docs/                       # Instructivo de uso y guía de portabilidad multi-IDE
├── input/                      # Insumos versionados (index.json, INDEX.md, web/, mobile/)
├── output/                     # Entregables (analysis/ y testCases/)
├── memories/                   # Memorias activas (~150 líneas máx.) + archive/ histórico
├── qa.config.json              # Parámetros globales portables del proyecto
└── .gitignore
```
