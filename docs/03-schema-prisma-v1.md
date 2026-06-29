# 03 — Schema de Base de Datos (Prisma v1.0)

**Proyecto:** Member OS  
**Versión:** 1.0  
**Fecha de actualización:** 2025-06-10  
**Estado:** ✅ Aprobado — Congelado para producción

---

## Resumen del modelo

| Entidad | Descripción |
|---|---|
| `AdminUser` | Usuarios del backoffice con control de acceso por rol |
| `Category` | Categorías de producto administrables desde el dashboard |
| `Brand` | Marcas administrables desde el dashboard |
| `Product` | Unidad comercial con identidad propia. Un color = un producto |
| `ProductVariant` | Talle específico de un producto con su propio stock |
| `ProductImage` | Imágenes del producto almacenadas en Cloudinary |
| `StockMovement` | Log de auditoría de todos los movimientos de inventario |
| `Customer` | Clientes registrados voluntariamente |
| `Coupon` | Cupones de descuento por porcentaje o monto fijo |
| `Order` | Pedido. Soporta clientes registrados e invitados |
| `OrderItem` | Línea de pedido con snapshots del momento de compra |

**Total: 11 modelos, 6 enums.**

---

## Diagrama de relaciones

```
AdminUser

Category (1) ──────────────────── (N) Product
Brand    (1) ──────────────────── (N) Product

Product (1) ── (N) ProductVariant
Product (1) ── (N) ProductImage
Product (1) ── (N) OrderItem

ProductVariant (1) ── (N) OrderItem
ProductVariant (1) ── (N) StockMovement

Customer (1) ── (N) Order

Coupon (1) ── (N) Order

Order (1) ── (N) OrderItem
Order (1) ── (N) StockMovement
```

---

## Schema completo

