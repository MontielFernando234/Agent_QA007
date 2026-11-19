# Memoria Maestra del Orquestador QA (`qa_orchestrator`)

**Última Actualización:** `[YYYY-MM-DD HH:mm:ss]`  
**Regla de Tamaño:** Mantener solo contexto vivo del Sprint/Feature en curso (máx. ~150 líneas). El inventario técnico por HU vive en `input/index.json` y los cierres pasados se mueven a `memories/archive/`.

---

## 1. Acuerdos Globales Vigentes

| Parámetro | Valor Confirmado | Alcance |
| :--- | :--- | :--- |
| **Organización / Proyecto ADO** | `BancorDigital` / `Soluciones` | Global |
| **Release Activo (`[R<release>]`)** | `[Ej: R19]` | `[Feature / Sprint]` |
| **Código de Área en Nomenclatura** | `[Ej: CSM_SIF]` | `[Feature / Sprint]` |
| **Estrategia SO y Dispositivos** | `[Opción A / B / C]` | `[Feature / HU]` |
| **Alcance de Capas** | `[FE / BFF Web-Mobile / API]` | `[Feature / HU]` |

---

## 2. Trabajo Activo en Curso (HUs Pausadas o en Progreso)

| ID HU | Feature | Estado / Checkpoint Actual | Siguiente Acción |
| :--- | :--- | :--- | :--- |
| `[ID_HU]` | `[ID_FEAT]` | `[Ej: Checkpoint 2 - Esperando respuesta AFU]` | `[Retomar análisis / Pasar a Diseño]` |

---

## 3. Decisiones de Negocio y Discrepancias Resueltas (Sprint Actual)

- **`[ID_HU]`:** `[Resumen conciso de qué fuente prevaleció (Figma vs HU) o regla aclarada]`.

---

## 4. Bloqueos y Dudas Abiertas (`AFU/UX`, `TL`, `PO`)

- **`[ID_HU]` (`[Rol]`):** `[Duda abierta pendiente de confirmación]`.
