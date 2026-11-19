# Contexto Visual de Prototipo Figma — HU [ID_HU]: [Nombre HU]

> **Insumo Visual Persistido por `qa_figma_importer`** — Diseñado para la triangulación de discrepancias (`HU Escrita` vs. `Adjuntos ADO` vs. `Prototipo Figma`) en `qa_analytics`.

---

## 1. Metadatos de Sincronización con Figma

| Atributo | Valor |
| :--- | :--- |
| **ID de HU Asociada** | `[ID_HU]` |
| **Plataforma** | `[PLATAFORMA]` (`web` / `mobile`) |
| **Funcionalidad** | `[FUNCIONALIDAD]` |
| **Figma File Key** | `[FILE_KEY]` |
| **Nodo / Sección Raíz (`nodeId`)** | `[NODE_ID]` (`[NODE_NAME]`) |
| **Fecha de Sincronización Local** | `[SYNC_TIMESTAMP]` |
| **Total de Pantallas Descargadas** | `[SCREENS_COUNT]` |
| **Enlace Original en Figma** | [Abrir Diseño en Figma]([FIGMA_URL]) |

---

## 2. Catálogo de Pantallas (Frames) e Inventario UI

### Pantalla 1: `[FRAME_NAME]` (Node ID: `[FRAME_NODE_ID]`)
- **Dimensiones:** `[WIDTH] x [HEIGHT] px`
- **Archivo de Imagen Local:** `screens/[SCREEN_FILENAME].png`
- **Vista Previa:**  
  ![[FRAME_NAME]](./screens/[SCREEN_FILENAME].png)
- **Componentes yEstructura Detectada:**
  - **Header / Navegación:** `[HEADER_DETAILS]`
  - **Cuerpo Principal (`Main`):** `[MAIN_COMPONENTS]`
  - **Botones / Acciones / Shortcuts:** `[BUTTONS_AND_ACTIONS]`
  - **Estados / Indicadores / Badges:** `[STATES_AND_BADGES]`
- **Textos Literales (*Copy* exacto en Figma):**
  - `[TEXTO_1]`
  - `[TEXTO_2]`

---

## 3. Notas de UX, Post-its y Estados Especiales en el Lienzo

- **Estado del Flujo (`Kit UX/Estado del flujo`):** `[FLOW_STATUS]`
- **Post-its / Notas de Diseño (`Kit UX/Postit de Notas`):** `[UX_NOTES]`
- **Pantallas de Error / Empty States / Permisos Detectadas:**
  - `[EMPTY_OR_ERROR_STATES]`

---

## 4. Guía de Verificación Cruzada para `qa_analytics`

Al ejecutar el análisis estático ISTQB de la **HU `[ID_HU]`**, contrastar obligatoriamente:
1. **Texto de la HU (`hu_[ID_HU].md`) vs. Pantallas de Figma (`./screens/*.png`):** Verificar que todos los campos, filtros, botones, solapas y textos (*copy*) coincidan.
2. **Imágenes Adjuntas en ADO (`../attachments/*.png`) vs. Pantallas de Figma (`./screens/*.png`):** Detectar si la imagen pegada en ADO quedó desactualizada respecto al prototipo vigente en Figma.
3. **Pantallas de Excepción en Figma (ej. *Sin permisos*, *Estado de mejora*, *Empty States*) vs. Criterios de Aceptación de la HU:** Verificar si existen pantallas diseñadas en Figma que no fueron contempladas en los Criterios de Aceptación escritos de la HU.
