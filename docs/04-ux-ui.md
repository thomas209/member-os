# 04 — UX / UI — Experiencia de Usuario

**Proyecto:** Member OS  
**Versión:** 1.0  
**Fecha de actualización:** 2025-06-10  
**Estado:** ✅ Aprobado  
**Rol:** Head of Product Design

---

## Premisa de diseño

Member OS no es una tienda de Tiendanube con mejor template. Es una experiencia de compra construida desde cero para una audiencia que vive en su teléfono, consume contenido de marcas globales, y tiene expectativas de calidad visual proporcionales a los productos que compra.

El tráfico principal es mobile. La velocidad de compra es prioritaria. El diseño debe transmitir calidad premium sin sacrificar claridad funcional. La referencia no son otras tiendas argentinas — son Nike, Zara, Apple Store y Mercado Libre.

---

## 1. Principios de UX

### Principios rectores

**Velocidad sobre completitud.**
Cada segundo de fricción es un cliente perdido. Cada campo innecesario es una razón para abandonar. El sistema favorece siempre la ruta más corta hacia la compra completada.

**La imagen manda.**
En indumentaria y zapatillas, la decisión de compra es visual. Las imágenes tienen prioridad jerárquica sobre el texto en toda la experiencia. La galería de producto es el elemento más importante de la PDP.

**Mobile es la experiencia principal, no la reducida.**
No se diseña desktop y se adapta a mobile. Se diseña mobile y se enriquece en desktop. Cada componente se evalúa primero en 390px de ancho.

**Cero ambigüedad en el stock.**
El cliente nunca debe seleccionar un talle para descubrir que no hay stock. La disponibilidad se comunica antes de la selección, durante la selección y antes del checkout. El quiebre de stock sin comunicación es la mayor fuente de frustración en e-commerce de indumentaria.

**El checkout es una conversación, no un formulario.**
Pedir solo lo que se necesita. Validar en tiempo real. No interrumpir con errores hasta que el cliente termina de escribir. El progreso debe ser siempre visible.

**Confianza por defecto.**
Un cliente que llega desde Instagram no conoce Member Club. El diseño debe transmitir legitimidad desde el primer scroll. Precio visible, método de pago conocido (Mercado Pago), número de pedido inmediato después de la compra.

**El backoffice es una herramienta de trabajo, no un dashboard corporativo.**
El equipo usa el backoffice bajo presión operativa. Debe ser rápido de navegar, claro en el estado de cada pedido, y forgiving con los errores.

---

### Qué debemos evitar

- Popups de suscripción antes de que el cliente vea un producto.
- Registro obligatorio para comprar. Es el mayor killer de conversión en mobile.
- Campos redundantes en el checkout (pedir el email dos veces, pedir datos que no se usan).
- Galerías con imágenes de baja resolución o mal encuadradas.
- Talles como dropdown. En mobile, un selector visual de botones es siempre superior.
- Mensajes de error al final del formulario. Validación inline, campo por campo.
- Carrito en página separada. El carrito es un drawer lateral que no interrumpe el browse.
- Loading states sin feedback. Cada acción debe confirmar que algo está pasando.
- Navegación profunda. Ningún producto debe estar a más de tres taps desde el home.
- Textos de producto genéricos. La descripción es parte de la experiencia de marca.
- Footer sobrecargado con links que nadie usa.
- Colores y tipografías que compiten con las imágenes de producto.

---

### Qué diferencia a Member OS de Tiendanube

| Dimensión | Tiendanube | Member OS |
|---|---|---|
| Punto de partida del diseño | Template genérico adaptado | Experiencia diseñada desde cero para indumentaria |
| Jerarquía visual | Balanceada entre texto e imagen | Imagen primero, siempre |
| Selector de talles | Dropdown en la mayoría de los templates | Botones visuales con estado de stock integrado |
| Carrito | Página separada o mini cart básico | Drawer lateral con resumen completo y acción directa |
| Checkout | Multipaso con fricción alta | Paso único o mínimo de pasos, validación inline |
| Estado del pedido post-compra | Página básica de confirmación | Confirmación con número de pedido prominente y próximos pasos claros |
| Velocidad percibida | Depende de la plataforma | Server Components + CDN de imágenes + optimización propia |
| Identidad visual | Limitada por el template | Control total del design system |

---

## 2. Sitemap completo

### Storefront

```
/                              → Home
│
├── /catalog                   → Catálogo general
│   ├── /catalog?category=     → Catálogo filtrado por categoría
│   ├── /catalog?brand=        → Catálogo filtrado por marca
│   └── /catalog?gender=       → Catálogo filtrado por género
│
├── /product/[slug]            → Página de producto (PDP)
│
├── /cart                      → Carrito (drawer en mobile/desktop, página en fallback)
│
├── /checkout                  → Checkout
│   └── /checkout/success      → Confirmación de compra
│
├── /order/[orderNumber]       → Seguimiento de pedido (acceso por email)
│
└── /search?q=                 → Resultados de búsqueda
```

### Backoffice

```
/admin                         → Redirect a /admin/dashboard
│
├── /admin/login               → Autenticación
│
├── /admin/dashboard           → Dashboard principal con métricas
│
├── /admin/products            → Listado de productos
│   ├── /admin/products/new    → Crear producto
│   └── /admin/products/[id]   → Editar producto
│
├── /admin/categories          → Gestión de categorías
│
├── /admin/brands              → Gestión de marcas
│
├── /admin/orders              → Listado de pedidos
│   └── /admin/orders/[id]     → Detalle de pedido
│
├── /admin/customers           → Base de clientes
│   └── /admin/customers/[id]  → Perfil de cliente
│
├── /admin/coupons             → Gestión de cupones
│   ├── /admin/coupons/new     → Crear cupón
│   └── /admin/coupons/[id]    → Editar cupón
│
├── /admin/stock               → Vista de inventario y movimientos
│
└── /admin/settings            → Configuración general
```

