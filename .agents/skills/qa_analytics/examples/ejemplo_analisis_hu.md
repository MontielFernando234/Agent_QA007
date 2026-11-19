# Ejemplo Completo de Análisis Estático: HU-1024 - Transferencia a Terceros con Validación Biométrica

Este archivo sirve como referencia práctica de cómo la skill `qa_analytics` procesa un requerimiento desde la recepción de la información hasta la generación del reporte final.

---

## 1. Entrada Recibida (ETAPA 1)

```text
ID de HU: HU-1024
Nombre HU: Transferencia a Terceros en Banca Móvil con Validación Biométrica
Área: Transferencias / Banca Personas

Descripción:
Como cliente de Banca Personas, quiero realizar transferencias de dinero a cuentas de terceros en otros bancos requiriendo validación biométrica facial cuando el monto supere los $500,000 CLP, para garantizar la seguridad de mis fondos.

Criterios de aceptación:
1. Si el monto es <= $500,000 CLP, la transferencia se autoriza mediante Digipass o SMS OTP.
2. Si el monto es > $500,000 CLP, la aplicación debe desplegar el flujo de reconocimiento facial biométrico.
3. Al completar exitosamente la biometría, la transferencia debe procesarse y retornar un comprobante con el número de transacción.
4. Si la biometría falla 3 veces consecutivas, el servicio debe bloquear temporalmente la opción de transferencia por 15 minutos.

Información adicional:
- Las transacciones consumen el servicio BFF /api/v1/transfers/execute.
- El proveedor biométrico es FaceAuth Cloud.
- Figma de referencia: [Figma Link: Transferencias v2.4 - Pantallas 04 a 09]
```

---

## 2. Preguntas de Refinamiento e Iteración con el Usuario (ETAPA 2)

Durante la revisión estática ISTQB, el agente identificó ambigüedades y formuló las siguientes preguntas:

| ID | Rol Destino | Pregunta Planteada | Respuesta / Aclaración Obtenida |
|---|---|---|---|
| Q-01 | **AFU** (Analista Funcional) | ¿El límite de $500,000 CLP se evalúa por transacción o es un acumulado diario? | Se evalúa **por transacción individual**. El acumulado diario global de la cuenta se valida en otra regla previamente existente. |
| Q-02 | **TL** (Líder Técnico) | Si el proveedor biométrico FaceAuth se encuentra fuera de servicio (timeout o HTTP 503), ¿cuál es el comportamiento esperado del BFF? | El BFF debe interceptar el timeout (5s), retornar código HTTP 504 con payload `{ "errorCode": "BIO_TIMEOUT" }` y la app debe mostrar la pantalla de fallback solicitando autorización presencial o reintento posterior. |
| Q-03 | **PO** (Product Owner) | ¿El bloqueo de 15 minutos por 3 fallos consecutivos aplica solo para la app móvil o también para Banca Web? | Aplica a nivel de **cuenta de usuario en el BFF**, por lo que bloquea transferencias mayores a $500,000 tanto en App Móvil como en Web durante 15 min. |

---

## 3. Reporte Final Generado (`output/analysis/HU-1024/analisis_HU-1024.md`)

```markdown
# Reporte de Análisis Estático: HU-1024 - Transferencia a Terceros con Validación Biométrica

**ID Historia de Usuario:** HU-1024  
**Nombre HU:** Transferencia a Terceros en Banca Móvil con Validación Biométrica  
**Área / Módulo:** Transferencias / Banca Personas  
**Fecha de Análisis:** 2026-07-30  
**Versión:** v1.0  
**Analista QA:** QA Analytics (ISTQB Sr.)  

---

## 1. Resumen Ejecutivo y Objetivo
Permitir a los usuarios realizar transferencias a terceros elevando la seguridad mediante autenticación biométrica facial para montos superiores a $500,000 CLP, reduciendo el riesgo de fraude.

---

## 2. Alcance Técnico, Nivel de Pruebas y Matriz de Dispositivos / SO
- [x] **Front-End (`FE` — `Mobile MB`):** Componente de integración con SDK FaceAuth, renderizado de pantallas de éxito/error, contador de reintentos y bloqueo en `Android` e `iOS` (`Smartphone`).
- [x] **BFF (`Backend For Frontend` — `Mobile MB` y `Web WB`):** Evaluación del umbral ($500,000 CLP), orquestación entre FaceAuth y Core de transferencias, persistencia del estado de bloqueo de 15 min por usuario.
- [x] **API (`Microservicios / Core` — Agnóstica a Web/Mobile):** Integración con servicio proveedor FaceAuth Cloud y servicio de Transferencias Core (contratos REST y códigos HTTP 423/504).

---

## 3. Desglose de Flujos

### 3.1 Flujos Principales (Happy Path)
1. **Monto <= $500k CLP:** Usuario ingresa datos -> Selecciona OTP/Digipass -> Valida código -> Transferencia aprobada -> Comprobante emitido.
2. **Monto > $500k CLP:** Usuario ingresa datos -> App invoca cámara -> Rostro validado por FaceAuth -> BFF autoriza -> Transferencia aprobada -> Comprobante emitido.

### 3.2 Flujos Alternos y Casos Borde
- **FA-01:** Reintento exitoso al 2º intento biométrico tras un 1º intento fallido por baja iluminación.
- **FA-02:** Cancelación voluntaria por parte del usuario en la pantalla de captura facial.

---

## 4. Procesos Críticos y Reglas de Negocio
- **PC-01:** Verificación estricta del umbral de $500,000 CLP por transacción en el BFF.
- **PC-02:** Bloqueo de 15 minutos en el BFF tras 3 fallos consecutivos en FaceAuth.

---

## 5. Escenarios de Error y Excepciones
- **EE-01:** 3er intento fallido de biometría -> BFF responde HTTP 423 Locked -> App muestra pantalla de bloqueo con timer de 15 minutos.
- **EE-02:** Caída o Timeout de FaceAuth Cloud -> BFF responde HTTP 504 (BIO_TIMEOUT) -> App muestra mensaje "Servicio biométrico no disponible temporalmente".
- **EE-03:** Fondos insuficientes en la cuenta al intentar autorizar -> Error previo a biometría.

---

## 6. Matriz de Discrepancias Visuales y Funcionales (HU vs. Adjuntos ADO vs. Figma)
| ID | Elemento | Definición Escrita HU | Imagen Adjunta ADO | Prototipo Figma | Categoría | Resolución |
|---|---|---|---|---|---|---|
| D-01 | Pantalla Bloqueo | Indica "bloqueo de 15 min" sin texto exacto | Muestra modal genérico | Muestra timer regresivo "14:59" y botón "Entendido" | `COPY` / `CAPTURA_OBSOLETA` | Prevalece Figma (confirmado por AFU/UX) |

---

## 7. Conclusiones e Input para Siguientes Etapas
- **qa_estimate:** Complejidad Alta por requerir mocks de FaceAuth Cloud, pruebas de simulación de timeout y escenarios de bloqueo con tiempo en Android e iOS.
- **qa_designer:** Diseñar casos de prueba cubriendo las 3 capas: FE Mobile (UI/UX + Smartphone Android/iOS), BFF (orquestación y temporizador) y API pura (contratos 423/504).
```
