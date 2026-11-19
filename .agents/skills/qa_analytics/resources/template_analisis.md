# Reporte de Análisis Estático de Requerimiento: [ID_HU] - [Nombre de HU]

**ID Historia de Usuario:** `[ID_HU]` (Revisión ADO analizada: `rev [REV]`)  
**Nombre HU:** [Nombre de la Historia de Usuario]  
**Plataforma / Funcionalidad:** `[PLATAFORMA]` (`web` | `mobile`) / `[FUNCIONALIDAD]`  
**Área / Módulo:** `[AREA_PATH]`  
**Feature Padre:** `[ID_FEATURE]` - [Nombre Feature]  
**Fecha de Análisis:** [YYYY-MM-DD]  
**Versión del Análisis:** v1.0  
**Analista QA:** QA Analytics (ISTQB Sr.)  

---

## 1. Resumen Ejecutivo y Objetivo
- **Objetivo del Requerimiento:**  
  [Descripción clara y concisa de lo que busca lograr la funcionalidad/historia de usuario a nivel funcional y de negocio].

---

## 2. Alcance Técnico, Nivel de Pruebas y Matriz de Dispositivos / SO (`RULE[criterios_web_y_mobile.md]`)

### 2.1 Capas Arquitectónicas Impactadas
- [ ] **Front-End (`FE`):** [Especificar canal **`Web (WB)`** o **`Mobile (MB)`**. Detallar validaciones de UI/UX, componentes visuales, navegación, gestos/teclado].
- [ ] **BFF (`Backend For Frontend`):** [Especificar si aplica a **`BFF Web (WB)`**, **`BFF Mobile (MB)`** o **ambos**. Detallar orquestación, adaptación de payloads por canal, paginación, manejo de sesión/timeouts].
- [ ] **API (`Microservicios / Core` - Agnóstica al canal Web/Mobile):** [Detallar endpoints REST/SOAP, contratos de datos, códigos de estado HTTP y validaciones de negocio transversales sin distinción de plataforma].

### 2.2 Matriz Recomendada de Sistemas Operativos y Dispositivos (Para `FE` / `BFF`)
- **Sistemas Operativos Aplicables:** [Ej: `Android`, `iOS / iPadOS` en Mobile | `Windows`, `macOS` y navegadores en Web].
- **Tipos de Dispositivos Aplicables:** [Ej: `Smartphone`, `Tablet Android`, `iPad`, `Desktop`].
- **Observaciones de Distribución para `qa_designer`:** [Recomendación sobre qué flujos o validaciones visuales requieren pruebas diferenciadas por SO o dispositivo].

---

## 3. Desglose de Flujos

### 3.1 Flujos Principales (Happy Path)
1. **Paso 1:** [Paso inicial del usuario o sistema].
2. **Paso 2:** [Acción principal].
3. **Paso 3:** [Resultado esperado exitoso].

### 3.2 Flujos Alternos y Casos Borde (Edge Cases)
- **FA-01:** [Descripción del flujo alternativo 1].
- **FA-02:** [Descripción de condición de borde o estado alternativo].

---

## 4. Procesos Críticos y Reglas de Negocio (`RULE[reglas_y_restricciones_negocio.md]`)
- **PC-01:** [Regla de negocio, bimonetarismo `$` / `USD`, restricción de cheques vencidos, permisos o cálculo crítico].
- **PC-02:** [Transacción de alto riesgo, feature flag o integración crítica].

---

## 5. Escenarios de Error y Excepciones
- **EE-01:** [Manejo de errores por validación de datos de entrada].
- **EE-02:** [Fallos de red, ciclo background/foreground en mobile, timeouts o respuesta 5xx de BFF/API].
- **EE-03:** [Mensaje de error o Empty State mostrado al usuario y código de error técnico].

---

## 6. Matriz de Discrepancias Visuales y Funcionales (`RULE[triangulacion_visual_figma_ado.md]`)

| ID | Elemento / Pantalla | Definición Escrita en HU (`hu_<ID>.md`) | Imagen Adjunta en ADO (`attachments/`) | Prototipo Vigente en Figma (`figma/screens/`) | Categoría (`COPY` / `COMPONENTE` / `CAPTURA_OBSOLETA` / `ESTADO_NO_DOCUMENTADO`) | Fuente de Verdad / Resolución |
|---|---|---|---|---|---|---|
| D-01 | [Pantalla / Campo / Botón] | [Qué dice el texto/criterio de la HU] | [Qué muestra la imagen pegada en ADO] | [Qué muestra el frame actual de Figma] | [Categoría] | [Prevalece Figma / Prevalece HU / Aclarado con AFU] |

---

## 7. Matriz de Ambigüedades y Refinamientos por Rol (`RULE[no_suposiciones.md]`)

| ID | Rol | Ambigüedad / Pregunta de Refinamiento | Respuesta / Aclaración Obtenida | Estado |
|---|---|---|---|---|
| Q-01 | **AFU / UX** (Analista Funcional / UX) | [Duda sobre regla de negocio o discrepancia entre HU y Figma] | [Aclaración del AFU/UX] | Resuelto |
| Q-02 | **TL** (Líder Técnico) | [Duda sobre arquitectura, contrato API o BFF Web/Mobile] | [Aclaración del TL] | Resuelto |
| Q-03 | **PO** (Product Owner) | [Duda sobre alcance, feature flags, criterios de aceptación o prioridad] | [Aclaración del PO] | Resuelto |

---

## 8. Insumos Visuales e Información Adicional Analizada
- **Figma / Prototipos (`input/<plataforma>/<funcionalidad>/<ID_HU>/figma/`):** [Observaciones clave de las pantallas/diseños importados].
- **Capturas Adjuntas en ADO (`input/<plataforma>/<funcionalidad>/<ID_HU>/attachments/`):** [Notas sobre capturas embebidas en la HU o comentarios].
- **Información Adicional:** [Contexto técnico, de la Feature padre o de negocio considerado].

---

## 9. Conclusiones e Input para Siguientes Etapas
- **Impacto para Estimación (`qa_estimate`):** [Factores de complejidad, combinación de SO/Dispositivos o riesgos identificados].
- **Impacto para Diseño (`qa_designer`):** [Sugerencias para la cobertura de casos de prueba por capa (`FE`, `BFF`, `API`) y validaciones visuales confirmadas].
