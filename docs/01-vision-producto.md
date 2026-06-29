# 01 — Visión de Producto

**Proyecto:** Member OS  
**Versión:** 1.0  
**Fecha de actualización:** 2025-06-10  
**Estado:** ✅ Aprobado

---

## Qué es Member OS

Member OS es el sistema operativo comercial de Member Club. Es la plataforma propia que reemplaza a Tiendanube como infraestructura de ventas online, y que en versiones futuras centralizará la operación completa del negocio: ventas, inventario, clientes, logística y canales.

No es un template ni una plataforma genérica de e-commerce. Es un sistema construido específicamente para la forma en que Member Club compra, vende y opera. Cada decisión de arquitectura, modelo de datos y experiencia de usuario está tomada en función del negocio real, no de un caso de uso genérico.

El nombre refleja la intención: un sistema operativo para el negocio, no solo una tienda online.

---

## Problemas que resuelve para Member Club

### Dependencia de una plataforma genérica
Tiendanube es una solución horizontal diseñada para cualquier tipo de tienda. Member Club tiene necesidades específicas — indumentaria y zapatillas con talles, productos importados con costos en dólares, operación multimarca — que Tiendanube no puede modelar de forma precisa sin workarounds.

### Falta de control sobre la experiencia
En Tiendanube, la experiencia de compra está condicionada por los templates y las limitaciones de personalización de la plataforma. Member OS permite que la identidad visual y la experiencia de usuario sean decisiones propias, no restricciones del proveedor.

### Modelo de variantes inadecuado para indumentaria
Las plataformas genéricas modelan variantes como combinaciones de atributos (color × talle). En Member Club, cada color es un producto con identidad propia. El modelo de datos de Member OS refleja exactamente esto.

### Sin historial de inventario auditable
Tiendanube no mantiene un log de movimientos de stock. Member OS implementa `StockMovement` desde v1.0, lo que permite saber en todo momento por qué el stock de una variante tiene el valor que tiene.

### Costos de la plataforma que crecen con el negocio
Los planes de Tiendanube escalan en precio a medida que crece el volumen de ventas. Member OS es infraestructura propia con costos fijos y predecibles independientemente del volumen.

### Sin preparación para canales adicionales
Tiendanube no facilita la integración con Mercado Libre ni con sistemas logísticos propios. Member OS está diseñado desde su base para incorporar estas integraciones en versiones futuras sin rediseñar el modelo de datos.

---

## Objetivos del negocio

### Objetivo principal
Lanzar una tienda online propia que reemplace a Tiendanube sin pérdida de ventas ni de experiencia para el cliente, en un plazo máximo de doce semanas desde el inicio del desarrollo.

### Objetivos de producto
- Ofrecer una experiencia de compra que refleje la identidad visual de Member Club sin las restricciones de un template de terceros.
- Reducir la fricción en el checkout al mínimo posible para maximizar la tasa de conversión.
- Tener control total sobre el modelo de datos, el historial de clientes y la información de ventas.
- Construir una base técnica que soporte el crecimiento del negocio sin necesidad de migrar de plataforma.

### Objetivos operativos
- Que el equipo pueda gestionar productos, pedidos y stock desde un backoffice propio sin depender de soporte externo.
- Que el inventario sea siempre auditable: saber qué se vendió, qué se ajustó manualmente y por qué.
- Que los pedidos de invitados y clientes registrados convivan sin fricciones en el mismo sistema.

### Objetivos de infraestructura
- Costos de hosting y operación predecibles y escalables.
- Cero dependencia de plataformas con planes de pricing variable.
- Capacidad de integrar Andreani y Mercado Libre sin rediseñar el sistema.

---

## Diferencias respecto a Tiendanube

| Dimensión | Tiendanube | Member OS |
|---|---|---|
| **Modelo de producto** | Variantes por combinación de atributos | Color como producto independiente, talle como única variante |
| **Experiencia de compra** | Condicionada por templates de la plataforma | 100% custom, diseñada para Member Club |
| **Historial de inventario** | No disponible | `StockMovement` con log completo desde v1.0 |
| **Costos** | Escalan con el volumen de ventas | Fijos e independientes del volumen |
| **Control del código** | Sin acceso | Código propio, repositorio propio |
| **Datos de clientes** | Propiedad de Tiendanube | Propiedad de Member Club |
| **Integraciones futuras** | Limitadas al ecosistema de apps de TN | Abiertas, diseñadas desde el modelo de datos |
| **Checkout de invitados** | Disponible pero con restricciones de UI | Flujo propio optimizado para conversión |
| **Costos en USD** | Sin soporte nativo | Campo `costPrice` + `costCurrency` en producto |
| **SEO** | Controlado por la plataforma | Controlado por Member Club a nivel de código y contenido |
| **Velocidad de la tienda** | Depende del rendimiento de TN | Optimizada con Next.js, Server Components y CDN propio |

