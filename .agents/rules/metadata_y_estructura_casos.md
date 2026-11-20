---
trigger: model_decision
description: "Regla sobre las 11 categorías ISTQB, restricción anti-duplicidad entre casos funcionales y Smoke/Regresión, estructura multi-paso, metadata de casos de prueba, taxonomía de Tags en Azure DevOps (Smoke sin tag de regresión), restricción de Sanity, formatos de salida (12 col, 18 col y XML) y jerarquía de suites en ADO. Activar en qa_designer y qa_ado_exporter."
---

# Regla: Metadata, Cobertura ISTQB y Estructura de Casos (`RULE[metadata_y_estructura_casos.md]`)

## 1. Cobertura de las 11 Categorías ISTQB, Anti-Duplicidad y Atomicidad
1. **11 Categorías Obligatorias en `qa_designer`:** `1. Positivos`, `2. Negativos`, `3. Reglas de negocio`, `4. Navegación`, `5. Validaciones visuales`, `6. Permisos`, `7. Mensajes de error`, `8. Casos borde`, `9. Regresión`, `10. Sanity`, `11. Smoke`.
2. **Restricción Estricta Anti-Duplicidad (Funcional vs. Smoke / Regresión):**
   - **Prohibido duplicar escenarios** creando un caso funcional (`0 - Funcional`) y además un clon para `1 - Smoke` o `3 - Regression`.
   - En la primera ejecución se corre la suite completa; cuando posteriormente se deba ejecutar un ciclo de Smoke o Regresión, se filtran y corren únicamente los casos que ya están catalogados con ese tipo.
   - Por lo tanto, todo escenario que sea candidato a Smoke o Regresión se diseña **una única vez**, asignándole directamente `BTipoPrueba = 1 - Smoke` o `3 - Regression` y el prefijo **`[R<release>]`** en su título.
3. **Estructura Multi-Paso:** Todo caso de prueba debe ser atómico, independiente y tener **mínimo 2 pasos numerados** (Acción -> Resultado esperado).

---

## 2. Catálogo de Metadata para Azure DevOps

- **`BPrioridadTC` (`Prioridad`):** `1 - Alta` | `2 - Media` | `3 - Baja`
- **`BComplejidad` (`Complejidad`):** `1 - Alta` | `2 - Media` | `3 - Baja`
- **`BCaminoPrueba` (`Camino de prueba`):** `Positivo` | `Negativo`
- **`BTipoPrueba` (`Tipo de prueba`):** `0 - Funcional` | `1 - Smoke` | `3 - Regression`
- **`BPlataformaPrueba`:** `Web` | `Mobile`
- **`State`:** `Design`
- **`BPrecondiciones`:** Estado previo, rol, datos y SO/Dispositivo (en 1 sola línea separada por `; ` en el CSV de ADO).
- **Restricción Mandatoria sobre "Sanity":** En ADO no existe el valor `"Sanity"` en `BTipoPrueba`. Todo escenario Sanity debe catalogarse en metadata y tags como **`1 - Smoke`** o **`3 - Regression`** (prohibido usar tipo o tag `sanity`).

---

## 3. Taxonomía de `Tags` (Separados por `;`)

1. **Tag Base de Feature:** `qa_feature_echeq` (o `qa_feature_<modulo>`).
2. **Tag de Plataforma / Capa:**
   - Web (`FE` o `BFF` Web): `QA_plataforma_web`
   - Mobile (`FE` o `BFF` Mobile): `QA_plataforma_mobile`
   - API pura: `QA_capa_api`
3. **Combinaciones por Tipo:**
   - **Funcional (`0 - Funcional`):** `qa_feature_echeq;qa_feature_echeq_funcional;<TAG_PLATAFORMA>`
   - **Smoke (`1 - Smoke`):** `qa_feature_echeq;qa_feature_echeq_smoke;<TAG_PLATAFORMA>` *(NO agregar el tag `_regression` en los casos de Smoke, aunque sí mantienen el prefijo `[R<release>]` en el título).*
   - **Regresión (`3 - Regression`):** `qa_feature_echeq;qa_feature_echeq_regression;<TAG_PLATAFORMA>`

---

## 4. Formatos de Salida y Estructura de Suites en Azure DevOps (`qa_designer` vs. `qa_ado_exporter`)

1. **Diseño Funcional (`qa_designer`):** CSV RFC 4180 (comillas dobles `""`) con **12 columnas**: `"Nombre del caso de prueba","Área","Objetivo","Precondiciones","Datos","Pasos","Resultado esperado","Prioridad","Complejidad","Tipo de prueba","Camino de prueba","Tags"`.
   - En **Mobile (`FE - MB`)** bajo estrategia RBT se generan por defecto 3 archivos separados: `casos_prueba_<ID_HU>_CORE.csv`, `casos_prueba_<ID_HU>_SO_iOS.csv` y `casos_prueba_<ID_HU>_UI_TABLET.csv`.
2. **Importación Manual ADO (`qa_ado_exporter`):** CSV RFC 4180 con **18 columnas** (`ID,Work Item Type,Title,Description,BPrecondiciones,BCaminoPrueba,BTipoPrueba,BPlataformaPrueba,Test Step,Step Action,Step Expected,Area Path,Iteration Path,Assigned To,State,BPrioridadTC,BComplejidad,Tags`). Fila 1: solo metadatos; Filas 2+: solo pasos.
3. **Exportación API/MCP a Azure DevOps y Jerarquía de Suites por Defecto (`qa_ado_exporter`):**
   - **Consulta Obligatoria:** Siempre planificar y confirmar con el usuario el `planId`, el `suiteId` principal destino y la estructura de carpetas antes de crear suites o subir casos.
   - **Estructura de Carpetas por Defecto:**
     - Dentro de la Suite Principal indicada (`suiteId`), crear una **Suite Estática (`StaticTestSuite`)** con nombre: **`"HU <ID_HU> - <Nombre HU>"`**.
     - Dentro de la suite de la HU, crear las carpetas por capa diseñada:
       - **`FE`**:
         - En **Mobile (`MB`):** dentro de `FE`, crear las sub-suites **`CORE`**, **`iOS`** y **`UI_TABLET`** e importar en cada una sus casos correspondientes.
         - En **Web (`WB`):** importar los casos de Front-End directamente dentro de **`FE`** (salvo que el usuario solicite otra sub-estructura).
       - **`BFF`** *(si se diseñaron casos de BFF en Web o Mobile)*: importar allí los casos de BFF.
       - **`API`** *(si se diseñaron casos de API)*: importar allí los casos de API.
   - Todos los Test Cases creados deben incluir sus pasos en XML (`Microsoft.VSTS.TCM.Steps`) y el vínculo `Microsoft.VSTS.Common.TestedBy-Reverse` (`tests`) hacia la HU padre.
