# CLAUDE.md — Member OS

> Este archivo debe ser leído por Claude al inicio de cada sesión antes de generar cualquier código o tomar decisiones técnicas.

---

## Qué es este proyecto

**Member OS** es el sistema operativo comercial de Member Club.
Reemplaza a Tiendanube con una plataforma propia construida en Next.js + PostgreSQL + Prisma + Mercado Pago.

---

## Stack

| Tecnología | Rol |
|---|---|
| Next.js 16 | Framework completo (App Router) |
| TypeScript | Lenguaje |
| PostgreSQL | Base de datos principal |
| Prisma 5 | ORM |
| Tailwind CSS | Estilos |
| Zustand | Estado global del carrito |
| Mercado Pago | Pagos |
| NextAuth.js | Autenticación del backoffice |
| Cloudinary | Imágenes |
| Vercel | Deploy |
| Railway | PostgreSQL hosted |

---

## Ubicación del proyecto

```
/Users/thomascaronia/member-OS
```

---

## Reglas de desarrollo

- No generar soluciones sobreingenierizadas
- Proponer siempre la solución más simple que funcione
- Pensar como una startup que necesita lanzar rápido
- Cuando se solicite una funcionalidad grande, dividirla en fases
- Antes de generar código complejo, explicar arquitectura y decisiones técnicas
- Nunca asumir que un paso ya está hecho — verificar siempre
- Pedir ejecutar un solo comando a la vez y esperar respuesta antes de continuar

---

## Inspiración visual

Zara · Nike · Apple · Nude Project · Fear of God · StockX

**Feeling:** aplicación moderna y premium. No una tienda online tradicional.

---

## 06 — Reglas de Negocio

**Versión:** 1.0
**Fecha:** 2026-06-25
**Estado:** ✅ Aprobado

> En caso de conflicto entre implementación y este documento, prevalece este documento.

---

### Productos

**Regla principal**
Un color representa un producto independiente.

```
Nike Air Force 1 White → Product #1
Nike Air Force 1 Black → Product #2
```

Son dos registros distintos en `Product`. No son variantes del mismo producto.

**Variantes**
Las variantes representan únicamente talles.

```
40 · 41 · 42 · 43 · 44
```

Cada talle tiene:
- stock propio
- SKU propio
- historial de stock propio

---

### Stock

**Regla principal**
El stock nunca puede ser negativo.

**Descuento de stock**
El stock únicamente se descuenta cuando Mercado Pago confirma el pago mediante webhook.

❌ Nunca desde el frontend
❌ Nunca desde una URL de retorno
❌ Nunca desde JavaScript del cliente

**Ajustes manuales**
Los administradores pueden modificar stock manualmente.
Toda modificación debe generar un `StockMovement` con:
- usuario
- fecha
- motivo
- valor anterior
- valor nuevo

---

### Pedidos

**Estados válidos**

| Estado | Descripción |
|---|---|
| `PENDING` | Pedido creado |
| `PAID` | Pago confirmado por webhook |
| `PROCESSING` | En preparación |
| `SHIPPED` | Despachado |
| `DELIVERED` | Entregado |
| `CANCELLED` | Cancelado |
| `REFUNDED` | Reembolsado |

**Transiciones válidas**

```
PENDING → PAID
PAID → PROCESSING
PROCESSING → SHIPPED
SHIPPED → DELIVERED
PAID → REFUNDED
PROCESSING → CANCELLED
```

❌ No se permiten transiciones arbitrarias.

---

### Cupones

- Un pedido puede tener un único cupón
- Los cupones no son acumulables

**Validaciones obligatorias:**
- ✅ Activo
- ✅ Fecha inicio
- ✅ Fecha fin
- ✅ Cantidad máxima de usos
- ✅ Monto mínimo

---

### Clientes

**Invitados**
- La compra como invitado es obligatoria en v1
- No se requiere registro
- La ausencia de cuenta nunca debe impedir una compra

**Clientes registrados**
- Preparado para v2

---

### Precios

- El precio visible al cliente es siempre `Product.price`
- `salePrice` tiene prioridad cuando existe y está vigente

---

### Mercado Pago

- Mercado Pago es la **fuente oficial** del estado de pago
- Los redirects de éxito o fracaso son **informativos**
- Los redirects nunca modifican datos de negocio

---

### Eliminación de productos

- Los productos no se eliminan físicamente
- Se utiliza soft delete mediante `deletedAt`
- Las queries del storefront siempre filtran `deletedAt: null`

---

### Auditoría

Toda acción crítica debe ser auditable. Incluye:

- Cambios de stock → `StockMovement`
- Cambios de estado de pedido → registrar quién y cuándo
- Cambios de cupones
- Cambios de producto

---

## Estado actual del proyecto

| Capa | Estado |
|---|---|
| Next.js corriendo en localhost:3000 | ✅ |
| Estructura de carpetas creada | ✅ |
| PostgreSQL en Railway | ✅ |
| Schema Prisma con 11 modelos | ✅ |
| Migración `init` aplicada | ✅ |
| Prisma Client generado | ✅ |
| UI / Storefront | ❌ Pendiente |
| Autenticación backoffice | ❌ Pendiente |
| Integración Mercado Pago | ❌ Pendiente |

---

## Documentos del proyecto

| Archivo | Contenido |
|---|---|
| `docs/01-vision-producto.md` | Visión, objetivos, KPIs |
| `docs/02-arquitectura.md` | Stack, estructura, flujos |
| `docs/03-schema-prisma-v1.md` | Schema de base de datos |
| `docs/04-ux-ui.md` | UX y flujos de usuario |
| `docs/05-design-system.md` | Design system |
| `CLAUDE.md` | Este archivo — reglas de negocio y contexto |