```prisma
// ============================================================
// Member OS — Prisma Schema v1.0 — FINAL
// ============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ADMIN
// ============================================================

model AdminUser {
  id            String     @id @default(cuid())
  email         String     @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          AdminRole  @default(OPERATOR)
  isActive      Boolean    @default(true)
  lastLoginAt   DateTime?

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([email])
  @@index([role, isActive])
}

// ============================================================
// TAXONOMY
// ============================================================

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  sortOrder Int       @default(0)
  isActive  Boolean   @default(true)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  products  Product[]

  @@index([slug])
  @@index([isActive, sortOrder])
}

model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  logoUrl   String?
  isActive  Boolean   @default(true)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  products  Product[]

  @@index([slug])
  @@index([isActive])
}

// ============================================================
// CATALOG
// ============================================================

model Product {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?

  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])

  brandId     String
  brand       Brand     @relation(fields: [brandId], references: [id])

  gender      Gender    @default(UNISEX)

  // Pricing
  price         Decimal   @db.Decimal(10, 2)
  comparePrice  Decimal?  @db.Decimal(10, 2)
  salePrice     Decimal?  @db.Decimal(10, 2)
  saleEndsAt    DateTime?

  // Cost (internal — never exposed to client)
  costPrice     Decimal?  @db.Decimal(10, 2)
  costCurrency  Currency  @default(ARS)

  // Visual identity
  colorName   String?
  colorHex    String?
  groupSlug   String?

  // SEO
  metaTitle       String?
  metaDescription String?

  // Logistics — prepared for Andreani
  weightGrams Int?
  lengthCm    Decimal?  @db.Decimal(6, 2)
  widthCm     Decimal?  @db.Decimal(6, 2)
  heightCm    Decimal?  @db.Decimal(6, 2)

  // Status
  isActive    Boolean   @default(true)
  isFeatured  Boolean   @default(false)

  // Soft delete
  deletedAt   DateTime?

  // Mercado Libre — prepared, not implemented
  mlProductId String?   @unique
  mlStatus    String?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  variants    ProductVariant[]
  images      ProductImage[]
  orderItems  OrderItem[]

  @@index([slug])
  @@index([categoryId])
  @@index([brandId])
  @@index([groupSlug])
  @@index([mlProductId])
  @@index([isActive, isFeatured, deletedAt])
  @@index([isActive, categoryId, deletedAt])
  @@index([isActive, brandId, deletedAt])
  @@index([deletedAt])
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  size      String
  sku       String?  @unique
  stock     Int      @default(0)
  sortOrder Int      @default(0)

  // Mercado Libre — prepared, not implemented
  mlVariantId String? @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orderItems     OrderItem[]
  stockMovements StockMovement[]

  @@unique([productId, size])
  @@index([productId, sortOrder])
  @@index([sku])
  @@index([stock])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  url       String
  altText   String?
  sortOrder Int     @default(0)
  isPrimary Boolean @default(false)

  createdAt DateTime @default(now())

  @@index([productId, sortOrder])
  @@index([productId, isPrimary])
}

// ============================================================
// INVENTORY
// ============================================================

model StockMovement {
  id        String         @id @default(cuid())
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])

  type          StockMovementType
  quantity      Int
  previousStock Int
  newStock      Int

  orderId   String?
  order     Order?  @relation(fields: [orderId], references: [id])

  note      String?
  createdBy String

  createdAt DateTime @default(now())

  @@index([variantId, createdAt])
  @@index([orderId])
  @@index([type])
  @@index([createdAt])
}

// ============================================================
// CUSTOMERS
// ============================================================

model Customer {
  id          String   @id @default(cuid())
  email       String   @unique
  phone       String?
  firstName   String
  lastName    String

  defaultAddress Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orders      Order[]

  @@index([email])
}

// ============================================================
// COUPONS
// ============================================================

model Coupon {
  id             String       @id @default(cuid())
  code           String       @unique
  type           DiscountType
  value          Decimal      @db.Decimal(10, 2)
  minOrderAmount Decimal?     @db.Decimal(10, 2)
  maxUses        Int?
  usedCount      Int          @default(0)
  validFrom      DateTime?
  validUntil     DateTime?
  isActive       Boolean      @default(true)

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  orders         Order[]

  @@index([code, isActive])
  @@index([validFrom, validUntil])
}

// ============================================================
// ORDERS
// ============================================================

model Order {
  id          String      @id @default(cuid())
  orderNumber Int         @unique @default(autoincrement())

  // Customer — nullable for guest checkout
  customerId  String?
  customer    Customer?   @relation(fields: [customerId], references: [id])

  // Guest checkout
  guestEmail      String?
  guestFirstName  String?
  guestLastName   String?
  guestPhone      String?

  status      OrderStatus @default(PENDING)

  // Pricing snapshot
  subtotal       Decimal @db.Decimal(10, 2)
  discountAmount Decimal @db.Decimal(10, 2) @default(0)
  shippingCost   Decimal @db.Decimal(10, 2) @default(0)
  total          Decimal @db.Decimal(10, 2)

  // Coupon
  couponId   String?
  coupon     Coupon?  @relation(fields: [couponId], references: [id])
  couponCode String?

  // Shipping address snapshot
  shippingAddress Json

  // Shipping — prepared for Andreani
  shippingMethod String?
  trackingNumber String?
  shippingLabel  String?

  // Payment — Mercado Pago
  paymentId     String? @unique
  paymentStatus String?

  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items          OrderItem[]
  stockMovements StockMovement[]

  @@index([orderNumber])
  @@index([customerId])
  @@index([guestEmail])
  @@index([status])
  @@index([paymentId])
  @@index([createdAt])
  @@index([status, createdAt])
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  order     Order  @relation(fields: [orderId], references: [id])

  productId String
  product   Product        @relation(fields: [productId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])

  // Snapshots
  productName  String
  productBrand String
  size         String
  unitPrice    Decimal @db.Decimal(10, 2)
  quantity     Int

  @@index([orderId])
  @@index([productId])
  @@index([variantId])
}

// ============================================================
// ENUMS
// ============================================================

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  OPERATOR
}

enum Gender {
  HOMBRE
  MUJER
  UNISEX
  NINO
}

enum Currency {
  ARS
  USD
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum StockMovementType {
  PURCHASE
  RESTOCK
  ADJUSTMENT
  RETURN
  CANCELLED
}
```

