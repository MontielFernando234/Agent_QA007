# Historia de Usuario [ID_HU]: [Nombre HU]

> **Archivo Persistido por `qa_ado_importer`** — Usar este archivo como fuente local para `qa_analytics` sin re-consultar el MCP de Azure DevOps.

---

## 1. Metadatos de Sincronización y Versionado (Azure DevOps)

| Atributo | Valor |
| :--- | :--- |
| **ID de HU** | `[ID_HU]` |
| **Revisión ADO Activa (`System.Rev`)** | `rev [REV]` |
| **Estado en ADO (`System.State`)** | `[STATE]` (`[BOARD_COLUMN]`) |
| **Plataforma** | `[PLATAFORMA]` (`web` / `mobile`) |
| **Funcionalidad** | `[FUNCIONALIDAD]` |
| **Feature Padre** | `[PARENT_ID]` - `[PARENT_TITLE]` |
| **Area Path** | `[AREA_PATH]` |
| **Iteration Path (Sprint)** | `[ITERATION_PATH]` |
| **Asignado a** | `[ASSIGNED_TO]` |
| **Creado por** | `[CREATED_BY]` (`[CREATED_DATE]`) |
| **Última modificación en ADO** | `[CHANGED_DATE]` por `[CHANGED_BY]` |
| **Fecha de sincronización local** | `[SYNC_TIMESTAMP]` |
| **Tags ADO** | `[TAGS]` |
| **URL ADO** | [Abrir Work Item [ID_HU] en Azure DevOps]([ADO_HTML_URL]) |

---

## 2. Insumo Estructurado para `qa_analytics` (ETAPA 1)

```text
ID de HU: [ID_HU]
Nombre HU: [Nombre HU]
Área: [AREA_PATH]
Plataforma: [PLATAFORMA]
Funcionalidad: [FUNCIONALIDAD]
Revisión ADO: rev [REV]
```

### 2.1 Descripción (`System.Description`)

[DESCRIPCION_MARKDOWN]

---

### 2.2 Criterios de Aceptación (`Microsoft.VSTS.Common.AcceptanceCriteria`)

[CRITERIOS_ACEPTACION_MARKDOWN]

---

### 2.3 Información Adicional, Comentarios e Insumos Visuales

#### Comentarios de Refinamiento en ADO (`[COMMENT_COUNT]` comentarios)
[COMENTARIOS_MARKDOWN]

#### Enlaces a Figma Detectados
[FIGMA_LINKS_MARKDOWN]

#### Imágenes y Adjuntos Descargados Localmente (`attachments/`)
[ATTACHMENTS_MARKDOWN]

#### Relaciones con Otros Work Items (Hijos / Vinculados)
[RELATIONS_MARKDOWN]
