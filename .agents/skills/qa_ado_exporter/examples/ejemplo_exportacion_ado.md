# Ejemplo Completo de Ejecución: `qa_ado_exporter` (Exportación Manual vs. API)

Este documento detalla el funcionamiento de la skill **`qa_ado_exporter`** en sus dos modos operativos a partir del diseño de casos de prueba generado por **`qa_designer`** para la **HU `58664`** (`MB - ECHEQ - MENU - Agregar opción Echeq en el menú desplegable`).

---

## 1. Entrada Recibida desde `qa_designer`
* **Archivo de Diseño Funcional:**  
  `output/testCases/consulta_echeq/58664/casos_prueba_58664.csv`
* **Contenido:** 10 casos de prueba funcionales con columnas de diseño:
  `"Nombre del caso de prueba","Área","Objetivo","Precondiciones","Datos","Pasos","Resultado esperado","Prioridad","Complejidad","Tipo de prueba","Camino de prueba","Tags"`

---

## 2. Modo 1: Generación de Archivo CSV para Carga Manual (Por Defecto)

### Comando Ejecutado:
```bash
node .agents/skills/qa_ado_exporter/scripts/convert_to_ado_csv.js \
  output/testCases/consulta_echeq/58664/casos_prueba_58664.csv \
  output/testCases/consulta_echeq/58664/casos_prueba_58664_ado_import.csv \
  "Soluciones\TRB-CashManagement\PRD-VALORES\SCT-Valores NVA_APP" \
  "Montiel, Fernando Javier" \
  "Soluciones\PI 7\PI7 - Sprint 4" \
  "Mobile"
```

### Resultado:
* Genera `output/testCases/consulta_echeq/58664/casos_prueba_58664_ado_import.csv` con las 18 columnas estándar de ADO en formato multi-paso RFC 4180.
* Este archivo queda listo para que el usuario o el equipo de QA lo cargue manualmente ingresando a **Azure DevOps > Test Plans > Import Test Cases from CSV**.

---

## 3. Modo 2: Exportación Automatizada por API/MCP (Estrictamente A Demanda)

### 3.1 Solicitud Explícita del Usuario
> *"Ya validé los casos de prueba de la HU 58664. Por favor expórtalos y créalos en Azure DevOps."*

### 3.2 Paso A: Preparación de Payloads y Conversión de Pasos a XML (`prepare`)
El agente ejecuta:
```bash
node .agents/skills/qa_ado_exporter/scripts/export_to_ado_api.js prepare \
  --csv output/testCases/consulta_echeq/58664/casos_prueba_58664.csv \
  --hu-id 58664 \
  --platform mobile \
  --output output/testCases/consulta_echeq/58664/ado_payloads_58664.json
```

**Ejemplo de XML generado para el campo `Microsoft.VSTS.TCM.Steps`:**
```xml
<steps id="0" last="2">
  <step id="1" type="ActionStep">
    <parameterizedString isformatted="true">Iniciar sesión con usuario Empresa en la nueva App Móvil y desplegar el menú principal.</parameterizedString>
    <parameterizedString isformatted="true">El sistema despliega el menú lateral correctamente mostrando las opciones disponibles.</parameterizedString>
  </step>
  <step id="2" type="ActionStep">
    <parameterizedString isformatted="true">Verificar la presencia y ubicación de la opción ECHEQ dentro del menú desplegable.</parameterizedString>
    <parameterizedString isformatted="true">La opción ECHEQ se visualiza visible, habilitada para selección y en la posición definida en el prototipo.</parameterizedString>
  </step>
</steps>
```

### 3.3 Punto de Control (Checkpoint Obligatorio - Human-in-the-Loop)
El agente presenta al usuario:
> **Confirmación de Creación en Azure DevOps (BancorDigital/Soluciones):**
> - **User Story Padre:** `#58664` (*MB - ECHEQ - MENU - Agregar opción Echeq en el menú desplegable*)
> - **Cantidad de Test Cases a Crear:** 10 casos
> - **Area Path:** `Soluciones\TRB-CashManagement\PRD-VALORES\SCT-Valores NVA_APP`
> - **Iteration Path:** `Soluciones\PI 7\PI7 - Sprint 4`
> - **Asignado a:** `Montiel, Fernando Javier`
> - **Formato de Pasos:** Serializados en XML (`Microsoft.VSTS.TCM.Steps`)
> - **Vínculo:** `Microsoft.VSTS.Common.TestedBy-Reverse` hacia `#58664`
>
> ¿Confirmas la creación de estos 10 casos de prueba en Azure DevOps?

### 3.4 Paso B: Ejecución de la Creación (`execute`)
Tras el OK del usuario, el agente ejecuta:
```bash
node .agents/skills/qa_ado_exporter/scripts/export_to_ado_api.js execute \
  --payloads output/testCases/consulta_echeq/58664/ado_payloads_58664.json \
  --hu-id 58664
```

### 3.5 Entregables Generados:
1. **Work Items creados en Azure DevOps:** (ej. `#224901`, `#224902`, ..., `#224910`).
2. **Reporte Resumen:** `output/testCases/consulta_echeq/58664/export_summary_58664.md` con la tabla de mapeo caso a caso y URLs directas en ADO.
3. **Índice Maestro Actualizado:** `input/index.json` actualiza la HU `58664` con la propiedad `test_case_ids: [224901, 224902, ...]`.
