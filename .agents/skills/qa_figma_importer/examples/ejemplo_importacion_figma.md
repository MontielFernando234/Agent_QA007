# Ejemplo Completo de Ejecución: `qa_figma_importer` (Sección `1:19834` - Echeq Mobile)

Este documento muestra cómo opera **`qa_figma_importer`** al importar imágenes de prototipos de Figma para una Historia de Usuario (ej. HU `58664` de la Feature `44719`), respetando la **Regla de Oro (Human-in-the-Loop)** y preparando el terreno para que **`qa_analytics`** encuentre discrepancias entre la HU, sus adjuntos de ADO y el Figma.

---

## 1. Entrada del Usuario
> *"Importa los diseños de Figma de https://www.figma.com/design/LGZBulfnpzDGHfWfVnIVIr/%F0%9F%92%B5-Echeq-Mobile?node-id=1-19834&t=5yFQ4aIMIuLFxFId-0 para la HU 58664."*

---

## 2. Ejecución de ETAPA 1 (Verificación Local + `get_metadata` + Checkpoint)

1. **Verificación en `input/index.json`:**
   - El agente consulta la HU `58664` y detecta que pertenece a:
     - **Plataforma:** `mobile`
     - **Funcionalidad:** `consulta_echeq`
     - **Ruta de la HU:** `input/mobile/consulta_echeq/58664/`
   - Revisa `input/mobile/consulta_echeq/58664/figma/screens/` para comprobar si ya existen imágenes descargadas.

2. **Inspección de Estructura en Figma (`get_metadata`):**
   - Extrae `fileKey = "LGZBulfnpzDGHfWfVnIVIr"` y `nodeId = "1:19834"`.
   - Invoca `get_metadata` en el MCP `figma_figma` y descubre la sección **`MVP MOBILE - Consulta y accesos`** con los siguientes frames:
     - `313:13505` — `Home-Bancor` (`360x756`)
     - `1174:22938` — `Home-Bancor (con Overlay/Sidebar)` (`360x756`)
     - `1174:23361` — `Sidebar (Menú desplegable)` (`360x656`)
     - `1:19840` — `ECHEQ - Accesos` (`360x842`)
     - `3206:108560` — `ECHEQ - Accesos con feature flag en ENDOSAR, DEPOSITAR Y VENDER` (`360x800`)
     - `922:16546` — `ECHEQ - Usuario sin permisos` (`360x800`)
     - `2183:24528` — `ECHEQ - Estado de mejora o correciónes` (`360x800`)
     - `582:12096` — `PreticketScreen` (`360x800`)

3. **Punto de Control (Checkpoint 1 - Regla de Oro):**
   - **Caso A (Si la carpeta `figma/screens/` ya tenía imágenes previas):**
     > *"En `input/mobile/consulta_echeq/58664/figma/screens/` ya existen 2 imágenes descargadas el `2026-11-18`:*
     > - `1174-23361_Sidebar.png`
     > - `1-19840_ECHEQ-Accesos.png`
     > *¿Deseas **sobrescribir** las imágenes actuales, **agregar** otros frames de la sección o **conservar** las imágenes existentes sin cambios?"*
   - **Caso B (Primera importación de Figma para la HU `58664`):**
     > *"En la sección `1:19834` (`MVP MOBILE - Consulta y accesos`) se detectaron 8 frames. Para la HU **58664** (`MB - ECHEQ - MENU - Agregar opción Echeq en el menú desplegable`), te propongo descargar en `input/mobile/consulta_echeq/58664/figma/screens/`:*
     > 1. `313:13505` (`Home-Bancor`)
     > 2. `1174:23361` (`Sidebar` - Menú desplegable)
     > 3. `1:19840` (`ECHEQ - Accesos`)
     > *(Opcionalmente podemos descargar los 8 frames de la sección). ¿Confirmas esta selección?"*

---

## 3. Ejecución de ETAPA 2 y 3 (Descarga de Capturas PNG + Indexación)

Tras la confirmación del usuario:
1. Invoca `get_screenshot` para cada frame seleccionado y descarga los PNG en `input/mobile/consulta_echeq/58664/figma/screens/`.
2. Genera `input/mobile/consulta_echeq/58664/figma/figma_context_58664.md` con las vistas previas, dimensiones, jerarquía de componentes y textos literales (*copy*).
3. Ejecuta:
   ```bash
   node .agents/skills/qa_ado_importer/scripts/manage_ado_index.js register-figma --id 58664 --platform mobile --functionality consulta_echeq --file-key LGZBulfnpzDGHfWfVnIVIr --node-id 1:19834 --url "https://www.figma.com/design/LGZBulfnpzDGHfWfVnIVIr/%F0%9F%92%B5-Echeq-Mobile?node-id=1-19834"
   ```
4. Actualiza `input/index.json` e `input/INDEX.md`.

---

## 4. Ejemplo de Discrepancias Detectadas Luego por `qa_analytics`

Cuando `qa_analytics` analiza la HU `58664`, compara las 3 fuentes locales:
1. **Texto escrito en `hu_58664.md`**: Dice *"Se debe disponibilizar la opción ECHEQ en el menú desplegable"* pero no especifica en qué posición del menú ni si lleva badge `"Nuevo"`.
2. **Imagen adjunta en ADO (`attachments/028418ed_image.png`)**: Muestra una captura del menú lateral donde la opción aparece con un texto o ícono anterior.
3. **Prototipo vigente en Figma (`figma/screens/1174-23361_Sidebar.png` y `3206-108560_ECHEQ-Accesos-FF.png`)**: Muestra la posición exacta en el `Sidebar`, además de una variante con *Feature Flag* (`3206:108560`) y una pantalla de *Usuario sin permisos* (`922:16546`) que no estaban detalladas en los Criterios de Aceptación de la HU.