---

## 3. Customer Journey

### Fase 1 — Descubrimiento

**Canal principal:** Instagram, TikTok, WhatsApp. El cliente ve una foto de un producto y toca el link en bio o en el story.

**Lo que sucede:**
- Aterriza en la PDP directamente o en el Home
- Primera impresión en menos de 2 segundos
- La imagen del producto debe cargar antes que cualquier otra cosa

**Necesidad del cliente:** "Quiero ver bien el producto antes de considerar comprarlo."

**Riesgo de abandono:** imagen lenta, diseño que no transmite confianza, precio no visible inmediatamente.

---

### Fase 2 — Evaluación del producto

**El cliente está en la PDP.**

**Lo que sucede:**
- Examina la galería de imágenes
- Lee el nombre, la marca y el precio
- Verifica los talles disponibles
- Lee la descripción brevemente
- Busca información de envío

**Necesidad del cliente:** "Quiero saber si mi talle está disponible y cuánto me cuesta con envío."

**Riesgo de abandono:** talle agotado sin comunicación anticipada, precio del envío oculto o sorpresivo, imágenes insuficientes para evaluar el producto.

---

### Fase 3 — Decisión e intención de compra

**El cliente selecciona su talle.**

**Lo que sucede:**
- Toca el talle disponible
- El botón de "Agregar al carrito" se activa
- Toca el botón
- El carrito se abre como drawer lateral
- Ve el resumen con precio y subtotal

**Necesidad del cliente:** "Quiero confirmar que agregué lo correcto antes de pagar."

**Riesgo de abandono:** confusión sobre qué se agregó, precio diferente al esperado, fricción para continuar comprando o ir al checkout.

---

### Fase 4 — Checkout

**El cliente decide pagar.**

**Lo que sucede:**
- Toca "Comprar" desde el carrito
- Ingresa email
- Ingresa nombre y apellido
- Ingresa teléfono
- Ingresa dirección de envío
- Aplica cupón si tiene
- Revisa resumen final
- Toca "Pagar con Mercado Pago"
- Es redirigido a MP
- Completa el pago en MP
- Es redirigido a la confirmación

**Necesidad del cliente:** "Quiero pagar rápido y recibir una confirmación inmediata."

**Riesgo de abandono:** demasiados campos, errores de validación agresivos, sorpresas de precio en el último paso, desconfianza en el proceso de pago.

---

### Fase 5 — Post-compra inmediata

**El cliente ve la confirmación.**

**Lo que sucede:**
- Ve el número de pedido prominente
- Ve el resumen de lo que compró
- Ve los próximos pasos (cuándo recibirá novedades)
- Recibe email de confirmación

**Necesidad del cliente:** "Necesito saber que la compra salió bien y qué pasa ahora."

**Riesgo de abandono del flujo:** confirmación genérica sin número de pedido claro, sin información sobre próximos pasos, sin email de respaldo.

---

### Fase 6 — Seguimiento

**El cliente quiere saber dónde está su pedido.**

**Lo que sucede:**
- Recibe actualización por email cuando el pedido es despachado
- Accede a `/order/[orderNumber]` con su email para ver el estado
- Ve el número de seguimiento cuando está disponible

**Necesidad del cliente:** "Quiero saber cuándo llega sin tener que contactar a nadie."

---

### Fase 7 — Recompra

**El cliente vuelve.**

**Lo que sucede:**
- Llega desde redes sociales o directamente
- Si compró como invitado, el checkout recuerda su email si usa el mismo dispositivo
- Si tiene cuenta, su dirección ya está cargada

**Necesidad del cliente:** "Quiero que sea más fácil que la primera vez."

**Nota v1.0:** la recompra facilitada por cuenta de cliente se implementa en v2. En v1.0 el email guardado en localStorage agiliza el primer campo del checkout.

---

## 4. Navegación Storefront

### Header — Mobile

```
┌─────────────────────────────────────────┐
│  ☰    MEMBER CLUB              🔍  🛒 2 │
└─────────────────────────────────────────┘
```

- Logo centrado o alineado a la izquierda según identidad de marca
- Ícono de menú hamburguesa a la izquierda
- Búsqueda e ícono de carrito con badge de cantidad a la derecha
- Header sticky — siempre visible al hacer scroll
- Altura máxima: 56px para no consumir viewport

### Header — Desktop

```
┌──────────────────────────────────────────────────────────────────┐
│  MEMBER CLUB    Zapatillas  Ropa  Marcas  Novedades    🔍  Carrito│
└──────────────────────────────────────────────────────────────────┘
```

- Navegación principal con las categorías más importantes
- Búsqueda expandible al tocar el ícono
- Carrito con contador de ítems

### Menú mobile (drawer)

```
┌─────────────────────────────┐
│ ✕                           │
│                             │
│  ZAPATILLAS                 │
│  ROPA                       │
│  MARCAS                     │
│  NOVEDADES                  │
│  OFERTAS                    │
│                             │
│ ─────────────────────────── │
│  Nike                       │
│  Adidas                     │
│  New Balance                │
│  Fear of God                │
│                             │
└─────────────────────────────┘
```

