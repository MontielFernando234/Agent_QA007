---
trigger: model_decision
description: "Regla de nomenclatura estandarizada para títulos de casos de prueba manuales (formato estándar y candidato a regresión/smoke con Release, códigos de capa FE/BE, plataforma WB/MB/API, abreviaturas opcionales de dispositivo AS/iOSS/TA/iPad, código de área y slug de funcionalidad). Activar en qa_designer y qa_ado_exporter."
---

# Regla: Nomenclatura de Casos de Prueba (`RULE[nomenclatura_casos_prueba.md]`)

## 1. Formatos Oficiales

1. **Caso Funcional Estándar (`0 - Funcional` — Sin Release):**
   - **Suite Core Mobile (agnóstica al dispositivo), Web, BFF o API:**
     `[CAPA] - [PLATAFORMA] - [XXX] - [AREA] - [ID_HU] - [Funcionalidad] - [Título descriptivo del caso]`
   - **Suites Específicas de SO / Formato de Pantalla en Mobile (`AS` | `iOSS` | `TA` | `iPad`):**
     `[CAPA] - MB - [DISPOSITIVO] - [XXX] - [AREA] - [ID_HU] - [Funcionalidad] - [Título descriptivo del caso]`

2. **Caso Candidato a Regresión (`3 - Regression`) o Smoke (`1 - Smoke`) — Incluye `[R<release>]`:**
   - **Suite Core Mobile, Web, BFF o API:**
     `[R<release>] [CAPA] - [PLATAFORMA] - [XXX] - [AREA] - [ID_HU] - [Funcionalidad] - [Título descriptivo del caso]`
   - **Suites Específicas de SO / Formato de Pantalla en Mobile (`AS` | `iOSS` | `TA` | `iPad`):**
     `[R<release>] [CAPA] - MB - [DISPOSITIVO] - [XXX] - [AREA] - [ID_HU] - [Funcionalidad] - [Título descriptivo del caso]`

---

## 2. Componentes de la Nomenclatura

- **`[R<release>]`:** Release entre corchetes (ej. `[R22]`). Se incluye **tanto en los casos de Regresión (`3 - Regression`) como en los de Smoke (`1 - Smoke`)**. **Si no fue informado, consultar siempre al usuario.**
- **`[CAPA]`:**
  - `FE`: Front-End (UI/UX, navegación, validaciones en cliente).
  - `BE`: Back-End (para pruebas de **BFF** o de **API**).
- **`[PLATAFORMA]`:**
  - `WB`: Web (aplica a `FE` Web y a `BE` sobre BFF Web).
  - `MB`: Mobile (aplica a `FE` Mobile y a `BE` sobre BFF Mobile).
  - `API`: Para pruebas de **API pura** (agnósticas a Web/Mobile).
  - Otros: `CS` (Consola), `DS` (Desktop), `SP` (SAP).
- **`[DISPOSITIVO]` (Opcional en Mobile — Uso en Suites Específicas de SO y Formato de Pantalla):**
  Para evitar títulos excesivamente largos, cuando el caso pertenece a una suite específica de SO o formato de pantalla (o cuando el usuario solicita distinguir el dispositivo), se coloca la sigla inmediatamente después de `MB`:
  - `AS`: Android Smartphone
  - `iOSS`: iOS Smartphone
  - `TA`: Tablet Android
  - `iPad`: iPad
  *(En la Suite 1 `CORE` de Mobile, que valida reglas y funcionalidades de negocio independientes del SO/dispositivo, se omite esta sigla).*
- **`[XXX]`:** Contador secuencial de 3 dígitos (`001`, `002`...) que reinicia en cada HU (o en cada archivo/sub-suite separada).
- **`[AREA]`:** Por defecto **`CSM_SIF`**, pero **confirmar siempre con el usuario al iniciar el diseño**.
- **`[ID_HU]`:** ID numérico de la HU en ADO (ej. `78500`).
- **`[Funcionalidad]`:** Utilizar el nombre/slug de la funcionalidad o feature (ej. `consulta_echeq`). **Prohibido inventar nombres arbitrarios por HU** salvo indicación explícita del usuario.
- **`[Título descriptivo]`:** Qué valida el caso, incluyendo moneda (`$`/`USD`) o rol cuando aplique.

---

## 3. Ejemplos

- `[R22] FE - MB - 001 - CSM_SIF - 78500 - consulta_echeq - Smoke de acceso a consulta de ECHEQs con usuario Empresa con permiso habilitado`
- `FE - MB - 003 - CSM_SIF - 78500 - consulta_echeq - Validar bloqueo independiente del subflujo consulta sin restringir acceso a Pantalla Principal ECHEQ`
- `[R22] FE - MB - iOSS - 001 - CSM_SIF - 78500 - consulta_echeq - Smoke de acceso con permiso bloqueo sin permiso y retorno al inicio en iOS Smartphone`
- `FE - MB - TA - 001 - CSM_SIF - 78500 - consulta_echeq - Validar diseño Figma responsive Safe Area y orientación Portrait y Landscape en Tablet Android`
- `FE - MB - iPad - 001 - CSM_SIF - 78500 - consulta_echeq - Validar diseño Figma responsive Safe Area y orientación Portrait y Landscape en iPad`
- `FE - WB - 001 - CSM_SIF - 12541 - deposito_echeq - Verificar formato de importe en Dólares (USD)`
- `BE - MB - 001 - CSM_SIF - 62868 - consulta_echeq - Validar respuesta del BFF Mobile al filtrar cheques en USD`
- `BE - API - 001 - CSM_SIF - 62868 - consulta_echeq - Validar código HTTP 400 del microservicio ante CUIT inválido`
