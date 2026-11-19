# Ejemplo Completo de Diseño de Casos de Prueba: HU 12541 - Depósito eCheq

Este documento ilustra la ejecución de la skill `qa_designer` tomando como insumo el reporte de análisis de `qa_analytics` (`output/analysis/deposito/12541/analisis_12541.md`).

> **Nota de Separación de Responsabilidades:** `qa_designer` entrega únicamente el diseño funcional (`casos_prueba_12541.csv` de 12 columnas y `casos_prueba_12541_clasificados.md`). La conversión a 18 columnas ADO y exportación XML por API son ejecutadas luego por `qa_ado_exporter`.

---

## 1. Entrada y Parámetros Confirmados (Checkpoint 1)

* **ID HU:** `12541` — Depósito eCheq en Banca Empresa Web
* **Plataforma / Funcionalidad:** `web` / `deposito`
* **Release confirmado:** `[R19]`
* **Código de Área confirmado:** `CSM_SIF`
* **Capas a cubrir:** `FE (WB)` y `BFF (WB)`
* **Estrategia de Distribución SO/Dispositivos:** Opción A (Unificada bajo plataforma `Web`)
* **Bimonetarismo:** Pesos ARS (`$`) y Dólares (`USD`)

---

## 2. Desglose de Escenarios por Cobertura (11 Categorías ISTQB)

1. ✅ **Escenarios Positivos:** Realizar depósito eCheq al día exitoso en Pesos ARS (`$`).
2. ❌ **Escenarios Negativos:** Intento de depósito con eCheq en estado vencido (grisado / bloqueado) o anulado.
3. 📜 **Reglas de Negocio:** Confirmación de depósito superando el límite operativo diario configurado.
4. 🧭 **Navegación:** Cancelación de la operación desde el Preticket retornando al listado sin procesar la orden.
5. 👁️ **Validaciones Visuales:** Formateo correcto en Dólares (`USD 5.000,00`) y renderizado del comprobante digital.
6. 🔒 **Validaciones de Permisos:** Usuario con perfil 'Consulta' visualizando el *Empty State de Usuario sin permisos*.
7. 💬 **Mensajes de Error:** Despliegue del mensaje exacto de error ante ID de cheque inválido.
8. ⚠️ **Casos Borde:** Depósito con importe mínimo permitido (`$ 0,01`) en el día de expiración.
9. 🔄 **Casos de Regresión:** Depósito eCheq de pago diferido con acreditación futura (Candidato a `[R19]`).
10. 🏥 **Casos Sanity:** Verificación de habilitación del botón 'Depositar' *(en metadata ADO se mapea a `1 - Smoke` o `3 - Regression`)*.
11. 🔥 **Casos Smoke:** Flujo de humo básico de acceso al formulario y selección de cuenta en `USD`.

---

## 3. Entregables Generados por `qa_designer`

### Archivo 1: Diseño Funcional Base (`output/testCases/deposito/12541/casos_prueba_12541.csv`)
```csv
"Nombre del caso de prueba","Área","Objetivo","Precondiciones","Datos","Pasos","Resultado esperado","Prioridad","Complejidad","Tipo de prueba","Camino de prueba","Tags"
"[R19] FE - WB - 001 - CSM_SIF - 12541 - Depósito - Smoke de acceso y carga de formulario en Dólares (USD)","CSM_SIF","Validar el flujo de humo de acceso al formulario de depósito en USD","1. Usuario autenticado en banca web.\n2. Cuenta activa en USD disponible.","USD 5.000,00","1. Navegar al menú 'eCheq' -> 'Depósito' y seleccionar cuenta en USD.\n2. Verificar que el formulario muestre los campos habilitados con la sigla USD.","Formulario renderizado correctamente con campos habilitados y moneda USD","1 - Alta","3 - Baja","1 - Smoke","Positivo","qa_feature_echeq;qa_feature_echeq_smoke;qa_feature_echeq_regression;QA_plataforma_web"
"[R19] FE - WB - 002 - CSM_SIF - 12541 - Depósito - Realizar depósito eCheq al día exitoso en Pesos ARS ($)","CSM_SIF","Verificar la ejecución end-to-end de depósito eCheq y generación de comprobante","1. Usuario autenticado con perfil Apoderado.\n2. eCheq en estado Emitido/Recibido.","Cheque ID: 44552211, Importe: $ 50.000,00","1. Seleccionar cuenta de acreditación, ingresar Cheque ID 44552211 e importe $ 50.000,00.\n2. Presionar 'Confirmar Depósito' en el Preticket y verificar comprobante.","Depósito registrado en estado Exitoso con número de operación y saldo actualizado","1 - Alta","2 - Media","3 - Regression","Positivo","qa_feature_echeq;qa_feature_echeq_regression;QA_plataforma_web"
```

### Archivo 2: Documentación Clasificada (`output/testCases/deposito/12541/casos_prueba_12541_clasificados.md`)
Documento Markdown organizado por categoría ISTQB y capa (`FE` / `BFF`) para lectura rápida del equipo.

### Archivo 3: Documento de Pendientes (`output/testCases/deposito/12541/dudas_pendientes_diseno.md`)
Registrado únicamente si quedaron aclaraciones abiertas para `AFU/UX`, `TL` o `PO`.
