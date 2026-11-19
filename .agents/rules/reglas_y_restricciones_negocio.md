---
trigger: model_decision
description: "Reglas y restricciones de negocio del dominio bancario Bancor y módulo ECHEQ/Valores (bimonetarismo ARS/USD, estados de cheques, perfiles/permisos, feature flags y trazabilidad). Activar en qa_analytics y qa_designer."
---

# Regla: Reglas y Restricciones de Negocio (`RULE[reglas_y_restricciones_negocio.md]`)

## 1. Bimonetarismo Estricto (Pesos ARS vs. Dólares USD)
- **Dólares:** Usar **siempre la sigla `USD`** (ej. `USD 5.000,00`). Prohibido usar `U$S` o `US$`.
- **Pesos Argentinos:** Usar el símbolo **`$`** (ej. `$ 50.000,00`).
- En funcionalidades bimonetarias, analizar y diseñar casos tanto en `$` como en `USD`.

---

## 2. Ciclo de Vida y Restricciones de ECHEQ (Valores)
- **Bandejas / Operaciones:** *Recibidos*, *Emitidos*, *Endosados*, *Cedidos*, *Depósito*, *Custodia*, *Solicitud de Aval*, *Descuento/Venta*.
- **Bloqueo de ECHEQs Vencidos:** Todo ECHEQ vencido debe visualizarse **grisado / deshabilitado** y **bloquear su selección individual o múltiple para acciones no permitidas**.
- **Estados Visuales:** Los estados (*Activo*, *Pendiente*, *Aceptado*, *Custodia*, *Depositado*, *Vencido*, *Rechazado*, *Anulado*) deben diferenciarse por color, badge y negrita según Figma.
- **Selección Múltiple:** Solo habilitar acciones masivas compatibles con el estado común de los cheques seleccionados.

---

## 3. Seguridad, Perfiles y Permisos
- **Autenticación:** Acceso exclusivo para usuarios con sesión activa.
- **Roles (Empresas vs. Individuos):** Contemplar perfiles *Operador*, *Firmante/Apoderado* (firma simple o conjunta) y **Usuario sin permisos** (debe mostrar el *Empty State de Usuario sin permisos* y ocultar acciones operativas).

---

## 4. Feature Flags, Contingencia y Trazabilidad
- **Feature Flags:** Si un acceso o acción depende de un Feature Flag (ej. *Endosar*, *Depositar*, *Vender*), cubrir escenarios con flag **`ON`** y **`OFF`**.
- **Contingencia:** Cubrir pantalla de *Estado de mejora/mantenimiento* y errores/timeouts de servicios externos (COELSA/Core).
- **Auditoría y Exportación:** Validar paso por *PreticketScreen*, emisión de comprobante con número de operación y exportación de listados a `.xlsx` respetando los filtros activos.
