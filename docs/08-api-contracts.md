# 08 — API Contracts

**Proyecto:** Member OS  
**Versión:** 1.0  
**Fecha de actualización:** 2026-06-25  
**Estado:** ✅ Aprobado

---

## Convenciones generales

- Todos los endpoints devuelven `Content-Type: application/json`
- Errores siguen el formato `{ "error": "mensaje legible" }`
- Los endpoints `/api/admin/*` requieren sesión activa de NextAuth
- Los endpoints públicos no requieren autenticación
- Paginación con `?page=1&limit=20` donde aplique

---

## Storefront — Endpoints públicos

---

### GET /api/products

Obtiene el listado de productos activos para el catálogo.

**Query params opcionales**

| Param | Tipo | Descripción |
|---|---|---|
| `category` | string | Slug de categoría |
| `brand` | string | Slug de marca |
| `gender` | string | `HOMBRE`, `MUJER`, `UNISEX`, `NINO` |
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 20) |

**Filtros aplicados automáticamente**
- `isActive: true`
- `deletedAt: null`

**Response 200**

```json
{
  "products": [
    {
      "id": "cuid",
      "name": "Nike Air Force 1",
      "slug": "nike-air-force-1-white",
      "brand": {
        "name": "Nike",
        "slug": "nike"
      },
      "category": {
        "name": "Zapatillas",
        "slug": "zapatillas"
      },
      "gender": "UNISEX",
      "price": "89999.00",
      "comparePrice": "99999.00",
      "salePrice": null,
      "colorName": "White",
      "colorHex": "#FFFFFF",
      "primaryImage": "https://res.cloudinary.com/...",
      "hasStock": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3
  }
}
```

**Response 500**

```json
{ "error": "Error al obtener productos" }
```

---

### GET /api/products/[slug]

Obtiene el detalle completo de un producto para la PDP.

**Params**

| Param | Tipo | Descripción |
|---|---|---|
| `slug` | string | Slug único del producto |

**Response 200**

