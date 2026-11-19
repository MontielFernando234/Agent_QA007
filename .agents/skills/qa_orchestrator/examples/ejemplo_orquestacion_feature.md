# Ejemplo Completo de Orquestación: `qa_orchestrator` (Feature 44719 — Consulta ECHEQ Mobile)

Este documento muestra cómo el **QA Lead Sr (`qa_orchestrator`)** planifica, dimensiona e instancia a los agentes especialistas para abordar la **Feature `44719`** (*Valores - Mobile - Consulta ECHEQ Recibidos/ Emitidos/ Endosados/ Cedidos*) y su prototipo de Figma (*Echeq Mobile*).

---

## 1. Solicitud del Usuario
> *"Quiero que trabajemos sobre la Feature 44719 de Consulta ECHEQ Mobile y el Figma de la sección `1:19834`. Armemos el plan para analizar y diseñar los casos de las primeras 2 historias: 58664 y 58682."*

---

## 2. FASE 0: Diagnóstico y Propuesta del Plan Estratégico (Checkpoint 0)

El **QA Lead Sr (`qa_orchestrator`)**:
1. Consulta `input/index.json` y `memories/qa_orchestrator/memoria_qa_orchestrator.md`.
2. Detecta que ni la Feature `44719` ni las HUs `58664` y `58682` están aún persistidas en `input/`.
3. Presenta al usuario el **Plan Estratégico de Ejecución QA**:

> ### Plan Estratégico Propuesto por el QA Lead Sr (`qa_orchestrator`)
>
> **1. Estructura de Persistencia:**
> - **Plataforma:** `mobile`
> - **Funcionalidad:** `consulta_echeq` (`input/mobile/consulta_echeq/`)
>
> **2. Dimensionamiento e Instanciación del Equipo Agéntico:**
> | Nivel | Agente (`skill`) | Instancias | Estrategia de Ejecución |
> | :---: | :--- | :---: | :--- |
> | **Nivel 2A** | `qa_ado_importer` | **1 instancia** | Importará el contexto de la Feature `44719` y las HUs `58664` y `58682` (con sus comentarios y adjuntos de ADO). |
> | **Nivel 2B** | `qa_figma_importer` | **1 instancia** | Inspeccionará la sección `1:19834` de Figma y descargará los frames correspondientes a ambas HUs. |
> | **Nivel 3** | `qa_analytics` | **2 instancias en paralelo** | • `Analista #1` dedicado a la HU `58664` (Menú desplegable).<br>• `Analista #2` dedicado a la HU `58682` (Accesos ECHEQ).<br>Ambos triangularán Texto HU vs. Adjuntos ADO vs. Figma. |
> | **Nivel 4** | `qa_designer` | **2 instancias en paralelo** | • `Diseñador #1` para la suite funcional de `58664`.<br>• `Diseñador #2` para la suite funcional de `58682`. |
> | **Nivel 5** | `qa_ado_exporter` | **1 instancia** | Generará los archivos `casos_prueba_58664_ado_import.csv` y `casos_prueba_58682_ado_import.csv` (y exportará por API XML si lo solicitas). |
>
> **3. Parámetros Globales a Confirmar:**
> - **Release objetivo para casos de regresión/smoke:** ¿Utilizamos `[R19]` u otro release?
> - **Código de Área en nomenclatura:** ¿Confirmas `CSM_SIF`?
> - **Capas a cubrir:** ¿Diseñamos casos para `FE Mobile (MB)` y `BFF Mobile (MB)`?
> - **Distribución por SO y Dispositivos (`Android`/`iOS`, `Smartphone`/`Tablet`/`iPad`):**
>   - *Opción A:* Unificados bajo plataforma `Mobile`.
>   - *Opción B:* Casos separados para `Android` e `iOS`.
>   - *Opción C:* Casos separados por combinación de Dispositivo (`Smartphone`, `Tablet Android`, `iPad`).
>
> **¿Apruebas este plan y me confirmas los 4 parámetros globales para comenzar con el Nivel 2 (Ingesta)?**

---

## 3. Ejecución Coordinada por Niveles tras la Aprobación del Usuario

1. **Nivel 2 (Ingesta):**
   - El Orquestador ejecuta `qa_ado_importer` y `qa_figma_importer`, verifica en el **Checkpoint 1** los frames a descargar y deja todo indexado en `input/index.json`.
2. **Nivel 3 (Análisis en Paralelo):**
   - El Orquestador lanza los 2 subagentes `qa_analytics` apuntando a `input/mobile/consulta_echeq/58664/` y `input/mobile/consulta_echeq/58682/`.
   - Recolecta las discrepancias encontradas entre las capturas de ADO y los frames de Figma y las presenta en un único **Checkpoint 2 consolidado** al usuario.
3. **Nivel 4 (Diseño en Paralelo):**
   - Una vez aprobados `analisis_58664.md` y `analisis_58682.md`, el Orquestador lanza los 2 subagentes `qa_designer` inyectándoles los parámetros confirmados (`[R19]`, `CSM_SIF`, `Opción B: Android e iOS`).
   - Audita que las suites cumplan las 10 Rules y las presenta en el **Checkpoint 3**.
4. **Nivel 5 (Exportación):**
   - El Orquestador ejecuta `qa_ado_exporter` para generar los CSV de 18 columnas y actualiza `memories/qa_orchestrator/memoria_qa_orchestrator.md`.
