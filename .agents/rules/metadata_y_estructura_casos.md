---
trigger: model_decision
description: "Regla sobre las 11 categorías ISTQB, estructura multi-paso, metadata de casos de prueba, taxonomía de Tags en Azure DevOps, restricción de Sanity y formatos de salida (12 col, 18 col y XML). Activar en qa_designer y qa_ado_exporter."
---

# Regla: Metadata, Cobertura ISTQB y Estructura de Casos (`RULE[metadata_y_estructura_casos.md]`)

## 1. Cobertura de las 11 Categorías ISTQB y Atomicidad
1. **11 Categorías Obligatorias en `qa_designer`:** `1. Positivos`, `2. Negativos`, `3. Reglas de negocio`, `4. Navegación`, `5. Validaciones visuales`, `6. Permisos`, `7. Mensajes de error`, `8. Casos borde`, `9. Regresión`, `10. Sanity`, `11. Smoke`.
2. **Estructura Multi-Paso:** Todo caso de prueba debe ser atómico, independiente y tener **mínimo 2 pasos numerados** (Acción -> Resultado esperado).

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
   - **Smoke (`1 - Smoke`):** `qa_feature_echeq;qa_feature_echeq_smoke;qa_feature_echeq_regression;<TAG_PLATAFORMA>`
   - **Regresión (`3 - Regression`):** `qa_feature_echeq;qa_feature_echeq_regression;<TAG_PLATAFORMA>`

---

## 4. Formatos de Salida (`qa_designer` vs. `qa_ado_exporter`)

1. **Diseño Funcional (`qa_designer` -> `casos_prueba_<ID_HU>.csv`):** CSV RFC 4180 (comillas dobles `""`) con **12 columnas**: `"Nombre del caso de prueba","Área","Objetivo","Precondiciones","Datos","Pasos","Resultado esperado","Prioridad","Complejidad","Tipo de prueba","Camino de prueba","Tags"`.
2. **Importación Manual ADO (`qa_ado_exporter` -> `casos_prueba_<ID_HU>_ado_import.csv`):** CSV RFC 4180 con **18 columnas** (`ID,Work Item Type,Title,Description,BPrecondiciones,BCaminoPrueba,BTipoPrueba,BPlataformaPrueba,Test Step,Step Action,Step Expected,Area Path,Iteration Path,Assigned To,State,BPrioridadTC,BComplejidad,Tags`). Fila 1: solo metadatos; Filas 2+: solo pasos.
3. **Exportación API ADO (`qa_ado_exporter`):** Pasos en XML dentro de `Microsoft.VSTS.TCM.Steps` y vínculo `Microsoft.VSTS.Common.TestedBy-Reverse` a la HU padre.
