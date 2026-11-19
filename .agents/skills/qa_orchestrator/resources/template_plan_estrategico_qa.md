# Plan Estratégico de Ejecución QA — [Nombre de Feature / Requerimiento]

**Director de Orquestación:** `qa_orchestrator` (QA Lead Sr.)  
**Fecha de Planificación:** `[YYYY-MM-DD]`  
**Plataforma / Funcionalidad:** `[web | mobile]` / `[funcionalidad_slug]`  
**Feature Padre:** `[ID_FEATURE]` - `[Título Feature]`  

---

## 1. Diagnóstico de Estado Actual (`input/index.json` y `output/`)

| ID HU | Título de la User Story | Estado en `input/` (Rev ADO) | Insumos Figma (`figma/screens/`) | Análisis (`output/analysis/`) | Diseño (`output/testCases/`) | Exportación ADO |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `[ID_HU]` | `[Título HU]` | `[No importada / rev N]` | `[No / M pantallas]` | `[Pendiente / Completado]` | `[Pendiente / Completado]` | `[Pendiente / CSV / API]` |

---

## 2. Dimensionamiento e Instanciación del Equipo QA Agéntico (*Agent Sizing*)

| Nivel | Fase del Pipeline | Agente Especialista (`skill`) | Cantidad de Instancias | Modo de Ejecución | Asignación Específica |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Nivel 2A** | Ingesta de Requerimientos ADO | `qa_ado_importer` | `[1x]` | `[Secuencial / Lote]` | Extraer y versionar HUs `[IDs]` en `input/[plataforma]/[funcionalidad]/` |
| **Nivel 2B** | Ingesta de Prototipos Figma | `qa_figma_importer` | `[1x]` | `[Paralelo a 2A]` | Descargar frames de `[Sección Figma]` para HUs `[IDs]` |
| **Nivel 3** | Análisis Estático y Triangulación | `qa_analytics` | `[Nx]` | `[Paralelo / Secuencial]` | 1 instancia por HU para triangular Texto HU vs. Adjuntos ADO vs. Figma |
| **Nivel 4** | Diseño Funcional ISTQB | `qa_designer` | `[Nx]` | `[Paralelo / Secuencial]` | Diseño de 11 categorías aplicando acuerdos globales de Release, Área y Dispositivos |
| **Nivel 5** | Transformación y Exportación ADO | `qa_ado_exporter` | `[1x]` | `[Consolidado]` | Generar CSV 18 columnas RFC 4180 (y exportación XML por API si se solicita) |

---

## 3. Parámetros y Acuerdos Globales a Confirmar con el Usuario

1. **Plataforma y Ruta de Trabajo:** `input/[web|mobile]/[funcionalidad]/`
2. **Release Objetivo (para Regresión/Smoke):** `[Ej: R19 / Por confirmar]`
3. **Código de Área en Nomenclatura:** `[Por defecto: CSM_SIF / Por confirmar]`
4. **Capas Arquitectónicas a Cubrir:** `[FE (WB/MB) / BFF (WB y/o MB) / API (Agnóstica al canal)]`
5. **Estrategia de Distribución por Sistemas Operativos y Dispositivos:**
   - [ ] **Opción A:** Unificada por plataforma general (`Mobile` o `Web`).
   - [ ] **Opción B:** Separada por Sistema Operativo (`Android` vs. `iOS` / `Windows` vs. `macOS`).
   - [ ] **Opción C:** Separada por Tipo de Dispositivo + SO (`Smartphone`, `Tablet Android`, `iPad`, `Desktop`).
6. **Modo de Exportación Final (Nivel 5):**
   - [ ] **Solo Archivo CSV Manual (`_ado_import.csv`)** *(Por defecto)*
   - [ ] **Exportación Automatizada a Azure DevOps por API/MCP (XML Steps)** *(A demanda)*

---

## 4. Punto de Control Estratégico (Checkpoint 0)
> **Consulta al Usuario:** ¿Apruebas este Plan Estratégico, el dimensionamiento de agentes y los parámetros globales propuestos para iniciar la ejecución?