- Ocupa el 80% del ancho de la pantalla desde la izquierda
- Se cierra tocando la X o haciendo swipe hacia la izquierda
- Fondo oscuro semi-transparente en el área restante
- Animación de entrada: slide desde la izquierda, 200ms ease-out

### Footer

Minimalista. No es el footer de un portal.

```
┌─────────────────────────────┐
│  MEMBER CLUB                │
│                             │
│  Preguntas frecuentes       │
│  Cómo comprar               │
│  Cambios y devoluciones     │
│  Contacto                   │
│                             │
│  © 2025 Member Club         │
└─────────────────────────────┘
```

### Buscador

- En mobile: ocupa la pantalla completa al activarse (overlay)
- Resultados en tiempo real a partir del segundo caracter
- Muestra primero productos que coinciden con el nombre
- Si no hay resultados: sugerir categorías relacionadas, nunca pantalla vacía
- En desktop: se expande desde el ícono en el header

### Filtros — Mobile

- No son un sidebar. Son un sheet que sube desde la parte inferior de la pantalla (bottom sheet)
- Las opciones activas se muestran como chips encima del grid de productos
- Cada chip activo tiene una X para eliminarlo sin abrir el panel de filtros
- El botón "Ver X productos" está siempre visible en el fondo del sheet

### Breadcrumbs

- Solo en desktop y solo en la PDP
- `Inicio / Zapatillas / Nike Air Force 1 White`
- En mobile no se muestran — reemplazan con el botón de volver del header

---

## 5. Flujo de compra

### Paso 1 — Home

El cliente aterriza. Tiene menos de 3 segundos para decidir si sigue.

- El hero carga primero — imagen de producto con impacto visual alto
- El scroll lleva a "Novedades" o "Destacados"
- Cada product card muestra: imagen, nombre, marca, precio
- El acceso al catálogo completo es siempre visible

**Punto de abandono:** hero lento, propuesta de valor no clara, productos que no interesan en el primer scroll.
**Mitigación:** imágenes en Cloudinary con lazy load, primer fold con producto de alto impacto, categorías visibles sin scroll.

---

### Paso 2 — Catálogo

El cliente navega o filtra.

- Grid de 2 columnas en mobile, 3 o 4 en desktop
- Filtros accesibles sin abandonar el scroll
- El precio y la marca son siempre visibles en la card
- Si un producto no tiene stock en ningún talle: badge "Sin stock", no se oculta
- Infinite scroll o paginación — decisión de implementación, no de UX

**Punto de abandono:** no encontrar el producto buscado, filtros confusos, no poder distinguir entre productos similares.
**Mitigación:** filtros rápidos (categoría + marca como los más usados), imágenes consistentes en proporción.

---

### Paso 3 — PDP (Página de Producto)

La decisión de compra se toma acá.

- Galería ocupa todo el ancho en mobile (sin márgenes laterales)
- Precio y nombre visibles sin hacer scroll
- Selector de talles debajo del precio: botones, no dropdown
- Botón "Agregar al carrito" siempre visible (sticky al fondo en mobile)
- Si el talle está sin stock: botón deshabilitado con texto "Sin stock"
- Descripción colapsable para no enterrar el CTA

**Punto de abandono:** talle agotado, precio del envío desconocido, galería insuficiente.
**Mitigación:** comunicar stock claramente por talle, mostrar costo de envío estimado antes del checkout, mínimo 3-4 imágenes por producto.

---

### Paso 4 — Agregar al carrito

Acción de alta intención. No debe interrumpir.

- El carrito se abre como drawer desde la derecha
- Animación rápida: 200ms
- El drawer muestra: imagen del producto, talle seleccionado, precio, subtotal total
- Dos opciones: "Seguir comprando" (cierra el drawer) y "Comprar" (va al checkout)
- El badge del carrito en el header se actualiza inmediatamente

**Punto de abandono:** drawer lento, confusión sobre qué se agregó.
**Mitigación:** feedback visual inmediato, resumen claro en el drawer.

---

### Paso 5 — Checkout

El campo más crítico del sistema. Se diseña para minimizar abandono.

El checkout es una sola página con secciones claramente diferenciadas. No hay pasos separados con navegación entre páginas.

**Secciones en orden:**
1. Email (con detección de cliente existente)
2. Nombre y apellido
3. Teléfono
4. Dirección de envío (calle, número, piso/depto, ciudad, provincia, CP)
5. Cupón de descuento (campo colapsable, no prominente)
6. Resumen del pedido (colapsable en mobile para no ocupar pantalla)
7. Botón "Pagar con Mercado Pago"

**Reglas de validación:**
- Validación inline al salir de cada campo (onBlur), no al hacer submit
- Errores con texto descriptivo, no solo "Campo requerido"
- El botón de pago se habilita solo cuando todos los campos son válidos
- El total final es visible antes de tocar el botón de pago

**Punto de abandono:** demasiados campos, errores de validación agresivos, total diferente al esperado.
**Mitigación:** orden lógico de campos, validación amigable, resumen siempre visible.

---

### Paso 6 — Mercado Pago

El cliente es redirigido a Mercado Pago. Member OS no interviene acá.

**Lo que controlamos:**
- El monto total es exactamente el que el cliente vio en el resumen
- El título de la preferencia es claro: "Member Club — Pedido #XXXX"
- La URL de retorno éxito va a `/checkout/success`
- La URL de retorno fallo vuelve al checkout con mensaje informativo

