---
name: qa_istqb_mobile
description: "Especialista en ISTQB Mobile Application Testing (MAT) y estrategia Risk-Based Testing (RBT) para aplicaciones móviles bancarias (Android e iOS/iPadOS en Smartphone, Tablet Android e iPad). Guía a qa_analytics y qa_designer en el análisis de riesgos nativos, diferenciales entre Android e iOS, adaptación de formato/pantalla, conectividad, ciclo de vida de la app, permisos/biometría, consistencia E2E con Web Banking y estructuración en 3 suites optimizadas (CORE, iOS, UI_TABLET) sin duplicación innecesaria."
---

# Skill: QA ISTQB Mobile Application Testing (`qa_istqb_mobile`)

## 1. Propósito y Rol en el Ecosistema QA
Esta skill provee el marco especializado de **ISTQB Certified Tester — Mobile Application Testing (CT-MAT)** combinado con **Risk-Based Testing (RBT)** para el dominio de Mobile Banking (Nueva App Bancor).

Es consumida obligatoriamente por:
- **[`qa_analytics`](../qa_analytics/SKILL.md)** durante el análisis estático y triangulación de Historias de Usuario de plataforma **`mobile` (`MB`)**.
- **[`qa_designer`](../qa_designer/SKILL.md)** durante la planificación y diseño de casos de prueba manuales para **`FE Mobile (MB)`** (y `BFF Mobile` si aplica).

---

## 2. Estrategia ISTQB Risk-Based Testing (RBT) — Cero Duplicación por Dispositivo

> **Principio Fundamental:**  
> Clonar el 100% de los casos de prueba funcionales en cada combinación de SO y dispositivo (`AS`, `iOSS`, `TA`, `iPad`) multiplica por 4 el esfuerzo de ejecución y mantenimiento sin incrementar la cobertura sobre las reglas de negocio.  
> Todo diseño Mobile debe estructurarse por defecto en **3 Suites Basadas en Riesgos**:

### 2.1 Suite 1 — `CORE` (Funcional y Reglas de Negocio — Agnóstica al Dispositivo)
- **Objetivo:** Validar el 100% de las reglas de negocio, flujos positivos y negativos, validaciones de campos, permisos de usuario/empresa, estados de cheques, bimonetarismo (`$` / `USD`), Feature Flags, errores de servicios (`BFF`/`API`), casos borde y consistencia E2E con Web Banking.
- **Ejecución:** Se ejecuta una única vez sobre el **Dispositivo / SO Principal (Tier 1)** acordado para el Release (por defecto **`Android Smartphone`**).
- **Nomenclatura:** Sin sigla de dispositivo en el título:  
  `[R<release>] FE - MB - <XXX> - <AREA> - <ID_HU> - <funcionalidad> - <Título descriptivo>`

### 2.2 Suite 2 — `iOS` (Compatibilidad de SO Secundario y Diferenciales Nativos)
- **Objetivo:** Mitigar los riesgos específicos del SO secundario (**`iOS Smartphone` — `iOSS`**) sin re-ejecutar toda la lógica de negocio:
  1. **Smoke del flujo crítico (`1 - Smoke`):** Garantiza que el binario/build de iOS compila, integra la funcionalidad y navega de punta a punta.
  2. **Pruebas estrictamente diferenciales de iOS** aplicables a la HU (gesto *swipe back*, *Safe Area* / *Dynamic Island* / *Home Indicator*, teclado virtual nativo de iOS, ciclo *Background → Foreground*, *Dynamic Type*, *Share Sheet*, FaceID/TouchID, permisos del SO).
- **Nomenclatura:** Incluye la sigla **`iOSS`** después de `MB`:  
  `FE - MB - iOSS - <XXX> - <AREA> - <ID_HU> - <funcionalidad> - <Título descriptivo>`

### 2.3 Suite 3 — `UI_TABLET` (Presentación, Navegación y Compatibilidad de Pantalla Grande)
- **Objetivo:** Mitigar riesgos visuales, de maquetación responsive, *Safe Area*, orientación (*Portrait* y *Landscape*) y navegación en dispositivos de gran formato (**`Tablet Android` — `TA`** e **`iPad`**), sin repetir validaciones de reglas de negocio o contratos de backend.
- **Nomenclatura:** Incluye la sigla **`TA`** o **`iPad`** después de `MB`:  
  `FE - MB - TA - <XXX> - <AREA> - <ID_HU> - <funcionalidad> - <Título descriptivo>`  
  `FE - MB - iPad - <XXX> - <AREA> - <ID_HU> - <funcionalidad> - <Título descriptivo>`

---

## 3. Matriz de Particularidades y Diferenciales `Android` vs. `iOS / iPadOS`