---

## Decisiones de diseño

### Identificadores
`cuid()` en todos los modelos excepto `orderNumber`. Los cuid son seguros para URLs, no son secuenciales ni predecibles. `orderNumber` es autoincremental porque es el identificador legible por el equipo y el cliente (#0001, #0002).

### Tipos monetarios
`Decimal(10, 2)` en todos los campos de precio y costo. Los tipos `Float` tienen errores de precisión en aritmética monetaria. Esta decisión es no negociable para un sistema de pagos.

### Variantes
`ProductVariant` representa exclusivamente el talle. El color es una propiedad de `Product` (`colorName`, `colorHex`), no una dimensión de variante. Cada color es un producto independiente. La constraint `@@unique([productId, size])` impide duplicados a nivel de base de datos.

### Agrupación de colores
`groupSlug` en `Product` permite agrupar colores del mismo modelo sin una entidad intermedia. "nike-air-force-1" como valor en cuatro productos los relaciona para mostrar swatches en la PDP.

### Soft delete
`deletedAt DateTime?` en `Product`. Los productos archivados mantienen su historial de pedidos intacto. Las queries del storefront siempre filtran `deletedAt: null`. Los índices compuestos incorporan este campo para eficiencia.

### Snapshots en OrderItem
`productName`, `productBrand`, `size` y `unitPrice` se copian al momento de la compra. Los cambios futuros en el producto no alteran el historial de pedidos.

### Guest checkout
`customerId` es nullable en `Order`. Los campos `guestEmail`, `guestFirstName`, `guestLastName`, `guestPhone` capturan los datos del comprador sin forzar registro. La constraint de negocio — que siempre exista `customerId` o `guestEmail` — se valida en la capa de aplicación.

### StockMovement
Es un log de auditoría, no un sistema de inventario complejo. Registra cada cambio de stock con su estado anterior y posterior. La relación con `Order` es opcional (nullable) para cubrir movimientos manuales. La relación `Order → StockMovement` es 1:N porque un pedido con tres productos genera tres movimientos independientes.

### Campos preparatorios
Los campos de Andreani (`weightGrams`, `lengthCm`, `widthCm`, `heightCm`, `shippingMethod`, `trackingNumber`, `shippingLabel`) y Mercado Libre (`mlProductId`, `mlStatus`, `mlVariantId`) están definidos pero no implementados. Su presencia desde v1.0 evita migraciones sobre tablas ya pobladas en producción.

### AdminUser independiente
`AdminUser` es una entidad separada de `Customer`. Los actores son distintos, los permisos son distintos, y mezclarlos en la misma tabla es un problema de seguridad. `passwordHash` almacena el hash bcrypt, nunca el password en texto plano.

### createdBy en StockMovement
Es un `String` y no una FK a `AdminUser`. Los movimientos automáticos del sistema (webhook de pago) no tienen un AdminUser asociado. Una FK nullable complicaría las queries sin aportar valor.

---

## Índices — criterio de diseño

Los índices compuestos están diseñados sobre los patrones de consulta más frecuentes del sistema:

| Índice | Consulta que optimiza |
|---|---|
| `[isActive, isFeatured, deletedAt]` | Productos destacados del home |
| `[isActive, categoryId, deletedAt]` | Catálogo filtrado por categoría |
| `[isActive, brandId, deletedAt]` | Catálogo filtrado por marca |
| `[productId, sortOrder]` en Variant | Talles ordenados en la PDP |
| `[productId, sortOrder]` en Image | Galería ordenada en la PDP |
| `[status, createdAt]` en Order | Dashboard de pedidos filtrado por estado |
| `[variantId, createdAt]` en StockMovement | Historial de stock por variante |
| `[code, isActive]` en Coupon | Validación de cupón en checkout |

---

## Comandos de referencia

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear y aplicar migración
npx prisma migrate dev --name nombre-de-la-migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Explorar la base de datos
npx prisma studio
```

---

*Schema congelado. Cualquier modificación requiere una nueva migración documentada y aprobación del equipo técnico.*