---

### Paso 7 — Confirmación

El cliente volvió. Necesita certeza inmediata.

- Ícono de check y mensaje de éxito en el primer fold
- Número de pedido prominente: `Pedido #0042`
- Resumen de lo que compró
- Dirección de envío confirmada
- Próximos pasos: "Te avisaremos por email cuando tu pedido sea despachado"
- Sin opciones de cuenta o registro — no es el momento

**Punto de abandono del flujo:** no aplica acá. La compra ya se realizó. El objetivo es generar confianza para la recompra.

---

## 6. UX del catálogo

### Filtros disponibles

- **Categoría:** Zapatillas, Remeras, Pantalones, Camperas, etc.
- **Marca:** Nike, Adidas, New Balance, etc.
- **Género:** Hombre, Mujer, Unisex
- **Disponibilidad:** Solo con stock

Los filtros de precio y talle se evalúan para v2.

### Ordenamiento

- Novedades (default)
- Precio: menor a mayor
- Precio: mayor a menor
- Destacados

### Vista mobile

- Grid de 2 columnas
- Card con imagen 4:5 (portrait), nombre, marca y precio
- Sin descripción en la card — la imagen y el precio son suficientes
- Lazy load de imágenes fuera del viewport
- Filtros como bottom sheet al tocar el botón "Filtrar"

### Vista desktop

- Grid de 3 columnas (puede expandirse a 4)
- Sidebar de filtros siempre visible a la izquierda
- Las cards pueden mostrar un segundo color si el producto tiene `groupSlug`

### Estados de la card

- **Normal:** imagen principal
- **Hover (desktop):** segunda imagen si existe (efecto flip), visible el botón "Ver producto"
- **Sin stock:** badge "Agotado" superpuesto, imagen en escala reducida de opacidad
- **Oferta:** badge con el precio original tachado y el precio de oferta en color de acento

---

## 7. UX de la página de producto

### Galería

- Imagen principal ocupa 100% del ancho en mobile, sin padding lateral
- Proporción 4:5 consistente en todos los productos
- Navegación entre imágenes con swipe horizontal en mobile
- Indicadores de posición (dots) debajo de la galería
- En desktop: imagen principal grande a la izquierda, thumbnails en columna a la izquierda o debajo
- Zoom en desktop al hacer hover sobre la imagen principal
- Mínimo de imágenes recomendado por producto: 3. Ideal: 5-6.

### Información del producto

Orden de elementos en mobile (de arriba hacia abajo):

```
1. Galería
2. Marca (texto pequeño, link al catálogo de la marca)
3. Nombre del producto (tipografía grande, prominente)
4. Precio / Precio de oferta
5. Selector de talles
6. Botón "Agregar al carrito" (sticky al fondo)
7. Descripción (colapsable)
8. Información de envío (colapsable)
9. Productos relacionados
```

### Selector de talles

```
Talle
[ XS ]  [ S ]  [ M ]  [ L ]  [ XL ]  [~~XXL~~]

~~XXL~~ = sin stock (tachado y opacidad reducida)
```

- Botones rectangulares, no dropdown
- Estado: disponible / seleccionado / sin stock
- Los talles sin stock se muestran pero están deshabilitados con estilo diferenciado
- El texto de estado cambia según el talle: "Últimas unidades" si stock ≤ 3
- Sin talle seleccionado: el botón de agregar al carrito dice "Seleccioná un talle"
- Con talle seleccionado: el botón dice "Agregar al carrito"

### Stock y urgencia

- Si stock total del producto > 5: no mostrar cantidad
- Si stock de la variante seleccionada ≤ 3: "Últimas X unidades"
- Si stock = 0: "Sin stock" — talle deshabilitado

### Información de envío

Sección colapsable debajo del CTA:

```
▼ Envío
  Calculá el costo ingresando tu código postal [  CP  ]
  Envío a todo el país — CABA y GBA: 2-4 días hábiles
```

En v1.0 el cálculo de envío es estimativo. La integración real con Andreani es v2.

### Colores del mismo modelo (groupSlug)

Si el producto tiene productos relacionados con el mismo `groupSlug`:

```
También en:
● [Negro]  ○ [Blanco]  ○ [Wheat]
```

- Swatches circulares usando `colorHex`
- Al tocar un swatch navega al producto correspondiente
- El swatch activo está marcado visualmente

### Cross-selling y productos relacionados

Sección al final de la PDP:

```
También te puede interesar
[Card] [Card] [Card] [Card]  → scroll horizontal en mobile
```

Criterio de selección en v1.0: misma categoría + misma marca. En v2 se puede personalizar por comportamiento.

---

## 8. UX del checkout

### Datos mínimos necesarios

Member OS pide exactamente lo que necesita para procesar y despachar el pedido. Nada más.

| Campo | Por qué es necesario |
|---|---|
| Email | Confirmación del pedido, comunicación de envío |
| Nombre y apellido | Identificación del destinatario |
| Teléfono | Contacto del courier (Andreani lo requiere) |
| Calle y número | Dirección de entrega |
| Piso / Depto | Opcional — para edificios |
| Ciudad | Dirección de entrega |
| Provincia | Cálculo de envío y logística |
| Código postal | Cálculo de envío |

**No se pide:** DNI, fecha de nacimiento, contraseña (salvo que el cliente quiera crear cuenta).

### Validaciones

