# 02 — Arquitectura del Sistema

**Proyecto:** Member OS  
**Versión:** 1.0  
**Fecha de actualización:** 2025-06-10  
**Estado:** ✅ Aprobado

---

## Decisiones arquitectónicas fundacionales

### Monolito modular

Member OS v1.0 se construye como un monolito modular sobre Next.js 14. No se adopta arquitectura de microservicios en esta versión. Las razones son:

- Velocidad de desarrollo y deployment sin overhead operativo
- Debugging y observabilidad simples
- Suficiente para los primeros 100.000 usuarios
- Los microservicios se evalúan en v2 si el volumen lo justifica

### App Router de Next.js 14

Se utiliza App Router con Server Components por defecto. Los Client Components se limitan estrictamente a componentes con interactividad real (carrito, formularios, selectores).

### Repositorio único

Frontend, backend (API Routes) y scripts de administración conviven en el mismo repositorio. Sin monorepo ni Turborepo en v1.0.

---

## Stack tecnológico

| Tecnología | Rol | Justificación |
|---|---|---|
| Next.js 14 | Framework completo | SSR, API Routes, App Router en un solo runtime |
| TypeScript | Lenguaje | Errores en build, no en producción |
| PostgreSQL | Base de datos principal | Relacional, robusto, disponible en Supabase y Railway |
| Prisma | ORM | Schema como fuente de verdad, migraciones auditables |
| Tailwind CSS | Estilos | Velocidad de desarrollo y consistencia visual |
| Zustand | Estado global del carrito | Más simple que Redux, persiste en localStorage |
| Mercado Pago SDK | Pagos | Checkout Pro para lanzar rápido |
| NextAuth.js | Autenticación del backoffice | Session-based, integración nativa con Next.js |
| Cloudinary | Almacenamiento de imágenes | CDN + transformaciones on-the-fly por URL |
| Vercel | Deploy y hosting | Zero config con Next.js, previews por PR |
| Railway / Supabase | PostgreSQL hosted | Free tier suficiente para el lanzamiento |

---

## Módulos del sistema

### Storefront — interfaz del cliente

| Módulo | Descripción |
|---|---|
| Home | Editorial, productos destacados, hero |
| Catalog | Listado con filtros por categoría, marca y género |
| Product (PDP) | Galería, selector de talle, stock en tiempo real |
| Cart | Drawer lateral, persistencia en localStorage |
| Checkout | Datos de envío, validación de cupón, resumen |
| Payment | Redirección a Mercado Pago |
| Order Confirmation | Confirmación post-compra con número de pedido |

### Backoffice — interfaz del equipo operativo

| Módulo | Descripción |
|---|---|
| Auth | Login seguro con NextAuth.js |
| Products Dashboard | CRUD completo con upload de imágenes a Cloudinary |
| Orders Dashboard | Gestión de pedidos, cambio de estado, tracking |
| Customers DB | Historial de clientes, pedidos asociados |
| Categories & Brands | Alta y edición de taxonomía |
| Coupons | Creación y gestión de cupones de descuento |
| Stock | Vista de inventario y movimientos históricos |

---

## Estructura de carpetas

```
member-os/
│
├── app/
│   ├── (store)/                  # Layout del storefront
│   │   ├── page.tsx              # Home
│   │   ├── catalog/
│   │   │   └── page.tsx
│   │   ├── product/[slug]/
│   │   │   └── page.tsx
│   │   ├── cart/
│   │   │   └── page.tsx
│   │   └── checkout/
│   │       └── page.tsx
│   │
│   ├── (admin)/                  # Layout del backoffice
│   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── categories/
│   │   │   ├── brands/
│   │   │   ├── coupons/
│   │   │   └── stock/
│   │   └── login/
│   │
│   └── api/                      # API Routes
│       ├── products/
│       ├── orders/
│       ├── customers/
│       ├── checkout/
│       │   ├── route.ts
│       │   └── validate-coupon/
│       └── webhooks/
│           └── mercadopago/      # Fuente de verdad del pago
│
├── components/
│   ├── store/                    # Componentes del storefront
│   │   ├── ProductCard.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── SizeSelector.tsx
│   │   ├── CartDrawer.tsx
│   │   └── CheckoutForm.tsx
│   ├── admin/                    # Componentes del backoffice
│   │   ├── ProductForm.tsx
│   │   ├── VariantMatrix.tsx
│   │   ├── OrderTable.tsx
│   │   └── CustomerTable.tsx
│   └── ui/                       # Design system
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Badge.tsx
│
├── lib/
│   ├── prisma.ts                 # Cliente singleton de Prisma
│   ├── mercadopago.ts            # Config y helpers de MP
│   ├── auth.ts                   # Config de NextAuth
│   └── utils.ts
│
├── store/
│   └── cart.ts                   # Zustand — estado global del carrito
│
├── prisma/
│   ├── schema.prisma             # Fuente de verdad del DB
│   └── migrations/
│
└── types/
    └── index.ts
```