```json
{
  "product": {
    "id": "cuid",
    "name": "Nike Air Force 1",
    "slug": "nike-air-force-1-white",
    "description": "...",
    "brand": {
      "name": "Nike",
      "slug": "nike"
    },
    "category": {
      "name": "Zapatillas",
      "slug": "zapatillas"
    },
    "gender": "UNISEX",
    "price": "89999.00",
    "comparePrice": "99999.00",
    "salePrice": null,
    "saleEndsAt": null,
    "colorName": "White",
    "colorHex": "#FFFFFF",
    "groupSlug": "nike-air-force-1",
    "metaTitle": "Nike Air Force 1 White | Member Club",
    "metaDescription": "...",
    "variants": [
      {
        "id": "cuid",
        "size": "42",
        "sku": "NAF1-W-42",
        "stock": 3,
        "sortOrder": 0
      }
    ],
    "images": [
      {
        "id": "cuid",
        "url": "https://res.cloudinary.com/...",
        "altText": "Nike Air Force 1 White - vista lateral",
        "sortOrder": 0,
        "isPrimary": true
      }
    ],
    "colorVariants": [
      {
        "slug": "nike-air-force-1-black",
        "colorName": "Black",
        "colorHex": "#000000",
        "primaryImage": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

**Response 404**

```json
{ "error": "Producto no encontrado" }
```

---

## Checkout

---

### POST /api/checkout

Crea una orden y devuelve la URL de pago de Mercado Pago.

**Reglas de negocio aplicadas**
- Valida stock por variante antes de crear la orden
- Crea la orden con estado `PENDING`
- Aplica descuento si el cupón es válido
- Crea la preferencia en Mercado Pago
- **No descuenta stock** — eso ocurre solo en el webhook

**Request**

```json
{
  "items": [
    {
      "variantId": "cuid",
      "productId": "cuid",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "firstName": "Thomas",
    "lastName": "Caronia",
    "email": "thomas@example.com",
    "phone": "1122334455",
    "street": "Av. Corrientes",
    "number": "1234",
    "floor": "3B",
    "city": "Buenos Aires",
    "province": "Buenos Aires",
    "postalCode": "1043"
  },
  "couponCode": "WELCOME10"
}
```

**Response 200**

```json
{
  "orderId": "cuid",
  "orderNumber": 1,
  "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

**Response 400 — Stock insuficiente**

```json
{
  "error": "Stock insuficiente",
  "detail": {
    "variantId": "cuid",
    "productName": "Nike Air Force 1",
    "size": "42",
    "requested": 2,
    "available": 1
  }
}
```

**Response 400 — Cupón inválido**

```json
{ "error": "Cupón inválido o expirado" }
```

---

### POST /api/checkout/validate-coupon

Valida un cupón antes de aplicarlo en el checkout.

**Request**

```json
{
  "code": "WELCOME10",
  "orderAmount": 89999
}
```

**Response 200 — Válido**

```json
{
  "valid": true,
  "code": "WELCOME10",
  "type": "PERCENTAGE",
  "value": 10,
  "discountAmount": 8999.90,
  "minOrderAmount": null
}
```

**Response 200 — Inválido**

```json
{
  "valid": false,
  "reason": "Cupón expirado"
}
```

Valores posibles de `reason`:
- `"Cupón no encontrado"`
- `"Cupón inactivo"`
- `"Cupón expirado"`
- `"Cupón aún no vigente"`
- `"Cupón sin usos disponibles"`
- `"Monto mínimo no alcanzado"`

---

## Webhooks

---

### POST /api/webhooks/mercadopago

Recibe notificaciones de Mercado Pago. Es la **única fuente de verdad** del estado de pago.

**Responsabilidades — en orden**

1. Verificar autenticidad de la firma del webhook
2. Consultar el estado del pago a la API de MP
3. Si el pago es aprobado:
   - Actualizar `Order.status` → `PAID`
   - Actualizar `Order.paymentId` y `Order.paymentStatus`
   - Descontar stock por cada `OrderItem`
   - Registrar `StockMovement` por cada variante
   - Incrementar `Coupon.usedCount` si aplica
4. Si el pago es rechazado:
   - Actualizar `Order.status` → `CANCELLED`
   - Actualizar `Order.paymentStatus`
5. Responder `200 OK` siempre (para que MP no reintente)

**Request (enviado por Mercado Pago)**

```json
{
  "action": "payment.updated",
  "data": {
    "id": "123456789"
  }
}
```

**Response 200**

```json
{ "received": true }
```

> ⚠️ Este endpoint nunca debe devolver 4xx o 5xx salvo error de autenticidad. Mercado Pago reintenta si recibe error.

---

## Backoffice — Endpoints admin

> Todos requieren sesión activa. Sin sesión devuelven `401 Unauthorized`.

---

### GET /api/admin/orders

Lista pedidos con filtros y paginación.

**Query params**

| Param | Tipo | Descripción |
|---|---|---|
| `status` | string | Filtrar por estado |
| `search` | string | Buscar por número de pedido o email |
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 20) |

**Response 200**

```json
{
  "orders": [
    {
      "id": "cuid",
      "orderNumber": 1,
      "status": "PAID",
      "total": "89999.00",
      "guestEmail": "thomas@example.com",
      "guestFirstName": "Thomas",
      "guestLastName": "Caronia",
      "itemCount": 2,
      "createdAt": "2026-06-25T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### PATCH /api/admin/orders/[id]

Actualiza el estado de un pedido respetando las transiciones válidas.

**Transiciones válidas**

```
PENDING → PAID
PAID → PROCESSING
PROCESSING → SHIPPED
SHIPPED → DELIVERED
PAID → REFUNDED
PROCESSING → CANCELLED
```

**Request**

```json
{
  "status": "PROCESSING",
  "trackingNumber": "AND123456789",
  "shippingMethod": "Andreani"
}
```

**Response 200**

```json
{
  "order": {
    "id": "cuid",
    "orderNumber": 1,
    "status": "PROCESSING"
  }
}
```

**Response 400 — Transición inválida**

```json
{ "error": "Transición de estado inválida: PENDING → PROCESSING" }
```

---

### GET /api/admin/products

Lista todos los productos incluyendo archivados.

**Query params**

| Param | Tipo | Descripción |
|---|---|---|
| `search` | string | Buscar por nombre |
| `category` | string | Filtrar por slug de categoría |
| `brand` | string | Filtrar por slug de marca |
| `archived` | boolean | Incluir archivados (default: false) |
| `page` | number | Página (default: 1) |

**Response 200**

```json
{
  "products": [
    {
      "id": "cuid",
      "name": "Nike Air Force 1",
      "slug": "nike-air-force-1-white",
      "brand": { "name": "Nike" },
      "category": { "name": "Zapatillas" },
      "price": "89999.00",
      "isActive": true,
      "isFeatured": false,
      "deletedAt": null,
      "totalStock": 12,
      "primaryImage": "https://res.cloudinary.com/..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "totalPages": 2
  }
}
```

---

### POST /api/admin/products

Crea un nuevo producto con sus variantes e imágenes.

**Request**

```json
{
  "name": "Nike Air Force 1",
  "slug": "nike-air-force-1-white",
  "description": "...",
  "categoryId": "cuid",
  "brandId": "cuid",
  "gender": "UNISEX",
  "price": 89999,
  "comparePrice": 99999,
  "costPrice": 45000,
  "costCurrency": "USD",
  "colorName": "White",
  "colorHex": "#FFFFFF",
  "groupSlug": "nike-air-force-1",
  "isFeatured": false,
  "variants": [
    { "size": "40", "sku": "NAF1-W-40", "stock": 2 },
    { "size": "41", "sku": "NAF1-W-41", "stock": 3 },
    { "size": "42", "sku": "NAF1-W-42", "stock": 0 }
  ],
  "images": [
    { "url": "https://res.cloudinary.com/...", "isPrimary": true, "sortOrder": 0 },
    { "url": "https://res.cloudinary.com/...", "isPrimary": false, "sortOrder": 1 }
  ]
}
```

**Response 201**

```json
{
  "product": {
    "id": "cuid",
    "name": "Nike Air Force 1",
    "slug": "nike-air-force-1-white"
  }
}
```

---

### PATCH /api/admin/products/[id]

Actualiza un producto existente. Solo se actualizan los campos enviados.

**Request** — mismos campos que POST, todos opcionales.

**Response 200**

```json
{
  "product": {
    "id": "cuid",
    "name": "Nike Air Force 1",
    "updatedAt": "2026-06-25T15:00:00Z"
  }
}
```

---

### DELETE /api/admin/products/[id]

Archiva un producto (soft delete). No elimina el registro de la base de datos.

**Efecto**
- Setea `deletedAt` con timestamp actual
- El producto deja de aparecer en el storefront
- El historial de pedidos asociado se mantiene intacto

**Response 200**

```json
{
  "success": true,
  "deletedAt": "2026-06-25T15:00:00Z"
}
```

**Response 400 — Producto ya archivado**

```json
{ "error": "El producto ya está archivado" }
```

---

## Resumen de endpoints

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/api/products` | ❌ | Listado de productos |
| GET | `/api/products/[slug]` | ❌ | Detalle de producto |
| POST | `/api/checkout` | ❌ | Crear orden |
| POST | `/api/checkout/validate-coupon` | ❌ | Validar cupón |
| POST | `/api/webhooks/mercadopago` | MP firma | Webhook de pago |
| GET | `/api/admin/orders` | ✅ | Listar pedidos |
| PATCH | `/api/admin/orders/[id]` | ✅ | Actualizar estado |
| GET | `/api/admin/products` | ✅ | Listar productos |
| POST | `/api/admin/products` | ✅ | Crear producto |
| PATCH | `/api/admin/products/[id]` | ✅ | Actualizar producto |
| DELETE | `/api/admin/products/[id]` | ✅ | Archivar producto |

---

*Este documento es la fuente de verdad sobre los contratos de API de Member OS v1.0. Cualquier endpoint no listado aquí debe ser evaluado y aprobado antes de implementarse.*
