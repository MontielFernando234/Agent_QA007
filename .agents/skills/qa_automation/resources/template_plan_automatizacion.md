# Plan de Automatización y Mapeo de Locators (`qa_automation`)

> **Instrucciones de Uso:** Utilizar esta estructura para presentar al usuario el **Checkpoint 1** (Plan y Alineación Arquitectónica) y el **Checkpoint 2** (Mapeo de Locators Reales desde el DOM) antes de generar o modificar código.

---

## 1. Checkpoint 1: Plan de Automatización y Alineación Arquitectónica

### 1.1 Origen y Alcance de los Casos de Prueba
- **Modo de Entrada:** `[ ] Casos diseñados en output/testCases/<funcionalidad>/<ID_HU>/` | `[ ] Indicaciones directas del usuario` | `[ ] Mantenimiento / Healing de tests existentes`
- **HU / Funcionalidad:** `<ID_HU> - <Nombre Funcionalidad>`
- **Casos Seleccionados:**

| # | ID / Título del Caso de Prueba | Camino | Prioridad | Resumen de Pasos y Resultado Esperado |
| :-: | :--- | :---: | :---: | :--- |
| 1 | `<Título normalizado o escenario del usuario>` | `Positivo / Negativo` | `Alta` | `1. ... -> 2. ...` |

### 1.2 Diagnóstico Arquitectónico del Proyecto Destino (Cero Invención)
- **Directorio Raíz del Proyecto:** `<ruta>`
- **Archivo de Configuración:** `<playwright.config.ts>` (`testDir`: `<...>`, `baseURL`: `<...>`, `testIdAttribute`: `<...>`)
- **Patrón Arquitectónico Vigente:** `<Page Object Model (POM) / Fixtures / Screenplay / Specs Directos>`
- **Artefactos Existentes a Reutilizar:**
  - *Fixtures / Auth:* `<ej. tests/fixtures.ts, storageState>`
  - *Page Objects / Helpers existentes:* `<ej. pages/LoginPage.ts>`
- **Archivos a Modificar o Crear (Siguiendo la convención del proyecto):**
  - `[MODIFICAR]` `<ruta/archivo_existente.ts>` — `<motivo>`
  - `[CREAR]` `<ruta/nuevo_spec.spec.ts>` — `<siguiendo nomenclatura del proyecto>`

### 1.3 Preguntas / Decisiones a Planificar con el Usuario
- `<Si hay alguna duda sobre arquitectura, datos de prueba, ambiente o alcance, listar aquí para consensuar con el usuario>`

---

## 2. Checkpoint 2: Mapeo de Locators Reales Inspeccionados en el HTML/DOM (`playwright-cli`)

> **Garantía de Cero Suposición:** Todos los locators listados a continuación fueron verificados contra el DOM real de la página utilizando `playwright-cli snapshot`, `playwright-cli generate-locator` y/o `playwright-cli eval`.

| # | Pantalla / Componente | Elemento UI | Evidencia del HTML/DOM Real (`snapshot` / `outerHTML`) | Locator Playwright Seleccionado | Nivel de Jerarquía | ¿Requiere Permiso XPath? |
| :-: | :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | `<Pantalla>` | `<Botón Confirmar>` | `<button type="submit" aria-label="Confirmar operación">Confirmar</button>` | `page.getByRole('button', { name: 'Confirmar operación' })` | **Nivel 1 (Semántico)** | No |
| 2 | `<Pantalla>` | `<Input Importe>` | `<input id="amount" data-testid="input-monto" placeholder="0,00" />` | `page.getByTestId('input-monto')` | **Nivel 2 (TestId)** | No |
| 3 | `<Pantalla>` | `<Fila Cheque #123>` | `<tr class="row-item"><td>123</td><td><button class="btn-action">Ver</button></td></tr>` | `page.locator('tr.row-item').filter({ hasText: '123' }).getByRole('button', { name: 'Ver' })` | **Nivel 3 (`.locator` + filter)** | No |

---

## 3. Checkpoint 3: Resumen de Ejecución y Auditoría (`audit_playwright_locators.js`)

- **Resultado Auditoría Estática (`audit_playwright_locators.js`):**
  - Locators Nivel 1 (Semánticos): `<N>`
  - Locators Nivel 2 (`getByTestId`): `<M>`
  - Locators Nivel 3 (`.locator()`): `<K>`
  - Violaciones XPath no autorizadas: `0`
  - Antipatrones (`waitForTimeout`, `networkidle`): `0`
- **Resultado de Ejecución (`npx playwright test`):** `<X passed / Y failed / Z fixme>`
