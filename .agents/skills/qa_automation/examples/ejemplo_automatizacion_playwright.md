# Ejemplo Completo de Uso: `qa_automation` en Sinergia con `playwright-cli`

## Contexto del Escenario
El usuario solicita:
> *"Automatiza los casos de Smoke y Camino Positivo de emisión de ECHEQ de la HU 564310 en nuestro repositorio web."*

---

## Paso 1: Descubrimiento de Casos y Auditoría Arquitectónica (ETAPA 1)

1. **Lectura de Casos Diseñados en el Proyecto:**
   - El agente busca en `output/testCases/echeq/564310/casos_prueba_564310.csv` y encuentra:
     - **TC-01:** `[R20] FE - WB - 001 - CSM_SIF - 564310 - Emisión ECHEQ - Emitir ECHEQ en pesos ($) exitosamente` (`Smoke`, `Positivo`).
2. **Auditoría de Arquitectura Existente:**
   - Ejecuta `node .agents/skills/qa_automation/scripts/inspect_playwright_project.js ./e2e-web`
   - Detecta que el proyecto destino ya utiliza:
     - `playwright.config.ts` con `testDir: './tests'`, `testIdAttribute: 'data-testid'`.
     - Patrón **Page Object Model + Custom Fixtures** en `src/pages/` y `src/fixtures/baseFixtures.ts`.
     - Ya existe `src/pages/EcheqMenuPage.ts`, pero falta la página del formulario de emisión.
3. **Checkpoint 1 Presentado al Usuario:**
   - El agente presenta el caso TC-01 a automatizar y propone reutilizar `baseFixtures.ts` y `EcheqMenuPage.ts`, consultando al usuario si está de acuerdo en agregar los locators de emisión dentro de `EcheqEmisionPage.ts` siguiendo el mismo patrón de clases de `src/pages/`.
   - El usuario confirma y habilita la sesión de prueba.

---

## Paso 2: Inspección del HTML/DOM Real con `playwright-cli` (ETAPA 2 — Cero Locators Supuestos)

El agente inicia el seed test en modo debug y se adjunta con `playwright-cli`:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/seed.spec.ts --debug=cli
playwright-cli attach tw-8f2a
playwright-cli resume
```

Navega hasta la pantalla de emisión e inspecciona el DOM real:

```bash
playwright-cli snapshot
```

Salida real del snapshot:
```yaml
- heading "Emitir nuevo ECHEQ" [level=1]
- combobox "Cuenta de débito" [ref=e12]
- textbox "CUIT / CUIL del beneficiario" [ref=e15]
- textbox "Importe en $" [ref=e18]
- generic [ref=e22]:
  - text: "Fecha de pago"
  - textbox [ref=e23]
- button "Continuar" [ref=e28]
```

El input `e23` no tiene nombre accesible directo en el snapshot. En lugar de adivinar o usar XPath, el agente inspecciona sus atributos HTML reales con `eval`:

```bash
playwright-cli --raw eval "el => ({ id: el.id, name: el.getAttribute('name'), testId: el.getAttribute('data-testid'), placeholder: el.getAttribute('placeholder'), html: el.outerHTML })" e23
```

Salida real del DOM:
```json
{
  "id": "paymentDateInput",
  "name": "fechaPago",
  "testId": "echeq-payment-date",
  "placeholder": "DD/MM/AAAA",
  "html": "<input id=\"paymentDateInput\" name=\"fechaPago\" data-testid=\"echeq-payment-date\" placeholder=\"DD/MM/AAAA\" class=\"form-control\" />"
}
```

### Tabla de Locators Presentada en el Checkpoint 2:

| Elemento UI | HTML / Snapshot Real | Locator Seleccionado | Nivel |
| :--- | :--- | :--- | :---: |
| Selector de Cuenta | `combobox "Cuenta de débito"` (`e12`) | `page.getByRole('combobox', { name: 'Cuenta de débito' })` | Nivel 1 (Semántico) |
| Input CUIT | `textbox "CUIT / CUIL del beneficiario"` (`e15`) | `page.getByLabel('CUIT / CUIL del beneficiario')` | Nivel 1 (Semántico) |
| Input Importe | `textbox "Importe en $"` (`e18`) | `page.getByLabel('Importe en $')` | Nivel 1 (Semántico) |
| Input Fecha de Pago | `<input data-testid="echeq-payment-date" placeholder="DD/MM/AAAA">` (`e23`) | `page.getByTestId('echeq-payment-date')` | Nivel 2 (`getByTestId`) |
| Botón Continuar | `button "Continuar"` (`e28`) | `page.getByRole('button', { name: 'Continuar' })` | Nivel 1 (Semántico) |

---

## Paso 3: Implementación Siguiendo la Arquitectura del Proyecto y Auditoría (ETAPAS 3 y 4)

Una vez aprobado el Checkpoint 2, el agente escribe el Page Object y el Spec respetando las convenciones del proyecto, ejecuta el auditor estático:

```bash
node .agents/skills/qa_automation/scripts/audit_playwright_locators.js ./e2e-web/tests/echeq/emision.spec.ts
```

Y finalmente corre el test en Playwright:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/echeq/emision.spec.ts
```
