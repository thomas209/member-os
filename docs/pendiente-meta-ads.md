# Pendiente: preparar el sitio para anunciar en Meta (Facebook/Instagram)

Fecha: 9 de agosto de 2026
Estado: no iniciado — para cuando se decida arrancar con pauta paga en Meta.

## Contexto

Ya hicimos el trabajo de SEO/metadata (título, descripción e imagen dinámica por producto, sitemap, robots.txt — ver `informe-member-club.md`). Eso mejora las vistas previas cuando alguien comparte un link de producto y ayuda al posicionamiento orgánico en Google, pero **no alcanza** para correr campañas de anuncios pagos con seguimiento y optimización real en Meta Ads Manager. Para eso faltan tres piezas.

## 1. Meta Pixel / Conversions API

Código que trackea qué hace un visitante en la web después de entrar desde un anuncio: vio un producto, lo agregó al carrito, compró. Sin esto:

- Meta no puede optimizar la entrega del anuncio para conseguir compras (solo puede optimizar por clicks, que es mucho menos efectivo).
- No se puede armar retargeting ("mostrale de nuevo el anuncio a quien vio el producto pero no compró").
- No hay forma de medir el retorno real de la inversión publicitaria (ROAS).

Implementación: agregar el snippet del Pixel en `app/layout.tsx` (o vía Google Tag Manager) + eventos de servidor (Conversions API) en los puntos clave: vista de producto, agregar al carrito, checkout iniciado, compra confirmada. Estos últimos probablemente van en `app/api/checkout/route.ts` y en el webhook de Mercado Pago.

## 2. Catálogo de productos en Meta Commerce Manager

Para anuncios dinámicos (que muestran automáticamente el producto exacto que cada persona miró) o para etiquetar productos en Instagram Shopping, Meta necesita un feed de productos en su formato propio (distinto del `sitemap.xml` que ya armamos, que es para Google).

Implementación: generar un feed (XML o CSV) con los campos que pide Meta (id, título, descripción, disponibilidad, precio, link, imagen, marca, categoría) a partir de la tabla `Product` existente, y subirlo/sincronizarlo en Meta Commerce Manager.

## 3. Verificación de dominio en Meta Business Manager

Trámite administrativo simple (agregar un meta tag o registro DNS) que Meta pide para habilitar ciertas funciones de campañas y atribución. No requiere desarrollo, solo acceso al Business Manager y al DNS del dominio.

## Orden sugerido

1. Pixel/Conversions API primero — así no se pierden datos de conversión mientras se arma todo lo demás.
2. Verificación de dominio (rápido, en paralelo).
3. Catálogo de productos — cuando se quiera pasar a anuncios dinámicos o Instagram Shopping (no es necesario si al principio se arrancan solo campañas simples de tráfico).
