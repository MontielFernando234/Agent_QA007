---
trigger: model_decision
description: "Criterios de análisis y diseño basados en riesgos (ISTQB RBT) según Plataforma (Web vs. Mobile), Sistemas Operativos (Android, iOS, Windows, macOS), Dispositivos (Smartphone, Tablet Android, iPad, Desktop), Capas (FE, BFF y API) y activación de las skills qa_istqb_mobile y qa_istqb_web. Activar en qa_analytics y qa_designer."
---

# Regla: Criterios Web vs. Mobile, Estrategia Basada en Riesgos (ISTQB RBT), SO, Dispositivos y Capas (`RULE[criterios_web_y_mobile.md]`)

## 1. Activación Obligatoria de Skills Especializadas ISTQB por Plataforma
- Cuando la Historia de Usuario o Feature sea de plataforma **Mobile (`MB`)**, `qa_analytics` y `qa_designer` **DEBEN leer y aplicar** la skill **[`qa_istqb_mobile`](../skills/qa_istqb_mobile/SKILL.md)**.
- Cuando la Historia de Usuario o Feature sea de plataforma **Web (`WB`)**, `qa_analytics` y `qa_designer` **DEBEN leer y aplicar** la skill **[`qa_istqb_web`](../skills/qa_istqb_web/SKILL.md)**.

---

## 2. Distinción Arquitectónica por Capa: `FE` vs. `BFF` vs. `API`

1. **Front-End (`FE` — Distingue `WB` o `MB`):** Evalúa UI/UX, componentes visuales, navegación, controles nativos, responsive y adaptación al dispositivo.
2. **Backend For Frontend (`BFF` — Distingue `WB` y/o `MB`):** **Sí puede ser específico de Web, de Mobile o compartido (`BE - WB` / `BE - MB`).** Evalúa orquestación, adaptación de payloads por canal, paginación móvil vs. grilla web y manejo de sesión/token del canal.
3. **API (`Microservicios / Core` — NO distingue Web vs. Mobile):** **Agnóstica al canal y al dispositivo (`BE - API`).** Evalúa contratos REST/SOAP transversales, verbos HTTP, esquemas JSON, reglas de negocio core y códigos de estado (`200`, `201`, `400`, `401`, `403`, `404`, `422`, `500`, `504`).

---

## 3. Estrategia Basada en Riesgos (ISTQB RBT) para Sistemas Operativos y Dispositivos

> **Prohibición de Clonación Masiva:**  
> Está prohibido duplicar indiscriminadamente toda la suite de casos funcionales por cada combinación de SO y dispositivo (`AS`, `iOSS`, `TA`, `iPad`), ya que no incrementa la cobertura sobre reglas de negocio y multiplica innecesariamente el esfuerzo.

### 3.1 Estrategia por Defecto en Mobile (`MB`) — 3 Suites RBT
Salvo que el usuario solicite otra distribución en el Checkpoint de Diseño, la suite de `FE Mobile` se estructura en **3 Suites separadas**:
1. **Suite 1 — `CORE` (Funcional y Reglas de Negocio — Agnóstica al Dispositivo):**
   - Valida todas las reglas de negocio, flujos positivos/negativos, permisos, mensajes de error, casos borde y consistencia E2E con Web si aplica.
   - Se ejecuta sobre el **Dispositivo/SO Principal (Tier 1)** acordado con el usuario (por defecto **`Android Smartphone`**).
   - Título sin sigla de dispositivo (`FE - MB - 001 - ...`).
2. **Suite 2 — `iOS` (Compatibilidad de SO Secundario y Diferenciales Nativos — `iOSS`):**
   - Incluye únicamente: **a)** un **Smoke** del flujo crítico en el SO secundario (`iOS Smartphone`) y **b)** pruebas específicas del SO que apliquen a la HU (gesto nativo *swipe back*, *Safe Area* / *Dynamic Island* / *Home Indicator*, teclado virtual nativo de iOS, ciclo *Background → Foreground*, *Dynamic Type*, biometría FaceID/TouchID, permisos nativos del SO, notificaciones push o descarga/compartición de archivos).
   - Título con sigla **`iOSS`** (`FE - MB - iOSS - 001 - ...`).
3. **Suite 3 — `UI_TABLET` (Presentación, Navegación y Compatibilidad de Pantalla Grande — `TA` e `iPad`):**
   - Incluye únicamente pruebas de **presentación visual (Figma), adaptación de tamaño/formato de pantalla, *Safe Area*, orientación *Portrait / Landscape* y navegación** en **`Tablet Android` (`TA`)** e **`iPad`**.
   - Título con sigla **`TA`** o **`iPad`** (`FE - MB - TA - 001 - ...` / `FE - MB - iPad - 001 - ...`).

### 3.2 Estrategia por Defecto en Web (`WB`)
- **Suite Core `FE - WB`:** Cubre el 100% de las reglas de negocio, grillas, filtros, navegación por teclado/mouse, sesión, errores y exportación `.xlsx`/PDF en Desktop estándar, agregando casos de compatibilidad cross-browser/responsive solo cuando exista riesgo visual o funcional específico.
- Si se diseñan capas adicionales, se separan en suites **`BFF`** (`BE - WB`) y/o **`API`** (`BE - API`).
