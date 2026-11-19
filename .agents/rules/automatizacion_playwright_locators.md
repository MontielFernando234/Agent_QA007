---
trigger: model_decision
description: "Reglas de automatización QA con Playwright: prohibición absoluta de suponer locators (inspección obligatoria del DOM/HTML real), jerarquía oficial de locators resilientes, prohibición de XPath salvo autorización explícita y adhesión estricta a la arquitectura existente del proyecto. Activar en qa_automation y qa_orchestrator."
---

# Regla: Estándares de Locators y Respeto Arquitectónico en Automatización (`RULE[automatizacion_playwright_locators.md]`)

## 1. Prohibición Absoluta de Suponer Locators (DOM-First Inspection)

1. **Cero Invención o Adivinación de Selectores:**
   - Está **estrictamente prohibido** escribir, inferir o suponer un locator a partir del texto de la Historia de Usuario, del título de un caso de prueba o de una captura de pantalla de Figma/ADO.
   - Antes de codificar cualquier interacción o aserción en Playwright, el agente **DEBE inspeccionar el HTML/DOM real de la página en vivo** utilizando las herramientas de [`playwright-cli`](../skills/playwright-cli/SKILL.md) (o MCP Playwright):
     - `playwright-cli snapshot` para obtener el árbol de accesibilidad real y las referencias (`e1`, `e2`...).
     - `playwright-cli --raw generate-locator <ref>` para obtener el locator semántico sugerido por el motor de Playwright.
     - `playwright-cli eval "el => ({ id: el.id, className: el.className, testId: el.getAttribute('data-testid'), name: el.getAttribute('name'), ariaLabel: el.getAttribute('aria-label'), outerHTML: el.outerHTML.slice(0, 300) })" <ref>` cuando el snapshot no exponga atributos necesarios.
2. **Si la Página o Ambiente No Está Accesible:**
   - Si el agente no tiene acceso a la URL/ambiente en vivo ni al código fuente HTML/componentes del Front-End del proyecto, **DEBE DETENERSE** y solicitar al usuario acceso al ambiente, sesión adjunta (`playwright-cli attach`) o fragmento del DOM real. **Jamás codificar locators ficticios con la excusa de "reemplazar luego".**

---

## 2. Jerarquía Obligatoria de Locators (Buenas Prácticas de Playwright)

El agente debe seleccionar los locators siguiendo estrictamente este orden de prioridad:

### Nivel 1 — Locators Semánticos y Orientados al Usuario (Prioridad Máxima)
1. **`page.getByRole(role, { name, exact })`**: Botones, enlaces, inputs, checkboxes, headings, diálogos, tablas, etc. Refleja cómo el usuario y la tecnología asistiva perciben la página.
2. **`page.getByLabel(text)`**: Campos de formulario asociados a un `<label>` o `aria-label`.
3. **`page.getByPlaceholder(text)`**: Inputs que solo cuentan con atributo `placeholder`.
4. **`page.getByText(text, { exact })`**: Elementos no interactivos (contenedores de texto, mensajes, badges).
5. **`page.getByAltText(text)` / `page.getByTitle(text)`**: Imágenes o iconos con atributo `alt` o `title`.

### Nivel 2 — Contratos de Prueba Explícitos
6. **`page.getByTestId(testId)`**: Atributos dedicados a testing (`data-testid`, `data-test`, `data-qa`, según lo configurado en `playwright.config`).

### Nivel 3 — Locators Personalizados con `.locator()` (Solo si fallan Nivel 1 y Nivel 2)
7. **`page.locator('<css-selector>')` combinado con filtros de Playwright (`.filter({ hasText, has })`)**:
   - Solo se permite acudir a `page.locator()` con selectores CSS cuando el DOM real carece de roles accesibles únicos, labels o `data-testid`, y los locators de Nivel 1 y 2 resultan ambiguos o inviables tras probarlos contra el HTML real.
   - Aun en este nivel, se prohíben selectores CSS frágiles acoplados a clases utilitarias generadas dinámicamente (ej. `.css-1dbjc4n`, `.sc-bdfBwQ`, cadenas largas `div > div:nth-child(4) > span`). Preferir atributos semánticos estables (`[name="..."]`, `[type="..."]`, `#id-estable`) encadenados con `.filter()`.

### Nivel 4 — Prohibición de XPath (Restricción Estricta)
8. **PROHIBIDO utilizar XPath (`xpath=...` o `//div[...]`):**
   - El uso de XPath está **terminantemente prohibido** por defecto en cualquier test o Page Object.
   - **Única Excepción:** Si un elemento del DOM es técnicamente imposible de alcanzar mediante Niveles 1, 2 y 3 (CSS + filtros de Playwright), el agente debe **pausar la generación, mostrar al usuario el fragmento de HTML real inspeccionado, explicar por qué los locators estándar no aplican y pedir autorización explícita** para usar ese XPath puntual.

---

## 3. Prohibición de Inventar Arquitectura (Adhesión al Proyecto Destino)

1. **Auditoría Arquitectónica Previa Obligatoria:**
   - Para la generación de nuevos casos automatizados o el mantenimiento de tests existentes, **NO se debe inventar ninguna arquitectura, patrón, carpeta, helper o abstracción nueva**.
   - Antes de crear o modificar un archivo de prueba, el agente debe inspeccionar el repositorio/proyecto donde se aplicará la automatización:
     - Revisar `playwright.config.ts` / `playwright.config.js` (`testDir`, `baseURL`, `use.testIdAttribute`, `projects`, `fixtures`).
     - Identificar el patrón arquitectónico vigente en el proyecto (ej. *Page Object Model (POM)*, *Screenplay*, *Component Objects*, *Fixtures personalizadas*, *Steps/BDD*, o specs directos).
     - Reutilizar los Page Objects, fixtures de autenticación (`storageState`), utilidades de datos, variables de entorno y convenciones de nombres de archivos que ya existan en el proyecto.
2. **Planificación Conjunta ante Proyecto Vacío o Duda Arquitectónica:**
   - Si el proyecto aún no posee una estructura de automatización definida, o si un nuevo flujo requiere crear un nuevo Page Object / Fixture / Helper, el agente **no debe decidirlo unilateralmente**: debe proponer las opciones al usuario y **planificar junto a él los pasos y la estructura a seguir** en un Punto de Control (*Checkpoint*).
