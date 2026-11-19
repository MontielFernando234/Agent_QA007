---
trigger: model_decision
description: "Criterios de análisis y diseño según Plataforma (Web vs. Mobile), Sistemas Operativos (Android, iOS, Windows, macOS), Dispositivos (Smartphone, Tablet, iPad, Desktop) y Capas (FE, BFF y API). Activar en qa_analytics y qa_designer."
---

# Regla: Criterios Web vs. Mobile, SO, Dispositivos y Capas (`RULE[criterios_web_y_mobile.md]`)

## 1. Distinción Arquitectónica por Capa: `FE` vs. `BFF` vs. `API`

1. **Front-End (`FE` — Distingue `WB` o `MB`):** Evalúa UI/UX, componentes visuales, navegación, controles nativos, responsive y adaptación al dispositivo.
2. **Backend For Frontend (`BFF` — Distingue `WB` y/o `MB`):** **Sí puede ser específico de Web, de Mobile o compartido.** Evalúa orquestación, adaptación de payloads por canal, paginación móvil vs. grilla web y manejo de sesión/token del canal.
3. **API (`Microservicios / Core` — NO distingue Web vs. Mobile):** **Agnóstica al canal y al dispositivo.** Evalúa contratos REST/SOAP transversales, verbos HTTP, esquemas JSON, reglas de negocio core y códigos de estado (`200`, `201`, `400`, `401`, `403`, `404`, `422`, `500`, `504`).

---

## 2. Sistemas Operativos, Dispositivos y Distribución en ADO

1. **Combinaciones a contemplar:**
   - **Mobile (`MB`):** SO `Android` e `iOS / iPadOS` en dispositivos **`Smartphone`**, **`Tablet Android`** e **`iPad`** (orientación *Portrait* y *Landscape*).
   - **Web (`WB`):** SO `Windows` y `macOS` en **`Desktop` / `Laptop`** (Chrome, Edge, Safari, Firefox) y vistas *Responsive*.
2. **Consulta Obligatoria al Usuario (Impacto en Importación ADO):**
   Antes de diseñar la suite en `qa_designer`, **preguntar siempre al usuario cómo desea distribuir los casos por SO y Dispositivo**:
   - **Opción A:** Unificados por plataforma general (`Mobile` o `Web`).
   - **Opción B:** Casos separados por Sistema Operativo (`Android` vs. `iOS`).
   - **Opción C:** Casos separados por Dispositivo + SO (`Smartphone`, `Tablet Android`, `iPad`, `Desktop`).

---

## 3. Checklist Específico por Plataforma

### 3.1 En Mobile (`MB`)
- **Navegación y Gestos:** Menú lateral (`Sidebar`), `BottomNavbar`, carruseles (*swipe*), acordeones y botón/gesto nativo **"Atrás"** del SO (Android/iOS).
- **UI en Smartphone / Tablet / iPad:** *Safe Area*, rotación de pantalla, truncamiento de textos largos (`...`), **teclado virtual** (numérico vs. alfanumérico) sin ocultar el botón de confirmación, y reemplazo de *hover/tooltips* por elementos táctiles (`tap`).
- **Ciclo de Vida y Dispositivo:** App en *Background -> Foreground*, interrupción de red Wi-Fi/4G, y descarga/compartición nativa de archivos `.xlsx` o comprobantes.

### 3.2 En Web (`WB`)
- **Grillas y Filtros Desktop:** Ordenamiento, paginación, selección múltiple con checkboxes y persistencia de filtros al volver del detalle.
- **Teclado, Mouse y Sesión:** Navegación con `Tab`/`Enter`/`Esc`, *Tooltips on-hover*, descarga directa de `.xlsx` en navegador, refresco `F5` y múltiples pestañas.