| Campo | Regla |
|---|---|
| Email | Formato válido. onBlur |
| Teléfono | Mínimo 8 dígitos, solo números. onBlur |
| Código postal | Exactamente 4 dígitos. onBlur |
| Campos de texto | No vacíos. onBlur |
| Cupón | Validación asíncrona contra la API al tocar "Aplicar" |

Los errores son mensajes descriptivos en texto pequeño bajo el campo, en color de error. Nunca un alert o un modal.

### Invitado vs usuario registrado

**En v1.0 no hay login de clientes.** El flujo es siempre como invitado.

El sistema detecta si el email ingresado corresponde a una compra anterior y, en ese caso, puede pre-completar campos desde localStorage (solo si el mismo dispositivo fue usado anteriormente). No se piden contraseñas.

Post-confirmación de compra: opción discreta de "Crear una cuenta para seguir tus pedidos más fácilmente" — un solo click, sin pantalla adicional.

### Cupón

- Campo oculto por defecto detrás del texto "¿Tenés un cupón?"
- Se expande al tocar, ocupa una línea con input + botón "Aplicar"
- Si el cupón es válido: muestra el descuento aplicado en el resumen
- Si no es válido: mensaje inline bajo el campo con el motivo
- Si el cupón tiene monto mínimo y no se alcanza: mensaje explicativo

### Integración Mercado Pago

- Se usa Checkout Pro (redirección)
- El botón de pago muestra el logo de Mercado Pago para señalizar confianza
- El total es exactamente el mismo que el cliente vio en el resumen
- En caso de pago fallido en MP: el cliente vuelve al checkout con mensaje "El pago no pudo procesarse. Podés intentarlo nuevamente."
- La orden queda en estado `PENDING` hasta que el webhook confirma

---

## 9. UX del dashboard admin

### Principios del backoffice

- **Densidad sobre minimalismo.** El equipo necesita ver mucha información junta. No es la tienda.
- **Acciones frecuentes en un click.** Cambiar estado de un pedido no debe requerir abrir el detalle.
- **Estado del sistema siempre visible.** Cuántos pedidos hay en cada estado, nivel de stock crítico.
- **Búsqueda rápida.** El pedido #0042 debe encontrarse en menos de 3 segundos.

### Dashboard principal

```
┌─────────────────────────────────────────────────────┐
│ Hoy    Esta semana    Este mes                       │
│                                                      │
│  [ Ventas hoy ]  [ Pedidos hoy ]  [ Ticket promedio ]│
│     $45.200           8               $5.650         │
│                                                      │
│ Pedidos recientes                          Ver todos │
│ #0042  Juan Pérez    Nike AF1 W / 42   PAID     ...  │
│ #0041  María López   Remera S         PROCESSING ... │
│ #0040  Carlos R.     Jordan 1 / 43    SHIPPED   ...  │
│                                                      │
│ Stock crítico (≤ 3 unidades)                         │
│ Nike Air Force 1 White / 41  →  2 unidades           │
│ Adidas Stan Smith / 38       →  1 unidad             │
└─────────────────────────────────────────────────────┘
```

### Flujo de carga de producto

El formulario de nuevo producto sigue un orden lógico de completitud:

**Sección 1 — Identidad**
- Nombre del producto
- Marca (selector desde `Brand`)
- Categoría (selector desde `Category`)
- Género

**Sección 2 — Imágenes**
- Upload múltiple con drag & drop
- Preview inmediato de cada imagen
- Reordenamiento por drag & drop
- Marcar imagen principal
- Carga directo a Cloudinary desde el browser

**Sección 3 — Precios**
- Precio de venta
- Precio tachado (comparePrice) — opcional
- Precio de oferta + fecha de fin — opcional
- Costo de adquisición + moneda — solo visible para ADMIN y SUPER_ADMIN

**Sección 4 — Descripción y SEO**
- Descripción del producto
- Meta title — con contador de caracteres (max 60)
- Meta description — con contador de caracteres (max 160)
- Slug — auto-generado desde el nombre, editable

**Sección 5 — Variantes (talles)**
- Lista de talles predefinidos según categoría, seleccionables con un click
- Cada talle seleccionado genera una fila con su campo de stock
- Posibilidad de agregar talle personalizado si no está en la lista

**Sección 6 — Logística**
- Peso en gramos
- Dimensiones
- Color descriptivo + hex (opcional)
- groupSlug (opcional)

**Acciones:**
- "Guardar como borrador" (isActive = false)
- "Publicar" (isActive = true)

### Gestión de stock

Desde el detalle del producto:

```
Talles y stock

Talle    Stock    SKU          Acciones
  S        3      MC-REM-S     [Editar stock]
  M        0      MC-REM-M     [Editar stock]
  L        7      MC-REM-L     [Editar stock]
  XL       2      MC-REM-XL   [Editar stock]

[+ Agregar talle]
```

Al tocar "Editar stock": modal con campo numérico + campo de nota obligatorio. Crea un `StockMovement` de tipo `ADJUSTMENT`.

**Vista de movimientos:**
Tab "Historial de stock" en el detalle del producto muestra la tabla de `StockMovement` con fecha, tipo, cantidad, anterior → nuevo, y quién lo hizo.

### Gestión de pedidos

Vista principal: tabla con columnas relevantes y filtros rápidos.

```
Filtros: [ Todos ] [ Pendientes ] [ Pagados ] [ En proceso ] [ Despachados ]

Buscar: [                    ]  (por número, email, nombre)

#      Fecha      Cliente           Productos    Total     Estado       Acciones
0042   10/06/25   juan@mail.com     2 productos  $12.400   PAID     [Ver] [Procesar]
0041   10/06/25   maria@mail.com    1 producto   $8.900    PROCESSING [Ver] [Despachar]
```

