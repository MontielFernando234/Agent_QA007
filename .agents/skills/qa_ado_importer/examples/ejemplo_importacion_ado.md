# Ejemplo Completo de Ejecución: `qa_ado_importer` (Feature 44719 y User Story 58664)

Este documento ilustra cómo trabaja la skill **`qa_ado_importer`** en los dos escenarios principales:
1. Cuando el usuario entrega una **Feature** (ej. `44719`) para explorar e importar sus Historias de Usuario.
2. Cuando una Historia de Usuario **ya existe persistida** en `input/` y se aplica la **Regla de Oro (Cero Suposiciones / Human-in-the-Loop)**.

---

## Escenario 1: Importación desde una Feature (`44719`)

### 1.1 Entrada del Usuario
> *"Importa la Feature 44719 de Azure DevOps para analizar sus historias de consulta de ECHEQ mobile."*

### 1.2 Ejecución de ETAPA 1 (Verificación de Índice Local + Descubrimiento en ADO)

1. El agente ejecuta la consulta local sobre `input/index.json`:
   ```bash
   node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js check --id 44719
   ```
2. Invoca `wit_work_item` (`action: "get"`, `id: 44719`, `expand: "Relations"`) en el MCP `azure-devops`.
3. Detecta que el Work Item `44719` es de tipo **`Feature`** (`Valores - Mobile - Consulta ECHEQ Recibidos/ Emitidos/ Endosados/ Cedidos`, `rev 6`) y tiene **12 hijos** (`System.LinkTypes.Hierarchy-Forward`).
4. Invoca `wit_work_item` (`action: "get_batch"`) sobre los IDs hijos (`58664, 58682, 62868, 62929, 66152, 66222, 75772, 76389, 78500, 85217, 93567, 96695`) y los cruza con `input/index.json`.

### 1.3 Respuesta en Checkpoint 1 (Human-in-the-Loop Obligatorio)

El agente presenta el estado al usuario **sin sobrescribir nada automáticamente**:

> **Resumen de la Feature `44719` — Valores - Mobile - Consulta ECHEQ Recibidos/ Emitidos/ Endosados/ Cedidos**
> - **Plataforma detectada:** `mobile`
> - **Funcionalidad propuesta:** `consulta_echeq` (`input/mobile/consulta_echeq/`)
>
> | ID HU | Título | Estado ADO | Rev en ADO | Rev Local (`input/`) | Estado de Sincronización |
> | :--- | :--- | :--- | :--- | :--- | :--- |
> | **58664** | MB - ECHEQ - MENU - Agregar opción Echeq en el menú desplegable | Active | `rev 22` | `rev 21` | 🔄 **Nueva versión en ADO (`rev 21` -> `rev 22`)** |
> | **58682** | MB - ECHEQ - Accesos desde Home y sección Valores | Active | `rev 15` | `rev 15` | ✅ **Al día (`rev 15`)** |
> | **62868** | MB - ECHEQ - Consulta listado Recibidos y filtros | Active | `rev 18` | - | 🆕 **No persistida aún** |
>
> **Por favor confírmame:**
> 1. ¿Confirmas la ruta `input/mobile/consulta_echeq/`?
> 2. Para la HU **58664** (que ya existe localmente en `rev 21`), ¿deseas **actualizar la versión activa a `rev 22`** (conservando `rev 21` en `versions/`) o mantener `rev 21`?
> 3. ¿Cuáles de las nuevas HUs deseas importar ahora?

---

## Escenario 2: Persistencia, Descarga de Adjuntos e Indexación (ETAPA 2 y ETAPA 3)

Una vez que el usuario responde:
> *"Sí, confirma `mobile/consulta_echeq`, actualiza la 58664 a la rev 22."*

1. **Extracción profunda de la HU `58664`:**
   - Obtiene el detalle completo con `wit_work_item` (`action: "get"`, `id: 58664`, `expand: "All"`).
   - Como `System.CommentCount` es `3`, obtiene los comentarios con `wit_work_item` (`action: "list_comments"`, `workItemId: 58664`).
2. **Transformación HTML -> Markdown e Indexación:**
   - Ejecuta el script helper:
     ```bash
     node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js upsert-hu --json "<wit_58664.json>" --comments "<comments_58664.json>" --platform "mobile" --functionality "consulta_echeq" --parent-title "Valores - Mobile - Consulta ECHEQ Recibidos/ Emitidos/ Endosados/ Cedidos"
     ```
   - El script convierte las tablas HTML (`Dado / Cuando / Entonces`) a tablas Markdown limpias y reporta 2 adjuntos embebidos:
     - `028418ed-a1b7-44b4-800e-3b2926941ecf` (`image.png`)
     - `5d39ff5a-7501-414b-a838-7110b70fd69a` (`image.png`)
3. **Descarga de Imágenes Adjuntas:**
   - El agente descarga los adjuntos con `wit_work_item_attachment` dentro de `input/mobile/consulta_echeq/58664/attachments/`.
4. **Archivos resultantes en disco:**
   - `input/index.json` (Índice maestro JSON actualizado)
   - `input/INDEX.md` (Catálogo visual en Markdown actualizado)
   - `input/mobile/consulta_echeq/feature_44719.md` (Contexto de la Feature)
   - `input/mobile/consulta_echeq/58664/hu_58664.md` (Versión activa `rev 22` lista para `qa_analytics`)
   - `input/mobile/consulta_echeq/58664/versions/hu_58664_rev21.md` (Versión previa preservada)
   - `input/mobile/consulta_echeq/58664/versions/hu_58664_rev22.md` (Snapshot inmutable `rev 22`)
   - `input/mobile/consulta_echeq/58664/attachments/028418ed_image.png`
   - `input/mobile/consulta_echeq/58664/attachments/5d39ff5a_image.png`
