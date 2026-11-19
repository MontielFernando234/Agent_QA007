---
trigger: model_decision
description: "Regla de triangulación y detección de discrepancias entre las 3 fuentes del requerimiento: 1) Texto escrito de la HU en ADO, 2) Imágenes adjuntas en ADO y 3) Prototipo vigente en Figma. Activar siempre en qa_analytics."
---

# Regla Analítica: Triangulación Visual y Funcional HU vs. Adjuntos ADO vs. Figma (`RULE[triangulacion_visual_figma_ado.md]`)

## 1. Principio de Contraste Cruzado de 3 Fuentes (3-Way Diff)
En las Historias de Usuario de Azure DevOps es frecuente que el texto escrito, las capturas pegadas dentro de la HU al momento de su redacción y el prototipo vigente en Figma presenten diferencias por evolución del diseño.

Por ello, **`qa_analytics` tiene prohibido analizar el texto de la HU de forma aislada** cuando existan imágenes adjuntas (`attachments/`) o prototipos de Figma (`figma/`). Debe contrastar sistemáticamente las **3 fuentes locales**:

1. **Fuente 1 — Definición Escrita (`hu_<ID_HU>.md`):** Descripción (DoR/DoD), Tablas de Criterios de Aceptación (`Dado / Cuando / Entonces`) y Comentarios de refinamiento en ADO.
2. **Fuente 2 — Imágenes Adjuntas en ADO (`attachments/*.png`):** Capturas o recortes embebidos dentro del cuerpo o comentarios de la HU en Azure DevOps.
3. **Fuente 3 — Prototipo Vigente en Figma (`figma/screens/*.png` + `figma_context_<ID_HU>.md`):** Pantallas oficiales importadas desde Figma MCP.

---

## 2. Categorías Obligatorias de Discrepancias a Detectar

Durante la Etapa 2 de `qa_analytics`, el agente debe inspeccionar visualmente las imágenes (con `read_file`) y clasificar cualquier hallazgo en una de las siguientes 4 categorías dentro de la **Matriz de Discrepancias Visuales y Funcionales**:

1. **Discrepancia de Copy / Textos Literales (`COPY`):**
   - Títulos de pantalla, etiquetas de campos, nombres de botones o solapas, textos de ayuda, mensajes de error o símbolos de moneda (`$` vs `USD`) que estén escritos de una forma en la HU y de otra en Figma.
2. **Discrepancia de Componentes, Filtros o Acciones (`COMPONENTE`):**
   - Filtros, columnas de listado, botones, íconos, badges o accesos directos que aparecen en la pantalla de Figma pero no están mencionados en los Criterios de Aceptación de la HU (o que la HU exige por escrito pero no existen en el diseño de Figma).
3. **Desfase entre Captura Adjunta en ADO y Figma Actual (`CAPTURA_OBSOLETA`):**
   - Cuando la imagen pegada dentro de la HU en ADO (`attachments/`) corresponde a una versión vieja del diseño que difiere del frame actual en Figma (`figma/screens/`).
4. **Pantallas o Estados de Excepción en Figma No Documentados en la HU (`ESTADO_NO_DOCUMENTADO`):**
   - Frames presentes en la sección de Figma (tales como *Usuario sin permisos*, *Empty State de resultados vacíos*, *Estado de mejora o mantenimiento*, *Variante con Feature Flag*, *Preticket*) que no tienen un Criterio de Aceptación explícito en la HU.

---

## 3. Protocolo de Resolución (Cero Suposiciones)
- Por cada discrepancia detectada en la matriz, el agente debe generar automáticamente una pregunta de refinamiento dirigida a **AFU / UX** o **PO** para que el usuario confirme **cuál es la fuente de verdad** (si prevalece el prototipo de Figma o el texto de la HU) antes de pasar el análisis a `qa_designer`.
