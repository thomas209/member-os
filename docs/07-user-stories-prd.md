# 07 — User Stories & Product Requirements

**Proyecto:** Member OS  
**Versión:** 1.0  
**Fecha de actualización:** 2026-06-25  
**Estado:** ✅ Aprobado

---

## Objetivo

Este documento define las historias de usuario y requerimientos de producto de Member OS v1.0.  
Cada historia representa una necesidad real de un usuario del sistema — cliente o operador.  
Las historias son la fuente de verdad para priorización y validación de funcionalidades.

---

## Storefront

### Historia 1 — Navegar el catálogo

> Como **cliente**  
> quiero **navegar el catálogo**  
> para **descubrir productos disponibles**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 1.1 | Muestra únicamente productos activos (`isActive: true`, `deletedAt: null`) | Funcional |
| 1.2 | Permite filtrar por categoría, marca y género | Funcional |
| 1.3 | Funciona correctamente en mobile (viewport < 768px) | UI/UX |
| 1.4 | Carga inicial en menos de 3 segundos (LCP < 3s en mobile) | Performance |
| 1.5 | Muestra imagen principal, nombre, marca y precio de cada producto | UI/UX |
| 1.6 | Indica visualmente cuando un producto no tiene stock disponible | Funcional |

---

### Historia 2 — Ver página de producto

> Como **cliente**  
> quiero **ver una página de producto**  
> para **decidir si quiero comprarlo**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 2.1 | Muestra galería de imágenes navegable | UI/UX |
| 2.2 | Muestra nombre del producto y marca | Funcional |
| 2.3 | Muestra precio vigente (salePrice si aplica, price si no) | Funcional |
| 2.4 | Muestra disponibilidad de stock por talle en tiempo real | Funcional |
| 2.5 | Muestra talles disponibles como selector interactivo | UI/UX |
| 2.6 | Talles sin stock aparecen deshabilitados visualmente | UI/UX |
| 2.7 | Muestra descripción del producto | Funcional |

---

### Historia 3 — Agregar al carrito

> Como **cliente**  
> quiero **agregar productos al carrito**  
> para **acumular lo que quiero comprar**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 3.1 | El cliente debe seleccionar un talle antes de agregar | Funcional |
| 3.2 | Valida stock disponible antes de agregar | Funcional |
| 3.3 | Actualiza el contador del carrito en el navbar | UI/UX |
| 3.4 | Muestra feedback visual al agregar (drawer o toast) | UI/UX |
| 3.5 | El carrito persiste entre sesiones (localStorage) | Funcional |
| 3.6 | Permite modificar cantidades y eliminar ítems | Funcional |

---

### Historia 4 — Completar una compra

> Como **cliente**  
> quiero **completar una compra**  
> para **recibir el producto que elegí**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 4.1 | Checkout en una sola página | UI/UX |
| 4.2 | No requiere registro para comprar | Funcional |
| 4.3 | Solicita: email, nombre, apellido, teléfono, dirección completa | Funcional |
| 4.4 | Validación inline de campos (no al enviar) | UI/UX |
| 4.5 | Permite aplicar cupón de descuento con feedback inmediato | Funcional |
| 4.6 | Muestra resumen del pedido con totales antes de pagar | UI/UX |
| 4.7 | Redirige a Mercado Pago para completar el pago | Funcional |
| 4.8 | El stock no se descuenta hasta confirmación del webhook de MP | Funcional |

---

### Historia 5 — Recibir confirmación del pedido

> Como **cliente**  
> quiero **recibir una confirmación**  
> para **saber que mi compra fue exitosa**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 5.1 | Muestra número de pedido legible (#0001, #0002...) | UI/UX |
| 5.2 | Muestra resumen de productos comprados | Funcional |
| 5.3 | Muestra total pagado | Funcional |
| 5.4 | Muestra próximos pasos (ej: "Te avisamos cuando tu pedido sea despachado") | UI/UX |
| 5.5 | La página es accesible solo con el ID del pedido (sin login) | Funcional |

---

## Backoffice

### Historia 6 — Crear y gestionar productos

> Como **operador**  
> quiero **crear y gestionar productos**  
> para **mantener el catálogo actualizado**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 6.1 | CRUD completo: crear, editar, archivar productos | Funcional |
| 6.2 | Subida de imágenes a Cloudinary desde el backoffice | Funcional |
| 6.3 | Gestión de variantes de talle con stock individual | Funcional |
| 6.4 | Campos: nombre, descripción, precio, costo, marca, categoría, género | Funcional |
| 6.5 | Soft delete — los productos archivados no se eliminan físicamente | Funcional |
| 6.6 | Los productos archivados no aparecen en el storefront | Funcional |
| 6.7 | Posibilidad de marcar producto como destacado (isFeatured) | Funcional |

---

### Historia 7 — Administrar pedidos

> Como **operador**  
> quiero **administrar pedidos**  
> para **gestionar la operación diaria**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 7.1 | Lista de pedidos con paginación | Funcional |
| 7.2 | Búsqueda por número de pedido o email del cliente | Funcional |
| 7.3 | Filtro por estado del pedido | Funcional |
| 7.4 | Cambio manual de estado respetando transiciones válidas | Funcional |
| 7.5 | Carga de número de seguimiento y método de envío | Funcional |
| 7.6 | Vista detalle del pedido con todos los ítems y datos del cliente | Funcional |

---

### Historia 8 — Administrar stock

> Como **operador**  
> quiero **administrar el inventario**  
> para **mantener el stock actualizado y auditado**.

**Criterios de aceptación**

| # | Criterio | Tipo |
|---|---|---|
| 8.1 | Vista de inventario por producto con stock por talle | Funcional |
| 8.2 | Ajuste manual de stock con campo de motivo obligatorio | Funcional |
| 8.3 | Todo ajuste genera un `StockMovement` con usuario, fecha y motivo | Funcional |
| 8.4 | Vista de historial de movimientos por variante | Funcional |
| 8.5 | El stock nunca puede quedar en valor negativo | Funcional |

---

## Restricciones de v1.0

Las siguientes funcionalidades están **explícitamente fuera del alcance** de esta versión.  
No deben ser implementadas aunque sean solicitadas durante el desarrollo.

| Funcionalidad | Motivo de exclusión |
|---|---|
| Wishlist | Fuera de alcance v1 |
| Reviews de productos | Fuera de alcance v1 |
| Programa de puntos | Fuera de alcance v1 |
| Sincronización Mercado Libre | Requiere queue de jobs — v2 |
| Integración automática Andreani | Requiere API Andreani — v2 |
| Login y registro de clientes | Opcional — v2 |
| Búsqueda full-text | Fuera de alcance v1 |
| Reportes de margen | Fuera de alcance v1 |
| Múltiples direcciones de envío | Fuera de alcance v1 |

---

*Este documento es la fuente de verdad sobre qué debe hacer el sistema desde la perspectiva del usuario. Cualquier funcionalidad no listada aquí debe ser evaluada y aprobada antes de incorporarse al desarrollo.*
