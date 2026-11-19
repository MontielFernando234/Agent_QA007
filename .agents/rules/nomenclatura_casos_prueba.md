---
trigger: model_decision
description: "Regla de nomenclatura estandarizada para títulos de casos de prueba manuales (formato estándar y candidato a regresión con Release, códigos de capa FE/BE/BFF/API, plataforma WB/MB y código de área). Activar en qa_designer y qa_ado_exporter."
---

# Regla: Nomenclatura de Casos de Prueba (`RULE[nomenclatura_casos_prueba.md]`)

## 1. Formatos Oficiales

1. **Caso Funcional Estándar (No candidato a Regresión):**
   `[CAPA] - [PLATAFORMA] - [XXX] - [AREA] - [ID_HU] - [Nombre Corto HU] - [Título descriptivo del caso]`
2. **Caso Candidato a Regresión / Smoke (Incluye Release):**
   `[R<release>] [CAPA] - [PLATAFORMA] - [XXX] - [AREA] - [ID_HU] - [Nombre Corto HU] - [Título descriptivo del caso]`

---

## 2. Componentes de la Nomenclatura

- **`[R<release>]`:** Release entre corchetes (ej. `[R19]`). Solo en casos candidatos a Regresión/Smoke. **Si no fue informado, consultar siempre al usuario.**
- **`[CAPA]`:**
  - `FE`: Front-End (UI/UX, navegación, validaciones en cliente).
  - `BE`: Back-End (para pruebas de **BFF** o de **API**).
- **`[PLATAFORMA]`:**
  - `WB`: Web (aplica a `FE` Web y a `BE` sobre BFF Web).
  - `MB`: Mobile (aplica a `FE` Mobile y a `BE` sobre BFF Mobile).
  - `API`: Para pruebas de **API pura** (agnósticas a Web/Mobile).
  - Otros: `CS` (Consola), `DS` (Desktop), `SP` (SAP).
- **`[XXX]`:** Contador secuencial de 3 dígitos (`001`, `002`...) que reinicia en cada HU.
- **`[AREA]`:** Por defecto **`CSM_SIF`**, pero **confirmar siempre con el usuario al iniciar el diseño**.
- **`[ID_HU]`:** ID numérico de la HU en ADO (ej. `58664`).
- **`[Nombre Corto HU]`:** Nombre funcional sintético de 2 a 4 palabras (ej. `Menú ECHEQ`, `Consulta ECHEQ`).
- **`[Título descriptivo]`:** Qué valida el caso, incluyendo moneda (`$`/`USD`), rol y, si se distribuyó por SO/Dispositivo, el destino (ej. `en Android Smartphone`, `en iOS iPad`).

---

## 3. Ejemplos

- `FE - WB - 001 - CSM_SIF - 12541 - Depósito - Verificar formato de importe en Dólares (USD)`
- `[R19] FE - MB - 002 - CSM_SIF - 58664 - Menú ECHEQ - Smoke de acceso a opción ECHEQ en menú desplegable en Android Smartphone`
- `BE - MB - 005 - CSM_SIF - 62868 - Consulta ECHEQ - Validar respuesta del BFF Mobile al filtrar cheques en USD`
- `BE - API - 008 - CSM_SIF - 62868 - Consulta ECHEQ - Validar código HTTP 400 del microservicio ante CUIT inválido`
