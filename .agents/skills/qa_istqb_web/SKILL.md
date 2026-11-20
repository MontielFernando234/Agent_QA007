---
name: qa_istqb_web
description: "Especialista en ISTQB Web Application Testing para aplicaciones web bancarias (Desktop/Laptop en Windows y macOS, navegadores Chrome, Edge, Safari y Firefox). Guía a qa_analytics y qa_designer en el análisis y diseño de pruebas específicas de plataforma Web: grillas complejas, filtros, ordenamiento, paginación, navegación por teclado y foco, tooltips on-hover, sesión/pestañas/refresco F5, exportación de archivos (.xlsx/PDF) y consistencia E2E con Mobile Banking."
---

# Skill: QA ISTQB Web Application Testing (`qa_istqb_web`)

## 1. Propósito y Rol en el Ecosistema QA
Esta skill provee el marco especializado de **ISTQB para Testing de Aplicaciones Web** aplicado al dominio de Web Banking (Bancor Empresas / Individuos).

Es consumida obligatoriamente por:
- **[`qa_analytics`](../qa_analytics/SKILL.md)** durante el análisis estático y triangulación de Historias de Usuario de plataforma **`web` (`WB`)**.
- **[`qa_designer`](../qa_designer/SKILL.md)** durante el diseño de casos de prueba manuales para **`FE Web (WB)`** y **`BFF Web (WB)`**.

---

## 2. Estrategia Basada en Riesgos (ISTQB RBT) para Web

1. **Cero Duplicación por Navegador / SO Desktop:**
   - La suite funcional principal (**Core Web `FE - WB`**) valida el 100% de las reglas de negocio, flujos positivos/negativos, validaciones de formulario, permisos, errores y casos borde sobre el navegador estándar principal (ej. **Chrome / Edge en Windows**).
   - Solo se diseñan casos adicionales de compatibilidad cross-browser (`Safari en macOS`, `Firefox`, resoluciones *Responsive / Zoom 125%–150%*) para los flujos visuales o componentes con riesgo real de renderizado o descarga.
2. **Separación por Capa (`FE` vs. `BFF` vs. `API`):**
   - **`FE` (`FE - WB`):** Interfaz gráfica, componentes del Design System Web, grillas, modales/drawers, validaciones en cliente y experiencia en navegador.
   - **`BFF` (`BE - WB`):** Orquestación del BFF Web, paginación server-side, filtros combinados, sesión/tokens y manejo de errores HTTP.
   - **`API` (`BE - API`):** Contratos de microservicios core agnósticos al canal.

---

## 3. Checklist de Particularidades de Testing Web Bancario (8 Ejes ISTQB)

Al analizar (`qa_analytics`) o diseñar (`qa_designer`) una HU Web, evaluar sistemáticamente cuáles de los siguientes **8 ejes** aplican:

| # | Eje de Prueba Web | Qué Evaluar en Análisis (`qa_analytics`) y Diseño (`qa_designer`) |
| :---: | :--- | :--- |
| **1** | **Grillas, Tablas y Paginación Desktop** | Columnas visibles, alineación de importes bimonetarios (`$` vs. `USD`), badges de estado, ordenamiento ascendente/descendente por columna, paginación (selector de filas por página y cambio de página), *sticky header* al hacer scroll vertical/horizontal y selección múltiple mediante checkboxes (individuales y *"Seleccionar todos"* bloqueando cheques vencidos). |
| **2** | **Búsqueda, Filtros y Persistencia** | Combinación de barra de búsqueda con filtros avanzados (Drawers/modales de fecha, estado, moneda, CUIT/CUIL), chips de filtros activos, botón *"Limpiar/Restablecer"*, y persistencia o reseteo de filtros al ingresar al detalle de un registro y volver atrás. |
| **3** | **Interacción con Mouse, Foco y Teclado Físico** | Estados visuales `:hover`, `:focus`, `:active` y `:disabled`; *Tooltips informativos on-hover* (ej. sobre cheques vencidos grisados o íconos de estado); navegación por teclado con `Tab` / `Shift+Tab`, confirmación con `Enter`, cierre de modales/drawers con tecla `Esc` y atajos de copiado/pegado (`Ctrl+C` / `Ctrl+V`). |
| **4** | **Navegación del Browser,Historial y Múltiples Pestañas** | Comportamiento ante botón **"Atrás" / "Adelante"** del navegador, refresco de página (**`F5` / `Ctrl+R`**) en mitad de un flujo o consulta filtrada, acceso por URL directa (*deep linking* sin permisos), y apertura simultánea en **múltiples pestañas/ventanas** de la misma sesión. |
| **5** | **Sesión, Seguridad Web y Permisos** | Expiración de sesión por inactividad (redirección limpia a login sin exposición de datos en caché del navegador), validación de roles y permisos de Banca Empresas (*Operador*, *Firmante*, *Usuario sin permisos*), cambio de empresa en header y no exposición de datos sensibles en `localStorage`/`sessionStorage`/URL. |
| **6** | **Descarga y Exportación de Archivos (`.xlsx` / PDF)** | Descarga nativa en navegador de listados exportados a `.xlsx` y comprobantes PDF: nombre de archivo, respeto de los filtros activos en la grilla, formato de columnas/monedas (`$` y `USD`), manejo de listas vacías o volúmenes altos y bloqueo de doble descarga. |
| **7** | **Layout Responsive, Resoluciones y Zoom** | Visualización en resoluciones Desktop estándar (`1366x768`, `1920x1080`), redimensionamiento de ventana (*viewport resize*), zoom del navegador (`100%`, `125%`, `150%`) sin solapamiento de cabeceras fijas, tablas ni botones de acción. |
| **8** | **Consistencia E2E con Mobile Banking** | Cuando la funcionalidad existe en ambos canales (ej. ECHEQ, permisos de Backoffice, Agenda, Comprobantes), verificar que los permisos, estados y operaciones realizados en Web se reflejen de forma consistente en la Nueva App Mobile y viceversa. |