**Detalle del pedido:**
- Resumen de ítems con imágenes y talles
- Datos del cliente y dirección de envío
- Estado actual con botones de transición al siguiente estado
- Campo para cargar número de tracking y método de envío
- Historial de cambios de estado con timestamp

**Transiciones de estado habilitadas por rol:**

| Transición | OPERATOR | ADMIN | SUPER_ADMIN |
|---|---|---|---|
| PAID → PROCESSING | ✅ | ✅ | ✅ |
| PROCESSING → SHIPPED | ✅ | ✅ | ✅ |
| SHIPPED → DELIVERED | ✅ | ✅ | ✅ |
| Cualquier → CANCELLED | ❌ | ✅ | ✅ |
| Cualquier → REFUNDED | ❌ | ❌ | ✅ |

### Gestión de clientes

- Tabla con nombre, email, teléfono, cantidad de pedidos, total histórico
- Búsqueda por nombre o email
- Perfil del cliente: datos personales, dirección guardada, historial completo de pedidos

### Gestión de cupones

Formulario de creación:

- Código (mayúsculas, sin espacios, sugerido automáticamente o custom)
- Tipo: porcentaje o monto fijo
- Valor del descuento
- Monto mínimo de compra (opcional)
- Límite de usos totales (opcional)
- Fechas de validez (opcional)
- Estado activo/inactivo

Vista de lista: muestra usos actuales vs máximo, estado de vigencia (activo, vencido, agotado).

---

## 10. Wireframes textuales

### Home — Mobile

```
┌─────────────────────────────┐
│ ☰   MEMBER CLUB      🔍 🛒  │  ← Header sticky
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │      HERO IMAGE       │  │  ← Full width, 70vh
│  │   Nike Air Max 2025   │  │
│  │                       │  │
│  │  [  COMPRAR AHORA  ]  │  │
│  └───────────────────────┘  │
│                             │
│  NOVEDADES                  │
│                             │
│  ┌──────┐  ┌──────┐         │
│  │      │  │      │         │  ← Grid 2 columnas
│  │ IMG  │  │ IMG  │         │
│  │      │  │      │         │
│  ├──────┤  ├──────┤         │
│  │Nike  │  │Adidas│         │
│  │AF1 W │  │Stan S│         │
│  │$89K  │  │$65K  │         │
│  └──────┘  └──────┘         │
│                             │
│  ┌──────┐  ┌──────┐         │
│  │      │  │      │         │
│  │ IMG  │  │ IMG  │         │
│  │      │  │      │         │
│  ├──────┤  ├──────┤         │
│  │Fear  │  │ NB   │         │
│  │of God│  │ 550  │         │
│  │$120K │  │$75K  │         │
│  └──────┘  └──────┘         │
│                             │
│  [  VER TODO EL CATÁLOGO  ] │
│                             │
│  ZAPATILLAS    ROPA         │  ← Categorías rápidas
│                             │
├─────────────────────────────┤
│  MEMBER CLUB                │  ← Footer mínimo
│  Preguntas frecuentes       │
│  Contacto                   │
└─────────────────────────────┘
```

---

### Catálogo — Mobile

```
┌─────────────────────────────┐
│ ☰   MEMBER CLUB      🔍 🛒  │
├─────────────────────────────┤
│  Zapatillas          (48)   │  ← Título de sección
│                             │
│  [Nike ✕] [Hombre ✕]        │  ← Chips de filtros activos
│                             │
│  [↑↓ Ordenar]  [⚙ Filtrar]  │  ← Controles
├─────────────────────────────┤
│  ┌──────┐  ┌──────┐         │
│  │      │  │      │         │
│  │ IMG  │  │ IMG  │         │
│  │      │  │      │         │
│  ├──────┤  ├──────┤         │
│  │Nike  │  │Nike  │         │
│  │AF1 W │  │AF1 B │         │
│  │$89K  │  │$89K  │         │
│  └──────┘  └──────┘         │
│                             │
│  ┌──────┐  ┌──────┐         │
│  │      │  │      │         │
│  │ IMG  │  │AGOTAD│         │  ← Badge "Agotado"
│  │      │  │  O   │         │
│  ├──────┤  ├──────┤         │
│  │ NB   │  │Jordan│         │
│  │ 550  │  │  1   │         │
│  │$75K  │  │$110K │         │
│  └──────┘  └──────┘         │
│                             │
│  [ Cargar más productos ]   │
└─────────────────────────────┘
```

---

### PDP — Mobile

```
┌─────────────────────────────┐
│ ←   MEMBER CLUB      🔍 🛒  │
├─────────────────────────────┤
│ ┌───────────────────────────┐│
│ │                           ││
│ │                           ││
│ │        IMAGEN             ││  ← 100% ancho, 4:5
│ │       PRODUCTO            ││
│ │                           ││
│ │                           ││
│ └───────────────────────────┘│
│          ●  ○  ○  ○          │  ← Dots navegación
│                             │
│  NIKE                       │  ← Marca (link)
│  Air Force 1 White          │  ← Nombre grande
│                             │
│  $89.000                    │  ← Precio
│                             │
│  Talle                      │
│  [36][37][38][39][40][~~41~~]│  ← Botones talle
│       [42][43][44]          │  (41 = sin stock)
│                             │
│  También en:                │
│  ● ○ ○                      │  ← Swatches color
│                             │
│  ▼ Descripción              │  ← Colapsable
│  ▼ Envío                    │  ← Colapsable
│                             │
│  También te puede interesar │
│  [Card][Card][Card] →       │  ← Scroll horizontal
│                             │
├─────────────────────────────┤
│  [ AGREGAR AL CARRITO ]     │  ← Sticky bottom
└─────────────────────────────┘
```