Al analizar (`qa_analytics`) o diseñar (`qa_designer`) una HU Mobile, evaluar sistemáticamente cuáles de los siguientes **8 ejes ISTQB CT-MAT** aplican a la historia:

| # | Eje de Prueba Mobile | Particularidades en `Android` (`AS` / `TA`) | Particularidades en `iOS / iPadOS` (`iOSS` / `iPad`) | Qué Validar en la HU |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Navegación Nativa y Gestos** | Botón físico/virtual o gesto lateral "Atrás" del sistema; cierra teclados, drawers, modales y retrocede en el stack. | Gesto *swipe back* desde el borde izquierdo; en Bottom Sheets/modales predomina *swipe down* o botón `×`. | Ausencia de loops de navegación, no apilamiento de pantallas duplicadas (*double-tap*) y diferencia clara entre flecha `←` (pantalla anterior) vs. CTA `"Volver al inicio"` (Home). |
| **2** | **Geometría, Safe Area y Rotación** | *Punch-hole*/notch superior y barra inferior de 3 botones o barra gestual; alta fragmentación de densidades (dpi). | *Dynamic Island* / *Notch* superior y *Home Indicator* inferior. | Que headers, botones CTA inferiores (`"Aplicar"`, `"Volver al inicio"`) y `BottomNavbar` no se solapen con el *Home Indicator* o barra de sistema en *Portrait* y *Landscape*. |
| **3** | **Teclado Virtual y Entrada de Datos** | Teclado numérico incluye botón de acción (`Listo`/`Buscar`) y el botón "Atrás" cierra siempre el teclado. | El teclado numérico nativo de iOS **no incluye tecla de cierre** por defecto (requiere *tap* fuera o barra accesoria). | Tipo de teclado invocado (numérico vs. alfanumérico), que el teclado no oculte el campo ni el CTA, comportamiento al pegar (*paste*) texto con formato/guiones y límite de caracteres. |
| **4** | **Componentes UI y Scroll** | Material Design (*Date Picker* calendario, sombras por `elevation`, *overscroll*). | Cupertino (*Date Picker* rueda/inline, sombras por `shadow`, *scroll bounce* elástico). | Comportamiento de *Bottom Sheets*, *Drawers* de filtros, *Skeleton loading*, *scroll infinito* (paginación en bloques) y *pull-to-refresh*. |
| **5** | **Ciclo de Vida de la App e Interrupciones** | El SO puede destruir y recrear la *Activity* en segundo plano bajo presión de memoria; `FLAG_SECURE` en vistas sensibles. | Suspensión estricta en *Background → Foreground*, *App Switcher* con *blur* de privacidad bancaria y *Universal Links*. | Transición *Background → Foreground*, persistencia o refresco de estado/filtros, expiración de sesión (`401`) y refresco de permisos/Feature Flags al volver al Home. |
| **6** | **Conectividad y Red Móvil** | Conmutación Wi-Fi ↔ 4G/5G, Modo Avión, red inestable o alta latencia. | Conmutación Wi-Fi ↔ Datos celulares, Modo Avión y pérdida de paquetes. | Ausencia de *spinners* o *skeletons* infinitos, visualización del Empty State de error temporal (`"Ocurrió un error temporal"`) y recuperación al restaurar la red. |
| **7** | **Accesibilidad y Tipografía del SO** | Tamaño de fuente y zoom de pantalla independientes en Ajustes de Android. | *Dynamic Type* en Ajustes de iOS. | Que textos largos, importes (`$` / `USD`), badges (`4 pendientes`) y botones pill no se trunquen ni desborden la card con fuente ampliada. |
| **8** | **Permisos del SO, Biometría y Archivos** | Permisos en runtime, biometría/huella por fabricante, descarga directa a carpeta `Downloads` (`.xlsx` / PDF). | Diálogo único de permisos del SO, FaceID / TouchID, exportación vía *Share Sheet* / app Archivos y push APNs. | Solo activar casos en Suite 2 cuando la HU involucre descarga de comprobantes/`.xlsx`, biometría/token, cámara o notificaciones. |

---

## 4. Consistencia Cross-Channel / E2E con Web Banking

Cuando una funcionalidad Mobile comparte backend, Backoffice, permisos o reglas con **Web Banking**:
1. **En `qa_analytics`:** Identificar si los permisos, Feature Flags, estados de ECHEQ o agendas/comprobantes son compartidos con Web.
2. **En `qa_designer` (Suite 1 `CORE`):** Incluir al menos un caso de prueba de **consistencia Web ↔ Mobile** (ej. permiso habilitado/denegado en Backoffice Web impactando de forma idéntica en la App Mobile, o acción ejecutada en un canal reflejada en la consulta del otro canal).