---

## Funcionalidades obligatorias de v1.0

Estas funcionalidades son requisito para el lanzamiento. Sin ellas, Member OS no reemplaza a Tiendanube.

### Storefront
- Home con hero editorial y sección de productos destacados
- Catálogo con filtros por categoría, marca y género
- Página de producto con galería de imágenes, selector de talle y disponibilidad de stock en tiempo real
- Carrito lateral con persistencia entre sesiones
- Checkout con formulario de envío completo
- Validación y aplicación de cupones de descuento en el checkout
- Integración con Mercado Pago (Checkout Pro)
- Página de confirmación de pedido con número de orden
- Soporte para compra como invitado sin registro obligatorio
- SEO básico: metaTitle, metaDescription, OG tags, sitemap

### Backoffice
- Autenticación segura con control de acceso por rol (SUPER_ADMIN, ADMIN, OPERATOR)
- CRUD completo de productos con carga de imágenes a Cloudinary
- Gestión de variantes (talles) con stock individual por variante
- CRUD de categorías y marcas
- Dashboard de pedidos con filtros por estado y búsqueda
- Cambio manual de estado de pedidos
- Vista del historial de movimientos de stock por producto
- Carga manual de número de seguimiento y método de envío
- Gestión de cupones de descuento
- Base de datos de clientes con historial de pedidos

### Infraestructura
- Deploy en Vercel con previews por branch
- PostgreSQL en Railway o Supabase
- Webhook de Mercado Pago como fuente de verdad del estado de pago
- Descuento de stock por webhook, no por redirect del cliente

---

## Funcionalidades futuras (v2)

Las siguientes funcionalidades están fuera del alcance de v1.0 pero forman parte de la visión del producto. Algunas ya tienen preparación en el modelo de datos de v1.0.

### Operación y logística
- Integración con la API de Andreani para generación automática de etiquetas y tracking
- Reserva de stock con timeout durante el checkout para evitar overselling en alta concurrencia
- Gestión de devoluciones con flujo completo desde el backoffice

### Canales adicionales
- Sincronización bidireccional con Mercado Libre (stock, precios, pedidos)
- Gestión centralizada de múltiples canales de venta desde un solo backoffice

### Clientes y fidelización
- Sistema de login y registro para clientes con historial de pedidos
- Programa de puntos o beneficios para clientes frecuentes
- Segmentación de clientes para campañas y descuentos dirigidos

### Inteligencia del negocio
- Reportes de margen por producto con costo en ARS y USD
- Actualización asistida de precios por variación del tipo de cambio
- Dashboard de métricas de ventas: revenue, ticket promedio, productos más vendidos
- Análisis de stock: rotación, productos sin movimiento, alertas de quiebre

### Experiencia de compra
- Búsqueda full-text de productos
- Reviews y calificaciones de productos
- Página de marca con descripción e imagen
- Página de categoría con contenido editorial
- Wishlist / lista de deseos

### Backoffice avanzado
- RBAC granular con permisos por sección
- Historial de acciones por usuario administrador
- Importación y exportación masiva de productos vía CSV
- Gestión de múltiples imágenes con reordenamiento drag & drop

---

## Perfil de cliente objetivo

Member Club vende a un perfil de cliente con características definidas:

**Demográfico**
- Edad predominante: 18 a 35 años
- Ubicación: Argentina, con foco inicial en Área Metropolitana de Buenos Aires
- Acceso desde mobile como canal principal de navegación y compra

**Comportamiento de compra**
- Familiarizado con el e-commerce y el checkout online
- Sensible al precio pero dispuesto a pagar por marcas y productos con identidad
- Toma decisiones de compra basadas fuertemente en la imagen del producto
- Busca talles específicos y es sensible a la disponibilidad de stock
- Puede ser cliente recurrente o nuevo cliente llegando desde redes sociales