---

### Carrito — Drawer Mobile

```
┌─────────────────────────────┐
│              ╔═════════════╗│
│  (overlay)   ║  Carrito  ✕ ║│
│              ╠═════════════╣│
│              ║ ┌───┐       ║│
│              ║ │IMG│ Nike  ║│
│              ║ │   │ AF1 W ║│
│              ║ └───┘ T: 42 ║│
│              ║  $89.000    ║│
│              ║  − 1 +      ║│
│              ╠═════════════╣│
│              ║ ┌───┐       ║│
│              ║ │IMG│Remera ║│
│              ║ │   │ NB M  ║│
│              ║ └───┘       ║│
│              ║  $35.000    ║│
│              ║  − 1 +      ║│
│              ╠═════════════╣│
│              ║ Subtotal    ║│
│              ║   $124.000  ║│
│              ╠═════════════╣│
│              ║[Seguir comp]║│
│              ║[  COMPRAR  ]║│
│              ╚═════════════╝│
└─────────────────────────────┘
```

---

### Checkout — Mobile

```
┌─────────────────────────────┐
│ ←         Checkout          │
├─────────────────────────────┤
│  Tu pedido (2 items)  ▼     │  ← Resumen colapsable
│  Total: $124.000            │
├─────────────────────────────┤
│  Datos de contacto          │
│                             │
│  Email *                    │
│  ┌───────────────────────┐  │
│  │ tu@email.com          │  │
│  └───────────────────────┘  │
│                             │
│  Nombre *    Apellido *     │
│  ┌────────┐  ┌────────────┐ │
│  │        │  │            │ │
│  └────────┘  └────────────┘ │
│                             │
│  Teléfono *                 │
│  ┌───────────────────────┐  │
│  │ 11 xxxx-xxxx          │  │
│  └───────────────────────┘  │
│                             │
│  Dirección de envío         │
│                             │
│  Calle y número *           │
│  ┌───────────────────────┐  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  Piso / Depto               │
│  ┌───────────────────────┐  │
│  │ Opcional              │  │
│  └───────────────────────┘  │
│                             │
│  Ciudad *      Provincia *  │
│  ┌────────┐  ┌────────────┐ │
│  │        │  │ Selector ▼ │ │
│  └────────┘  └────────────┘ │
│                             │
│  Código postal *            │
│  ┌───────────────────────┐  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ¿Tenés un cupón? ▼         │
│                             │
├─────────────────────────────┤
│  Subtotal          $124.000 │
│  Envío               $2.500 │
│  Total             $126.500 │
├─────────────────────────────┤
│  [ 💳 PAGAR CON MP ]        │
└─────────────────────────────┘
```

---