---

## Flujo de checkout y pagos

El webhook de Mercado Pago es la única fuente de verdad del estado del pago. El redirect del cliente es referencial, no confiable.

```
1. Cliente completa formulario de envío y valida cupón
          ↓
2. POST /api/checkout/create
   — Valida stock por variante
   — Crea Order en DB con status PENDING
   — Aplica descuento si hay cupón válido
   — Crea preferencia en Mercado Pago
   — Devuelve init_point
          ↓
3. Cliente es redirigido a Mercado Pago
          ↓
4. Mercado Pago procesa el pago
          ↓
5. POST /api/webhooks/mercadopago
   — Verifica autenticidad del webhook
   — Actualiza Order a PAID
   — Descuenta stock por variante
   — Registra StockMovement por cada OrderItem
   — Incrementa usedCount del cupón si aplica
   — Envía email de confirmación
          ↓
6. Cliente es redirigido a /order-confirmation/[id]
```

### Gestión de stock en el checkout

En v1.0 el stock se descuenta únicamente al confirmarse el pago vía webhook. Si dos clientes completan el checkout simultáneamente para el último talle disponible, el segundo recibe estado `payment_failed` y es notificado. Esta lógica es estándar para el volumen inicial.

La reserva de stock con timeout (campo `reservedStock` en `ProductVariant`) se implementa en v2.

---

## Almacenamiento de imágenes

Las imágenes nunca se guardan en la base de datos. El flujo es:

1. El admin sube la imagen desde el backoffice
2. El frontend envía el archivo directamente a Cloudinary (upload widget)
3. Cloudinary devuelve la URL
4. La URL se persiste en la entidad `ProductImage`

El servidor de Member OS nunca procesa archivos binarios.

Las transformaciones se aplican on-the-fly mediante parámetros de URL de Cloudinary:

| Uso | Transformación |
|---|---|
| Thumbnail en catálogo | `w_400,h_400,c_fill,f_webp` |
| Imagen principal en PDP | `w_1200,h_1500,c_fill,q_90,f_webp` |
| Imagen secundaria en PDP | `w_800,h_1000,c_fill,f_webp` |

---

## Autenticación

### Backoffice (AdminUser)
NextAuth.js con Credentials Provider. Sesiones server-side. Tres niveles de acceso:

| Rol | Permisos |
|---|---|
| `SUPER_ADMIN` | Acceso total, gestión de AdminUsers |
| `ADMIN` | Acceso total excepto gestión de AdminUsers |
| `OPERATOR` | Solo pedidos y stock |

### Storefront (Customer)
Las cuentas de clientes son opcionales. El checkout funciona sin registro. El email se captura siempre como mínimo para enviar confirmación. Post-compra se ofrece la creación de cuenta con un click.

---

## Integraciones futuras — preparación en v1.0

### Andreani
Los campos `weightGrams`, `lengthCm`, `widthCm`, `heightCm` en `Product` y los campos `shippingMethod`, `trackingNumber`, `shippingLabel` en `Order` están listos. En v1.0 se completan manualmente desde el backoffice. La automatización vía API de Andreani se implementa en v2.

### Mercado Libre
Los campos `mlProductId`, `mlStatus` en `Product` y `mlVariantId` en `ProductVariant` están listos. La sincronización bidireccional requiere una queue de jobs (BullMQ) que se implementa en v2.

---

## Entidades del sistema

```
AdminUser
Category
Brand
Product          → pertenece a Category y Brand
ProductVariant   → pertenece a Product
ProductImage     → pertenece a Product
StockMovement    → pertenece a ProductVariant, referencia Order (opcional)
Customer         → opcional, solo si el cliente se registra
Coupon
Order            → puede o no tener Customer (guest checkout)
OrderItem        → pertenece a Order, referencia Product y ProductVariant
```

**Total: 11 entidades.** El schema completo se documenta en `03-schema-prisma-v1.md`.

---

## Lo excluido de v1.0

Las siguientes funcionalidades están deliberadamente fuera del alcance para garantizar el lanzamiento:

- Sistema de login de clientes con sesión persistente
- Emails transaccionales elaborados (solo confirmación básica)
- Búsqueda full-text
- Reviews de productos
- Reserva de stock con timeout
- Sincronización automática con Mercado Libre
- Integración automática con Andreani
- Reportes de margen y rentabilidad
- Actualización automática de precios por tipo de cambio
- Subcategorías y jerarquía de categorías
- RBAC granular en el backoffice