**Expectativas**
- Experiencia de compra rápida y sin fricciones, especialmente en mobile
- Claridad inmediata sobre disponibilidad de talles
- Confianza en el proceso de pago (Mercado Pago como señal de seguridad)
- Confirmación inmediata del pedido con número de orden
- No quiere crear una cuenta para poder comprar

---

## Flujo general de operación

### Flujo de venta — perspectiva del cliente

```
1. El cliente descubre un producto
   → Desde redes sociales, boca a boca, o navegación directa

2. Navega el catálogo o accede directo a la PDP

3. Selecciona el talle disponible y agrega al carrito

4. Inicia el checkout
   → Ingresa email, nombre, teléfono y dirección de envío
   → Aplica cupón de descuento si tiene uno
   → Revisa el resumen del pedido

5. Es redirigido a Mercado Pago y completa el pago

6. Mercado Pago confirma el pago vía webhook
   → El sistema descuenta el stock
   → El sistema registra los movimientos de inventario
   → El cliente recibe confirmación con número de pedido
```

### Flujo de operación — perspectiva del equipo

```
1. Se carga el nuevo producto en el backoffice
   → Nombre, descripción, fotos, precio, costo
   → Categoría, marca, género
   → Talles disponibles con stock inicial
   → Se registra StockMovement tipo RESTOCK

2. El pedido entra al sistema con estado PENDING

3. El webhook de MP confirma el pago → estado PAID

4. El equipo procesa el pedido → estado PROCESSING
   → Prepara el bulto
   → Carga número de seguimiento y método de envío

5. El pedido es despachado → estado SHIPPED

6. El pedido es entregado → estado DELIVERED
   → Confirmación manual o futura automatización con Andreani
```

---

## KPIs principales

Los KPIs de Member OS v1.0 se organizan en tres categorías:

### KPIs de conversión
| Métrica | Descripción | Referencia inicial |
|---|---|---|
| Tasa de conversión | Sesiones que terminan en compra completada | Benchmark e-commerce AR: 1–3% |
| Abandono de carrito | Carritos creados vs. checkouts iniciados | Objetivo: < 70% |
| Abandono de checkout | Checkouts iniciados vs. pagos completados | Objetivo: < 40% |
| Ticket promedio | Revenue total / número de órdenes | A definir según catálogo |

### KPIs de operación
| Métrica | Descripción |
|---|---|
| Tiempo de procesamiento | Tiempo entre estado PAID y estado SHIPPED |
| Tasa de cancelación | Órdenes canceladas / órdenes totales |
| Precisión de stock | Diferencias entre stock del sistema y stock físico real |
| Pedidos con incidencias | Pedidos que requieren intervención manual por error |

### KPIs de infraestructura
| Métrica | Descripción | Objetivo |
|---|---|---|
| Uptime de la tienda | Disponibilidad del storefront | > 99.5% |
| Tiempo de carga (LCP) | Largest Contentful Paint en mobile | < 2.5s |
| Tiempo de respuesta de API | P95 de las API routes críticas | < 500ms |
| Tasa de error en webhooks | Webhooks de MP fallidos / total | < 1% |

---

## Alcance y límites de la versión 1.0

### Dentro del alcance

- Tienda online completa en dominio propio
- Catálogo de productos con variantes de talle
- Carrito y checkout con validación de cupones
- Pago via Mercado Pago (Checkout Pro)
- Soporte para compra como invitado
- Backoffice completo para gestión de productos, pedidos, clientes, categorías, marcas y cupones
- Historial de movimientos de inventario (StockMovement)
- Campos preparatorios para Andreani y Mercado Libre
- SEO básico
- Deploy en Vercel + PostgreSQL en Railway o Supabase
- Imágenes en Cloudinary con transformaciones on-the-fly

### Fuera del alcance

- Login y registro de clientes con sesión persistente
- Sincronización con Mercado Libre
- Integración automática con Andreani
- Reserva de stock con timeout
- Búsqueda full-text
- Reviews de productos
- Reportes de margen y rentabilidad
- Actualización automática de precios por tipo de cambio
- Múltiples direcciones de envío por cliente
- Subcategorías o jerarquía de categorías
- RBAC granular en el backoffice
- Gestión formal de devoluciones
- Importación/exportación masiva de productos
- Notificaciones push o SMS
- Pasarelas de pago alternativas a Mercado Pago

---

*Este documento es la fuente de verdad sobre la visión y el alcance de Member OS v1.0. Cualquier funcionalidad no listada en la sección de alcance debe ser evaluada antes de incorporarse al desarrollo.*