### Dashboard Admin — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│  MEMBER OS  │  Dashboard  Productos  Pedidos  Clientes  ...     │
├──────────────┬──────────────────────────────────────────────────┤
│              │  Buenos días, Admin                              │
│  Dashboard   │  Miércoles 10 de junio de 2025                  │
│  Productos   │                                                  │
│  Pedidos  🔴3│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  Clientes    │  │ Hoy      │ │ Pedidos  │ │ Ticket   │        │
│  Categorías  │  │ $45.200  │ │    8     │ │ $5.650   │        │
│  Marcas      │  └──────────┘ └──────────┘ └──────────┘        │
│  Cupones     │                                                  │
│  Stock       │  Pedidos recientes                  [Ver todos] │
│  Config      │  ┌────────────────────────────────────────────┐ │
│              │  │ # │ Cliente │ Producto │ Total │ Estado    │ │
│              │  ├────────────────────────────────────────────┤ │
│              │  │042│juan@... │Nike AF1/4│$89.000│ [PAID]    │ │
│              │  │041│maria@..│Remera S  │$35.000│[PROCESSING│ │
│              │  │040│carlos..│Jordan/43 │$110K  │[SHIPPED]  │ │
│              │  └────────────────────────────────────────────┘ │
│              │                                                  │
│              │  ⚠ Stock crítico                                │
│              │  Nike AF1 White / 41  →  2 unidades             │
│              │  Adidas Stan Smith / 38  →  1 unidad            │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### Listado de Productos — Admin Desktop

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [nav]       │  Productos                      [+ Nuevo producto]│
│              ├──────────────────────────────────────────────────┤
│              │  Buscar...  [Categoría ▼]  [Marca ▼]  [Estado ▼]│
│              ├──────────────────────────────────────────────────┤
│              │ ☐ │Img│ Nombre          │Marca │Precio│Stock│ ░░ │
│              ├──────────────────────────────────────────────────┤
│              │ ☐ │▪▪▪│ Nike AF1 White  │Nike  │$89K  │ 12  │⋮  │
│              │ ☐ │▪▪▪│ Nike AF1 Black  │Nike  │$89K  │  3⚠ │⋮  │
│              │ ☐ │▪▪▪│ Remera Básica S │Member│$35K  │  7  │⋮  │
│              │ ☐ │▪▪▪│ Jordan 1 Bred  │Nike  │$110K │  0✗ │⋮  │
│              ├──────────────────────────────────────────────────┤
│              │  Mostrando 1-20 de 47 productos    [<] 1 2 3 [>] │
└──────────────┴──────────────────────────────────────────────────┘
```

---

### Listado de Pedidos — Admin Desktop

```
┌──────────────┬──────────────────────────────────────────────────┐
│  [nav]       │  Pedidos                                         │
│              ├──────────────────────────────────────────────────┤
│              │[Todos][Pendientes 2][Pagados 3][En proceso][Desp]│
│              │  Buscar por #, email o nombre...                 │
│              ├──────────────────────────────────────────────────┤
│              │ # │ Fecha  │ Cliente  │ Items │ Total  │ Estado  │
│              ├──────────────────────────────────────────────────┤
│              │042│10/06   │juan@...  │  2   │$126.5K │[PAID]▶  │
│              │041│10/06   │maria@... │  1   │$35K    │[PROC]▶  │
│              │040│09/06   │carlos@.. │  1   │$110K   │[SHIP]▶  │
│              │039│09/06   │ana@...   │  3   │$204K   │[DELIV]  │
│              ├──────────────────────────────────────────────────┤
│              │  [<] 1 2 3 4 5 [>]              48 pedidos total │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 11. Requerimientos Mobile First

### Gestos soportados

| Gesto | Acción |
|---|---|
| Swipe horizontal en galería | Navegar entre imágenes del producto |
| Swipe izquierda en menú drawer | Cerrar el menú |
| Swipe abajo en bottom sheet | Cerrar filtros o modales |
| Tap en overlay | Cerrar drawer o modal activo |
| Pull to refresh | Actualizar listados en el backoffice |
| Pinch to zoom | Zoom en imagen de producto (desktop y mobile) |

### Menú y navegación

- El menú hamburguesa es siempre accesible desde el header sticky
- La barra inferior del navegador mobile no debe quedar superpuesta con el botón de "Agregar al carrito"
- El botón sticky de "Agregar al carrito" respeta el safe area de iOS (env(safe-area-inset-bottom))
- Los touch targets tienen un mínimo de 44x44px (estándar Apple HIG)

### Velocidad

- LCP (Largest Contentful Paint) objetivo: < 2.5 segundos en conexión 4G
- Las imágenes de producto usan `next/image` con lazy loading automático
- Las imágenes del primer fold (hero, primeras 4 cards) se cargan con `priority`
- Las fuentes se precargan en el `<head>` para evitar FOUT (Flash of Unstyled Text)
- Los Server Components reducen el JavaScript enviado al cliente
- El carrito (Zustand) persiste en localStorage para no recargar estado entre navegaciones

### Accesibilidad

- Contraste mínimo de texto sobre fondo: 4.5:1 (WCAG AA)
- Todos los inputs tienen `label` asociado visualmente y semánticamente
- Los botones de talle tienen `aria-label` descriptivo: "Talle 42, disponible" / "Talle 41, sin stock"
- El carrito drawer tiene `role="dialog"` y `aria-modal="true"`
- El foco se mueve al drawer al abrirse y vuelve al botón de origen al cerrarse
- Las imágenes de producto tienen `alt` text descriptivo (campo `altText` en `ProductImage`)
- El formulario de checkout usa `autocomplete` attributes para facilitar el autocompletado del browser y de Mercado Pago

### Formularios en mobile

- `inputmode="email"` en el campo de email (abre teclado optimizado)
- `inputmode="tel"` en el campo de teléfono
- `inputmode="numeric"` en el campo de código postal
- `autocomplete="email"`, `autocomplete="given-name"`, `autocomplete="postal-code"`, etc.
- Los campos del checkout están ordenados respetando el flujo de autocompletado del browser

---

## 12. Recomendaciones para v1.0

El objetivo de v1.0 es reemplazar Tiendanube sin pérdida de ventas. No construir la experiencia definitiva.

### Prioridad máxima — no lanzar sin esto

- PDP con galería, selector de talles y botón de agregar al carrito funcionando
- Carrito drawer con resumen y acceso al checkout
- Checkout de una sola página con validación inline
- Integración Mercado Pago funcionando end-to-end
- Página de confirmación con número de pedido
- Backoffice con CRUD de productos y gestión de pedidos

### Prioridad media — para la primera semana post-lanzamiento

- Filtros de catálogo por categoría y marca
- Swatches de color con groupSlug en la PDP
- Vista de stock crítico en el dashboard
- Historial de movimientos de stock por variante

### Diferir a v2 — no bloquea el lanzamiento

- Búsqueda full-text
- Cálculo de envío real por código postal
- Login y cuenta de cliente
- Seguimiento de pedido self-service en la tienda
- Cross-selling con lógica de recomendación
- Reviews de productos
- Animaciones y micro-interacciones elaboradas
- Dark mode
- PWA / app nativa

### Decisiones de UX que no deben cambiar en v1.0

Estas decisiones están tomadas y no deben abrirse a debate durante el desarrollo para no extender el timeline:

- El carrito es un drawer, no una página separada.
- El checkout es una sola página, no un wizard multipaso.
- Los talles son botones, no dropdown.
- El registro de clientes es opcional y post-compra, no obligatorio.
- El menú mobile es un drawer desde la izquierda, no un menú bottom bar.
- Las imágenes de producto son 4:5 en toda la tienda, sin excepciones.

---

*Este documento es la fuente de verdad de la experiencia de usuario de Member OS v1.0. Las decisiones de diseño visual (tipografía, colores, espaciado) se documentan en `05-design-system.md`.*
