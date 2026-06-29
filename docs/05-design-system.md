# 05 — Design System

**Proyecto:** Member OS  
**Versión:** 1.0  
**Fecha de actualización:** 2025-06-10  
**Estado:** ✅ Aprobado  
**Rol:** Head of Product Design

---

## Premisa

El design system de Member OS no es una colección de componentes bonitos. Es el lenguaje visual del negocio. Cada decisión — desde el grosor de un borde hasta el timing de una animación — comunica algo sobre Member Club como marca.

La referencia son Nike, Apple, Zara, Aime Leon Dore, Kith y Fear of God Essentials. Todas comparten algo: el producto habla, el sistema visual no grita. La jerarquía es implacable. El espacio en blanco es intencional. La tipografía es precisa.

Member OS hereda esa disciplina.

---

## 1. Filosofía visual

### Qué debe transmitir la experiencia

**Producto original e importado.**
La interfaz debe sentirse tan cuidada como el producto que vende. Un cliente que compra Fear of God Essentials tiene estándares visuales altos. La tienda no puede verse genérica.

**Premium sin ostentación.**
Premium no significa negro y dorado. Significa espacio, precisión tipográfica, imágenes que respiran, y ausencia de elementos innecesarios. Menos es más en cada pantalla.

**Velocidad y fluidez.**
Las transiciones son rápidas. Los estados de carga son discretos. La interfaz responde antes de que el cliente termine de pensar en lo que quiere hacer. La lentitud percibida destruye la percepción de calidad.

**Confianza inmediata.**
Un cliente nuevo que llega desde Instagram tarda menos de 3 segundos en decidir si confía en la tienda. La consistencia visual, los precios visibles y la familiaridad con Mercado Pago construyen esa confianza antes de cualquier texto.

**Minimalismo funcional.**
Cada elemento en pantalla existe porque cumple una función. Los elementos decorativos se justifican solo si refuerzan la identidad de marca. El ruido visual diluye la atención del producto.

---

### Qué evitar

- Gradientes llamativos o efectos glassmorphism complejos.
- Colores de acento saturados compitiendo con las imágenes de producto.
- Tipografías decorativas o display que dificulten la lectura en mobile.
- Sombras profundas y bordes redondeados exagerados (estética de app de delivery).
- Iconos con estilos mixtos (algunos outline, otros filled, otros ilustrativos).
- Micro-animaciones que duren más de 300ms — se perciben como lentas.
- Fondos de color en páginas completas del storefront — solo blanco o gris muy claro.
- Texto sobre imagen sin capa de contraste suficiente.
- Bordes de color sobre inputs en estado normal — solo en focus y error.
- Múltiples niveles de jerarquía tipográfica en la misma sección.

---

## 2. Paleta de colores

El sistema de color de Member OS se construye sobre una base neutral casi monocromática, con un único color de acento para las acciones primarias. Las imágenes de producto son el único elemento que aporta color real a la interfaz.

### Colores primarios

| Token | Nombre | HEX | Uso |
|---|---|---|---|
| `--color-black` | Black | `#0A0A0A` | Texto principal, botones primarios, header |
| `--color-white` | White | `#FFFFFF` | Fondos, texto sobre negro, botones invertidos |
| `--color-accent` | Accent | `#C8A96E` | Color de acento — dorado apagado. CTAs secundarios, badges de oferta, detalles de marca |

**Sobre el acento:** `#C8A96E` es un dorado desaturado, no un amarillo brillante. Evoca calidad y producto importado sin caer en el estereotipo del lujo genérico. Es el color que diferencia Member Club visualmente.

### Colores secundarios — Grises

La escala de grises es el corazón del sistema. Define jerarquía visual sin color.

| Token | HEX | Uso |
|---|---|---|
| `--color-gray-50` | `#FAFAFA` | Fondos de página, fondos de secciones alternadas |
| `--color-gray-100` | `#F4F4F4` | Fondos de cards, inputs en reposo |
| `--color-gray-200` | `#E8E8E8` | Bordes sutiles, divisores, separadores |
| `--color-gray-300` | `#D1D1D1` | Bordes de inputs, bordes de cards |
| `--color-gray-400` | `#A3A3A3` | Placeholders, texto deshabilitado |
| `--color-gray-500` | `#737373` | Texto secundario, labels, metadata |
| `--color-gray-600` | `#525252` | Texto de soporte, descripciones largas |
| `--color-gray-700` | `#404040` | Texto de cuerpo sobre fondos claros |
| `--color-gray-800` | `#262626` | Texto de alto contraste en fondos claros |
| `--color-gray-900` | `#171717` | Texto principal alternativo al black puro |

### Colores de estado

| Token | HEX | Uso |
|---|---|---|
| `--color-success` | `#16A34A` | Confirmación de pago, stock disponible, pedido entregado |
| `--color-success-light` | `#DCFCE7` | Fondo de badges de éxito |
| `--color-warning` | `#D97706` | Stock bajo (≤ 3 unidades), pedido pendiente |
| `--color-warning-light` | `#FEF3C7` | Fondo de badges de advertencia |
| `--color-error` | `#DC2626` | Errores de validación, sin stock, pedido cancelado |
| `--color-error-light` | `#FEE2E2` | Fondo de mensajes de error |
| `--color-info` | `#2563EB` | Información neutral, pedido en proceso |
| `--color-info-light` | `#DBEAFE` | Fondo de badges informativos |

### Colores de fondo

| Token | HEX | Uso |
|---|---|---|
| `--bg-page` | `#FFFFFF` | Fondo de todas las páginas del storefront |
| `--bg-subtle` | `#FAFAFA` | Secciones alternadas, footer, fondos de formularios |
| `--bg-admin` | `#F4F4F4` | Fondo del backoffice |
| `--bg-admin-sidebar` | `#0A0A0A` | Sidebar del backoffice — negro |
| `--bg-overlay` | `rgba(0,0,0,0.5)` | Overlay de drawers y modales |

### Colores de borde

| Token | HEX | Uso |
|---|---|---|
| `--border-subtle` | `#E8E8E8` | Separadores internos, divisores |
| `--border-default` | `#D1D1D1` | Inputs en reposo, cards |
| `--border-strong` | `#A3A3A3` | Inputs en hover, énfasis visual |
| `--border-focus` | `#0A0A0A` | Inputs en focus — negro |
| `--border-error` | `#DC2626` | Inputs con error de validación |

---

## 3. Tipografía

### Fuentes

**Heading font:** `Geist` (Vercel) o `Inter` como fallback.
Ambas son sans-serif de ingeniería, precisas y modernas. Sin serif, sin decoración. Geist tiene un carácter más técnico y contemporáneo — apropiado para una marca que vende producto de autor.

**Body font:** `Inter`
El estándar de facto para interfaces de producto. Legibilidad excepcional en todos los tamaños, especialmente en mobile. Disponible en Google Fonts, zero costo.

**Monospace (uso interno en admin):** `Geist Mono`
Para SKUs, números de pedido, códigos de cupón y datos técnicos en el backoffice.

```css
--font-heading: 'Geist', 'Inter', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'Geist Mono', 'Fira Code', monospace;
```

---

### Escala tipográfica — Mobile

| Token | Tamaño | Line Height | Weight | Uso |
|---|---|---|---|---|
| `--text-xs` | 11px | 16px | 400 | Labels muy pequeños, metadata |
| `--text-sm` | 13px | 20px | 400 | Texto de soporte, captions |
| `--text-base` | 15px | 24px | 400 | Cuerpo de texto principal |
| `--text-md` | 17px | 26px | 500 | Precios, nombres de producto en cards |
| `--text-lg` | 20px | 28px | 600 | Subtítulos de sección |
| `--text-xl` | 24px | 32px | 700 | Títulos de página, nombre de producto en PDP |
| `--text-2xl` | 30px | 38px | 700 | Precio en PDP, H1 del home |
| `--text-3xl` | 36px | 44px | 800 | Hero — solo en imágenes de campaña |

### Escala tipográfica — Desktop

| Token | Tamaño | Line Height | Weight | Uso |
|---|---|---|---|---|
| `--text-xs` | 12px | 16px | 400 | Labels muy pequeños |
| `--text-sm` | 14px | 20px | 400 | Texto secundario |
| `--text-base` | 16px | 24px | 400 | Cuerpo principal |
| `--text-md` | 18px | 28px | 500 | Precios, nombres en cards |
| `--text-lg` | 22px | 30px | 600 | Subtítulos |
| `--text-xl` | 28px | 36px | 700 | H2, títulos de sección |
| `--text-2xl` | 36px | 44px | 700 | H1, precio en PDP |
| `--text-3xl` | 48px | 56px | 800 | Hero |
| `--text-4xl` | 64px | 72px | 800 | Campañas editoriales |

### Jerarquía de headings

```
H1 — Nombre del producto en PDP, título principal del home
     Mobile: 24px / 700  |  Desktop: 36px / 700
     Font: --font-heading
     Color: --color-black
     Letter-spacing: -0.02em  ← tracking apretado, estilo editorial

H2 — Títulos de sección (Novedades, Destacados, También te puede interesar)
     Mobile: 20px / 600  |  Desktop: 22px / 600
     Letter-spacing: -0.01em

H3 — Subtítulos dentro de secciones, headers de cards en admin
     Mobile: 17px / 600  |  Desktop: 18px / 600

H4 — Labels de grupo, encabezados de formulario
     Mobile: 15px / 500  |  Desktop: 16px / 500
     Letter-spacing: 0.05em  ← uppercase tracking para secciones
     Text-transform: uppercase
```

### Estilos especiales

**Precio principal:** `--text-2xl`, weight 700, `--color-black`
**Precio tachado:** `--text-base`, weight 400, `--color-gray-400`, `text-decoration: line-through`
**Precio de oferta:** `--text-2xl`, weight 700, `--color-error` o `--color-accent`
**Marca del producto:** `--text-sm`, weight 500, `--color-gray-500`, `letter-spacing: 0.08em`, `text-transform: uppercase`
**Número de pedido:** `--font-mono`, weight 600, `--color-black`
**SKU:** `--font-mono`, `--text-xs`, `--color-gray-400`

---

## 4. Sistema de espaciado

El espaciado se basa en una escala de 4px. Cada valor es múltiplo de 4.

```
--space-0:   0px
--space-1:   4px    ← Separación mínima entre elementos inline
--space-2:   8px    ← Padding interno de chips y badges
--space-3:   12px   ← Gap entre elementos relacionados
--space-4:   16px   ← Padding base de componentes, gap de grids mobile
--space-5:   20px   ← Padding de cards, margin entre secciones pequeñas
--space-6:   24px   ← Padding horizontal de página en mobile
--space-8:   32px   ← Margin entre secciones en mobile
--space-10:  40px   ← Margin entre secciones grandes en mobile
--space-12:  48px   ← Padding de secciones en desktop
--space-16:  64px   ← Margin entre bloques principales en desktop
--space-20:  80px   ← Padding de secciones hero
--space-24:  96px   ← Grandes separaciones editoriales
```

### Márgenes de página

| Breakpoint | Margin horizontal |
|---|---|
| Mobile (< 768px) | 16px (--space-4) |
| Tablet (768–1024px) | 32px (--space-8) |
| Desktop (1024–1280px) | 48px (--space-12) |
| Wide (> 1280px) | Auto — contenido centrado a max 1280px |

### Padding de componentes

| Componente | Padding |
|---|---|
| Botón primario (md) | 12px 24px |
| Botón primario (sm) | 8px 16px |
| Botón primario (lg) | 16px 32px |
| Input | 12px 16px |
| Card de producto | 0 (imagen full bleed) + 12px en info |
| Modal | 24px |
| Drawer | 24px |
| Toast | 12px 16px |
| Badge | 4px 8px |
| Chip | 6px 12px |

---

## 5. Grid system

### Mobile (< 768px)

```
Columns:     2
Gutter:      12px
Margin:      16px
Max width:   100%
```

Excepciones mobile:
- Hero y galerías de producto: 0 margin (full bleed)
- Checkout: 1 columna, full width

### Tablet (768px – 1023px)

```
Columns:     3
Gutter:      16px
Margin:      32px
Max width:   100%
```

### Desktop (1024px – 1279px)

```
Columns:     12 (sistema flexible)
Gutter:      24px
Margin:      48px
Max width:   1280px centrado
```

Uso en catálogo desktop:
- Grid de productos: 3 columnas (4 cols de 12)
- Con sidebar: sidebar 3 cols + grid 9 cols (products en 3 columnas)

### Wide (≥ 1280px)

```
Max width del contenido: 1280px
Centrado automático
Margin: auto
```

Las páginas nunca superan 1280px de ancho de contenido. El fondo se extiende al 100% del viewport.

### Excepciones full-bleed

Estos elementos ignoran el grid y ocupan el 100% del viewport:
- Hero del home
- Galería de la PDP en mobile
- Header y footer
- Overlays de drawer y modal

---

## 6. Componentes base

### Buttons

#### Variantes

**Primary**
```
Background: --color-black
Color:      --color-white
Border:     none
Radius:     0px  ← Sin border radius. Decisión de identidad de marca.
Font:       --text-sm, weight 600, letter-spacing: 0.06em, uppercase
Padding:    12px 24px

Hover:      Background #262626 (--color-gray-800)
Active:     Background #404040 (--color-gray-700)
Disabled:   Background --color-gray-300, Color --color-gray-400, cursor: not-allowed
Loading:    Spinner blanco centrado, texto oculto, mismo background
```

**Secondary (outline)**
```
Background: transparent
Color:      --color-black
Border:     1.5px solid --color-black
Radius:     0px
Font:       igual que primary

Hover:      Background --color-gray-50
Active:     Background --color-gray-100
Disabled:   Border --color-gray-300, Color --color-gray-400
```

**Ghost**
```
Background: transparent
Color:      --color-black
Border:     none
Font:       igual que primary

Hover:      Background --color-gray-100
Uso:        Acciones secundarias, botones de navegación interna
```

**Destructive**
```
Background: --color-error
Color:      --color-white
Uso:        Cancelar pedido, eliminar producto (solo admin)
```

**Accent**
```
Background: --color-accent (#C8A96E)
Color:      --color-black
Uso:        CTAs de campaña, promociones, hero editorial
```

#### Tamaños

| Tamaño | Altura | Font size | Padding H |
|---|---|---|---|
| sm | 32px | 12px | 16px |
| md (default) | 44px | 13px | 24px |
| lg | 52px | 15px | 32px |
| full | 44px, width 100% | 13px | 24px |

---

### Inputs

```
Height:         44px (mínimo touch target)
Background:     --color-white
Border:         1px solid --color-gray-300
Border-radius:  0px
Font:           --text-base, --color-black
Padding:        12px 16px
Placeholder:    --color-gray-400

Focus:
  Border: 1.5px solid --color-black
  Outline: none
  Box-shadow: none  ← Sin glow. Solo el borde cambia.

Error:
  Border: 1.5px solid --color-error
  + Mensaje de error debajo, --text-sm, --color-error

Disabled:
  Background: --color-gray-100
  Color: --color-gray-400
  Cursor: not-allowed

Label:
  Font: --text-sm, weight 500, --color-gray-700
  Margin-bottom: 4px
  Requerido: asterisco --color-error sin espacio antes
```

---

### Selects

Misma estética que los inputs. El icono de chevron es el único indicador visual.

```
Apariencia nativa eliminada: appearance: none
Icono:  Chevron down, 16px, --color-gray-500, posición right 12px
Fondo:  --color-white (nunca gris)
```

---

### Badges

Pequeñas etiquetas de estado. Sin border radius o con 2px máximo.

| Variante | Background | Color | Uso |
|---|---|---|---|
| `default` | `--color-gray-100` | `--color-gray-700` | Estado neutral |
| `success` | `--color-success-light` | `--color-success` | Entregado, disponible |
| `warning` | `--color-warning-light` | `--color-warning` | Pendiente, stock bajo |
| `error` | `--color-error-light` | `--color-error` | Sin stock, cancelado |
| `info` | `--color-info-light` | `--color-info` | En proceso |
| `accent` | `--color-accent` | `--color-black` | Oferta, nuevo, destacado |
| `black` | `--color-black` | `--color-white` | Novedad, exclusivo |

Font: `--text-xs`, weight 500, letter-spacing 0.04em, uppercase

---

### Chips

Filtros activos, tags de selección.

```
Background: --color-black
Color:      --color-white
Border:     none
Radius:     0px
Padding:    6px 12px
Font:       --text-sm, weight 500
+ Ícono X: 12px, clickeable, elimina el chip

Inactivo (seleccionable):
  Background: --color-white
  Border: 1px solid --color-gray-300
  Color: --color-gray-700
  Hover: Border --color-black
```

---

### Tabs

```
Layout:     Row horizontal, bottom border completo --color-gray-200
Tab activa: Bottom border 2px --color-black, color --color-black, weight 600
Tab inactiva: Sin border, color --color-gray-500, weight 400
Hover:      Color --color-black
Font:       --text-sm
Padding:    0 0 12px 0, gap 24px entre tabs
Transición: border-color 150ms ease
```

---

### Cards (base)

```
Background: --color-white
Border:     1px solid --color-gray-200
Radius:     0px
Shadow:     none  ← Sin sombras en el sistema base
Overflow:   hidden

Hover (desktop):
  Border: 1px solid --color-gray-400
  Transition: border-color 150ms ease
```

Las cards de producto tienen su especificación completa en la sección de Componentes E-commerce.

---

### Modals

```
Overlay:     --bg-overlay, z-index 50
Container:   --color-white, padding 24px, max-width 480px
             centrado en viewport — vertical y horizontal
Radius:      0px
Animation:   Fade in + scale de 0.96 a 1, 200ms ease-out
Close:       Ícono X en la esquina superior derecha, 20px

Mobile:      Bottom sheet en lugar de modal centrado
             Slide up desde el fondo, border-radius 0
             Máximo 90vh de altura, scroll interno si contenido excede
```

---

### Drawers

```
Tipo:       Side panel (desde la derecha para el carrito, desde la izquierda para el menú)
Width:      Mobile: 85vw, max 380px  |  Desktop: 420px fijo
Overlay:    --bg-overlay, cierra al hacer click
Animation:  Slide desde el borde correspondiente, 200ms ease-out
Header:     Sticky dentro del drawer — título + botón cerrar
Footer:     Sticky dentro del drawer — CTAs principales
Body:       Scrollable, padding 24px
```

---

### Toasts

```
Posición:   Bottom center en mobile, top right en desktop
Width:      Mobile: 100% - 32px de margen  |  Desktop: 320px
Background: --color-black (default) / --color-success (éxito)
Color:      --color-white
Radius:     0px
Padding:    12px 16px
Font:       --text-sm, weight 500
Duration:   Auto-dismiss en 4 segundos
Animation:  Slide up desde abajo (mobile) / Slide in desde la derecha (desktop), 200ms ease-out
Icono:      Opcional a la izquierda del texto, 16px
```

---

## 7. Componentes e-commerce

### Product Card

```
┌──────────────────┐
│                  │
│   IMAGEN 4:5     │  ← Full bleed, sin padding
│                  │
│ [NUEVO] [OFERTA] │  ← Badges superpuestos, esquina superior
│                  │
├──────────────────┤
│ NIKE             │  ← Marca: --text-xs, uppercase, --color-gray-500
│ Air Force 1 White│  ← Nombre: --text-md, weight 500, --color-black
│ $89.000          │  ← Precio: --text-md, weight 700
│ ~~$105.000~~     │  ← Precio tachado: --text-sm, --color-gray-400
└──────────────────┘

Estados:
- Normal: borde sutil --color-gray-100 en el área de info
- Hover (desktop): segunda imagen si existe, fade 200ms
- Agotado: overlay --bg-overlay al 30% sobre la imagen + badge "Agotado"
- Oferta: badge accent sobre imagen + precio tachado visible
```

### Product Gallery

```
Mobile:
  Imagen principal: 100vw, ratio 4:5, object-fit cover
  Navegación: swipe horizontal nativo
  Indicadores: dots centrados debajo, 6px de diámetro
               Activo: --color-black  |  Inactivo: --color-gray-300
  Thumbnails: no se muestran en mobile

Desktop:
  Layout: grid 2 columnas — thumbnails 80px a la izquierda, imagen principal derecha
  Thumbnails: 80x100px, border 1px solid transparent
              Activo: border --color-black
              Hover: border --color-gray-400
  Imagen principal: max-height 700px, object-fit contain, fondo --color-gray-50
  Zoom: cursor zoom-in, overlay de imagen al 150% en hover

Imágenes:
  Ratio obligatorio: 4:5 en todas
  Background por defecto si carga lenta: --color-gray-100
  Placeholder de carga: shimmer animation (ver sección de animaciones)
```

### Variant Selector (Talles)

```
Label:
  "Talle"  ← --text-sm, weight 500, --color-gray-700, uppercase, letter-spacing 0.05em

Botones de talle:
  Tamaño:     min 44x44px — touch target obligatorio
  Background: --color-white
  Border:     1px solid --color-gray-300
  Radius:     0px
  Font:       --text-sm, weight 500, --color-black
  Gap:        8px entre botones

  Estado disponible (default):
    Border: 1px solid --color-gray-300
    Background: --color-white

  Estado hover:
    Border: 1px solid --color-black

  Estado seleccionado:
    Background: --color-black
    Color: --color-white
    Border: 1px solid --color-black

  Estado sin stock:
    Background: --color-white
    Color: --color-gray-300
    Border: 1px solid --color-gray-200
    Texto tachado: line-through
    Cursor: not-allowed
    Sin hover effect

  Estado "últimas unidades" (stock ≤ 3):
    Badge pequeño debajo del botón: "Últimas X" en --text-xs, --color-warning

Texto de estado dinámico debajo del selector:
  Sin selección:    "Seleccioná un talle"  → --color-gray-400
  Seleccionado:     vacío
  Sin stock:        "Sin stock en este talle"  → --color-error
```

### Cart Drawer

```
Header (sticky):
  "Carrito" ← H3, --color-black
  Cantidad de items: "(3)" ← --color-gray-500
  Botón cerrar: ícono X, 20px

Body (scrollable):
  Cada ítem:
    ┌─────────────────────────────────────┐
    │ [IMG 80x100] Nombre del producto    │
    │              Marca · Talle: 42      │
    │              $89.000                │
    │              [−] 1 [+]   [🗑]       │
    └─────────────────────────────────────┘
  Imagen: 80x100px, object-fit cover, border 1px --color-gray-200
  Nombre: --text-sm, weight 500
  Metadata: --text-xs, --color-gray-500
  Precio: --text-sm, weight 700
  Controles de cantidad: botones ghost pequeños + número centrado
  Eliminar: ícono trash, --color-gray-400, hover --color-error

Divider entre ítems: 1px solid --color-gray-100

Footer (sticky):
  Subtotal:
    "Subtotal"     $124.000  ← --text-sm + --text-md weight 700
  Nota de envío:
    "El costo de envío se calcula en el checkout" ← --text-xs, --color-gray-400
  Botones:
    [Seguir comprando]  ← Ghost, full width
    [COMPRAR]           ← Primary, full width  ← CTA principal
```

### Checkout Summary

Panel de resumen visible en el checkout. En mobile es colapsable.

```
Header colapsable (mobile):
  "Tu pedido (2 ítems)"  ↓   $124.000  ← preview del total

Expandido:
  Lista de ítems compacta:
    [IMG 48x60] Nombre · Talle  ←→  $89.000

  Líneas de precio:
    Subtotal              $124.000
    Descuento (CUPÓN10)   − $12.400  ← --color-success
    Envío                   $2.500
    ──────────────────────────────
    Total                 $114.100  ← --text-lg, weight 700

Desktop: siempre visible como columna derecha, no colapsable
```

### Order Status

Usado en la página de confirmación y en el seguimiento de pedido.

```
Timeline vertical:
  ● Pedido recibido     ✓  ← Estado completado: ícono check, --color-success
  ● Pago confirmado     ✓
  ● En preparación      ●  ← Estado actual: punto sólido --color-black, texto weight 600
  ○ Despachado             ← Estado futuro: círculo vacío, --color-gray-300, texto --color-gray-400
  ○ Entregado

Línea conectora entre estados: 1px solid --color-gray-200
                                Completada: 2px solid --color-success

Badge de estado actual:
  Usa la paleta de badges de estado
  Prominente debajo del número de pedido en la confirmación
```

---

## 8. Componentes admin

### Sidebar

```
Width:        240px (colapsable a 64px en desktop)
Background:   --bg-admin-sidebar (#0A0A0A)
Color:        --color-white

Logo/brand:
  Padding: 24px 20px
  "MEMBER OS" ← --text-sm, weight 700, letter-spacing 0.1em

Nav items:
  Height: 44px
  Padding: 0 20px
  Font: --text-sm, weight 400, --color-gray-400
  Ícono: 18px, --color-gray-500, margin-right 12px
  Hover: background rgba(255,255,255,0.06), color --color-white
  Activo: background rgba(255,255,255,0.1), color --color-white, weight 600
          border-left: 2px solid --color-accent

Badge de notificación:
  Posición: inline después del label
  Background: --color-error
  Color: --color-white
  Tamaño: 18px diámetro, --text-xs

Mobile admin:
  El sidebar se transforma en header con menú hamburguesa
  Mismo tratamiento que el storefront mobile
```

### Tables

```
Header:
  Background: --color-gray-50
  Font: --text-sm, weight 600, --color-gray-500, uppercase, letter-spacing 0.05em
  Height: 44px
  Border-bottom: 2px solid --color-gray-200

Rows:
  Height: 52px mínimo
  Font: --text-sm, --color-gray-800
  Border-bottom: 1px solid --color-gray-100
  Hover: background --color-gray-50

Columnas numéricas: text-align right, --font-mono
Columnas de estado: badge correspondiente
Columnas de acciones: botones ghost o íconos, alineados a la derecha

Tabla responsive (mobile admin):
  Las columnas secundarias se ocultan
  Se mantienen: número/id, cliente/nombre, estado, acciones
  El row expandible muestra el detalle completo
```

### Filters (Admin)

```
Layout: fila horizontal encima de la tabla
Componentes: inputs de búsqueda + selects + botón "Limpiar filtros"

Búsqueda:
  Input con ícono de lupa a la izquierda (dentro del input)
  Placeholder: "Buscar por #, email, nombre..."
  Width: 280px fijo en desktop, 100% en mobile

Selects de filtro:
  Width: auto, mínimo 140px
  Mismo estilo que selects base
  Label implícita en el placeholder: "Estado ▼", "Categoría ▼"

Botón limpiar:
  Ghost, --text-sm, visible solo cuando hay filtros activos
  "Limpiar filtros" con ícono X
```

### Dashboard Cards (métricas)

```
┌─────────────────────────────┐
│  Ventas hoy                 │  ← Label: --text-sm, --color-gray-500
│                             │
│  $45.200                    │  ← Valor: --text-2xl, weight 700
│                             │
│  ↑ 12% vs ayer              │  ← Delta: --text-sm, --color-success / --color-error
└─────────────────────────────┘

Background: --color-white
Border: 1px solid --color-gray-200
Padding: 20px 24px
Sin sombra, sin radius
Grid: 3 o 4 columnas en desktop, 2 en tablet, 1 en mobile
```

### Forms (Admin)

Los formularios del backoffice siguen el mismo sistema de inputs base con ajustes de layout:

```
Secciones: separadas por H3 + divider --color-gray-200
Labels: siempre visibles, nunca como placeholder
Campos requeridos: asterisco rojo
Grupos de campos: grid 2 columnas en desktop cuando son campos relacionados
                  (nombre / apellido, precio / comparePrice)
Acciones del form:
  Posición: footer sticky del panel o al final del formulario
  [Guardar borrador]  ← Secondary (outline)
  [Publicar / Guardar] ← Primary
  Gap: 12px entre botones
```

---

## 9. Iconografía

### Estilo

**Lucide Icons** como librería base. Es el set de iconos por defecto de shadcn/ui y se integra nativamente con Next.js y React.

Estilo: line icons (outline), stroke-width 1.5px. Nunca filled, nunca ilustrativos.
La consistencia del stroke es la regla más importante. Un ícono filled en un set outline rompe la coherencia visual.

### Tamaños

| Token | Tamaño | Uso |
|---|---|---|
| `icon-xs` | 12px | Badges, inline en texto pequeño |
| `icon-sm` | 16px | Labels, inputs, botones small |
| `icon-md` | 20px | Botones medium, nav del backoffice |
| `icon-lg` | 24px | Header del storefront, acciones principales |
| `icon-xl` | 32px | Estados vacíos, confirmaciones |
| `icon-2xl` | 48px | Ilustraciones de estado (empty state, error page) |

### Colores

Los íconos heredan el color del texto del elemento padre (`currentColor`) en todos los casos excepto:
- Estados de error: `--color-error`
- Estados de éxito: `--color-success`
- Íconos decorativos en el sidebar admin: `--color-gray-500`

### Íconos del sistema

| Ícono | Nombre Lucide | Uso |
|---|---|---|
| Menú | `Menu` | Hamburguesa mobile |
| Cerrar | `X` | Cerrar drawer, modal, chips |
| Buscar | `Search` | Buscador |
| Carrito | `ShoppingBag` | Header, CTA |
| Corazón | `Heart` | Wishlist (v2) |
| Chevron | `ChevronDown/Right` | Selects, acordeones |
| Flecha | `ArrowLeft` | Botón volver |
| Check | `Check` | Confirmación, estado exitoso |
| Alerta | `AlertCircle` | Errores, advertencias |
| Info | `Info` | Información |
| Trash | `Trash2` | Eliminar |
| Editar | `Pencil` | Editar registro |
| Ojo | `Eye` | Ver detalle, preview |
| Más | `Plus` | Agregar |
| Filtro | `SlidersHorizontal` | Panel de filtros |
| Envío | `Truck` | Estado de envío |
| Paquete | `Package` | Pedido en preparación |
| Etiqueta | `Tag` | Cupones, ofertas |
| Usuario | `User` | Clientes, perfil |
| Gráfico | `BarChart2` | Métricas del dashboard |

---

## 10. Animaciones

### Principios

- **Funcionales antes que decorativas.** Una animación debe ayudar al usuario a entender qué pasó o qué va a pasar.
- **Velocidad por encima de todo.** En e-commerce, la animación no puede ser el cuello de botella.
- **Easing natural.** `ease-out` para elementos que entran. `ease-in` para elementos que salen. `ease-in-out` para transiciones de estado.
- **Máximo 300ms.** Ninguna animación de UI dura más de 300ms.

### Timing estándar

```css
--duration-instant:  100ms   /* Hover de colores, feedback inmediato */
--duration-fast:     150ms   /* Cambios de estado de inputs, botones */
--duration-normal:   200ms   /* Drawers, modales, toasts */
--duration-slow:     300ms   /* Transiciones de página, acordeones */
```

### Hover states

```css
/* Botón primary */
transition: background-color var(--duration-fast) ease-out;

/* Cards de producto (desktop) */
transition: border-color var(--duration-fast) ease-out;

/* Imagen de producto en card (hover → segunda imagen) */
transition: opacity var(--duration-normal) ease-out;

/* Links de navegación */
transition: color var(--duration-instant) ease-out;

/* Íconos */
transition: color var(--duration-instant) ease-out;
```

### Transiciones de componentes

**Drawer (carrito, menú):**
```css
transform: translateX(100%);  /* Estado cerrado — carrito */
transform: translateX(0);     /* Estado abierto */
transition: transform var(--duration-normal) ease-out;

/* Overlay */
opacity: 0 → 1
transition: opacity var(--duration-normal) ease-out;
```

**Modal / Bottom sheet:**
```css
/* Modal desktop */
transform: scale(0.96);  → scale(1)
opacity: 0 → 1
transition: transform var(--duration-normal) ease-out,
            opacity var(--duration-normal) ease-out;

/* Bottom sheet mobile */
transform: translateY(100%) → translateY(0)
transition: transform var(--duration-normal) ease-out;
```

**Toast:**
```css
/* Mobile: sube desde abajo */
transform: translateY(100%) → translateY(0)
/* Desktop: entra desde la derecha */
transform: translateX(100%) → translateX(0)
transition: transform var(--duration-normal) ease-out;
```

**Acordeón / Colapsable:**
```css
max-height: 0 → contenido
overflow: hidden
transition: max-height var(--duration-slow) ease-in-out;
/* El chevron rota 180deg */
transition: transform var(--duration-normal) ease-in-out;
```

### Microinteracciones

**Botón de agregar al carrito — feedback de éxito:**
El texto del botón cambia momentáneamente a "¡Agregado!" con un check, durante 1.5 segundos, luego vuelve al estado original. Sin animación de escala o bounce — solo el cambio de contenido.

**Badge del carrito:**
Al agregar un ítem, el número del badge hace un scale de 1 a 1.2 y vuelve a 1, en 200ms ease-out. Sutil, funcional.

**Selector de talle — al seleccionar:**
El botón seleccionado hace una transición de background de 150ms. Sin escala, sin sombra.

**Input focus:**
El borde transiciona de --color-gray-300 a --color-black en 150ms. Sin glow, sin sombra.

**Shimmer de carga (skeleton):**
Para cards de producto mientras cargan.
```css
background: linear-gradient(90deg, #F4F4F4 25%, #E8E8E8 50%, #F4F4F4 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

**Transición entre páginas:**
Fade simple de 150ms. Sin slide, sin zoom — la velocidad es el valor, no el espectáculo.

---

## 11. Responsive rules

### Breakpoints

```css
--breakpoint-sm:   640px   /* Teléfonos grandes */
--breakpoint-md:   768px   /* Tablets */
--breakpoint-lg:   1024px  /* Desktop pequeño */
--breakpoint-xl:   1280px  /* Desktop estándar */
--breakpoint-2xl:  1536px  /* Desktop wide */
```

### Reglas por breakpoint

#### Mobile (< 768px) — diseño base

- Grid de productos: 2 columnas
- Header: logo + hamburguesa + búsqueda + carrito
- Menú: drawer lateral
- Filtros de catálogo: bottom sheet
- Carrito: drawer lateral 85vw
- PDP: imagen full-bleed, selector de talles visible sin scroll, CTA sticky en el fondo
- Checkout: una columna, resumen colapsable
- Modal: bottom sheet desde abajo
- Sidebar admin: hidden, reemplazado por header con hamburguesa

#### Tablet (768px – 1023px)

- Grid de productos: 3 columnas
- Header: comienza a mostrar links de navegación (si el espacio lo permite)
- Filtros: puede aparecer como sidebar colapsable
- PDP: imagen en 50% izquierda, info en 50% derecha
- Checkout: una columna con resumen lateral si el viewport lo permite
- Sidebar admin: colapsado (solo íconos) con tooltip en hover

#### Desktop (≥ 1024px)

- Grid de productos: 3 columnas (con sidebar de filtros) o 4 (sin sidebar)
- Header: navegación completa visible
- Filtros: sidebar siempre visible a la izquierda
- PDP: galería con thumbnails + imagen principal + panel de info lateral
- Checkout: dos columnas — formulario izquierda, resumen derecha
- Sidebar admin: expandido con texto y íconos, 240px

### Componentes que cambian de comportamiento

| Componente | Mobile | Desktop |
|---|---|---|
| Modal | Bottom sheet | Overlay centrado |
| Filtros | Bottom sheet | Sidebar |
| Galería | Swipe horizontal | Thumbnails + principal |
| Resumen checkout | Colapsable | Siempre visible |
| Tabla admin | Columnas ocultas | Completa |
| Sidebar admin | Oculto / header | Panel lateral |
| Tooltips | Taps (no hover) | Hover |
| Breadcrumbs | Ocultos | Visibles |

---

## 12. Accesibilidad

### Contraste de color

Todos los pares de color/background cumplen WCAG 2.1 nivel AA como mínimo.

| Par | Ratio | Nivel |
|---|---|---|
| `--color-black` sobre `--color-white` | 18.1:1 | AAA |
| `--color-black` sobre `--color-gray-50` | 17.1:1 | AAA |
| `--color-white` sobre `--color-black` | 18.1:1 | AAA |
| `--color-gray-700` sobre `--color-white` | 7.5:1 | AAA |
| `--color-gray-500` sobre `--color-white` | 4.6:1 | AA |
| `--color-error` sobre `--color-white` | 5.9:1 | AA |
| `--color-accent` sobre `--color-black` | 6.2:1 | AA |
| Texto sobre `--color-gray-100` | Usar mínimo `--color-gray-700` | AA |

**Regla crítica:** no usar `--color-gray-400` (#A3A3A3) como color de texto sobre fondos blancos — ratio 2.7:1, no cumple AA. Solo para placeholders y decoración.

### Focus states

El focus es visible, consistente y nunca se elimina con `outline: none` sin reemplazarlo.

```css
/* Focus visible para teclado — aplica a todos los elementos interactivos */
:focus-visible {
  outline: 2px solid var(--color-black);
  outline-offset: 2px;
}

/* Botón primary */
:focus-visible {
  outline: 2px solid var(--color-black);
  outline-offset: 3px;
}

/* Input */
:focus-visible {
  border-color: var(--color-black);
  outline: none;  ← El borde del input reemplaza el outline
}
```

El focus nunca se oculta para usuarios que navegan con teclado. Si se usa `:focus { outline: none }` en algún componente, debe ir acompañado de `:focus-visible` con estilos equivalentes.

### Navegación por teclado

**Tab order:** sigue el orden visual de izquierda a derecha, arriba hacia abajo. No se manipula `tabindex` salvo en componentes de modal y drawer.

**Modal y drawer:**
- Al abrirse, el foco se mueve al primer elemento interactivo dentro del modal/drawer
- El foco queda "atrapado" dentro del modal/drawer mientras está abierto (focus trap)
- `Tab` y `Shift+Tab` solo navegan por los elementos dentro del componente
- `Escape` cierra el modal/drawer y devuelve el foco al elemento que lo abrió

**Selector de talles:**
- Navegable con Tab (cada botón de talle es un `<button>`)
- Activable con Enter y Space
- Estado sin stock: `disabled` y `aria-disabled="true"`

**Carrito:**
- `aria-live="polite"` en el badge del carrito para anunciar cambios de cantidad
- El drawer tiene `role="dialog"` y `aria-modal="true"`
- `aria-label="Carrito de compras"` en el botón del header

**Formulario de checkout:**
- Todos los inputs tienen `<label>` asociado con `for`/`id`
- Los errores de validación usan `aria-describedby` para asociar el mensaje al input
- `aria-invalid="true"` en inputs con error
- `autocomplete` attributes en todos los campos (ver sección 11 de `04-ux-ui.md`)

**Imágenes:**
- Imágenes de producto: `alt` descriptivo — "Nike Air Force 1 White, vista lateral"
- Imágenes decorativas: `alt=""`
- Imágenes de iconos: `aria-hidden="true"` si hay texto adyacente que los describe

### Semántica HTML

- Usar `<button>` para acciones, `<a>` para navegación. Nunca `<div>` clickeable sin rol.
- Headings en orden jerárquico — no saltar de H1 a H3.
- Listas de productos en `<ul>/<li>`.
- El formulario de checkout en un `<form>` con `novalidate` (validación JS) y submit manejado.
- `<nav>` para la navegación principal, `<main>` para el contenido principal, `<aside>` para el carrito/sidebar.

---

## 13. Reglas que no deben romperse

Estas son las reglas visuales absolutas del sistema. No tienen excepciones en v1.0.

### Reglas de forma

1. **Border radius: 0px en todos los componentes interactivos.** Botones, inputs, cards, badges, modales. El sistema es recto. Sin excepciones.
2. **Sin sombras box-shadow en el storefront.** La jerarquía se construye con bordes y espacio, no con sombras. Las sombras están permitidas solo en el backoffice para separar el contenido del sidebar.
3. **Las imágenes de producto son siempre 4:5.** Sin excepciones. Si una imagen no tiene esa proporción, se recorta. El layout no se adapta a las imágenes.

### Reglas tipográficas

4. **No más de dos pesos tipográficos en la misma sección.** Máximo regular (400) y bold (700). Agregar medium (500) solo para precios y labels de formulario.
5. **Headings usan letter-spacing negativo** (entre -0.01em y -0.03em). El tracking apretado es parte de la identidad de marca.
6. **Las marcas de producto se escriben siempre en uppercase con letter-spacing 0.08em.** "NIKE", "ADIDAS", "FEAR OF GOD". No "Nike", no "nike".
7. **El precio nunca se muestra sin el símbolo de moneda y sin separador de miles.** Siempre "$89.000", nunca "89000" ni "89,000".

### Reglas de color

8. **El acento (#C8A96E) no se usa en texto corriente.** Solo en badges, CTAs de campaña, y detalles decorativos. Nunca como color de cuerpo de texto.
9. **El fondo de todas las páginas del storefront es blanco puro (#FFFFFF).** Sin fondos de color, sin gradientes, sin texturas.
10. **Los estados de error son siempre #DC2626.** No naranja, no amarillo, no un rojo diferente.

### Reglas de comportamiento

11. **El carrito es siempre un drawer. Nunca una página separada.**
12. **El checkout nunca redirige a una página intermedia entre el formulario y Mercado Pago.** El flujo es directo.
13. **Los talles son siempre botones. Nunca dropdown, nunca radio buttons con estilo custom.**
14. **Ninguna animación dura más de 300ms.**
15. **El botón de "Agregar al carrito" es siempre sticky en la parte inferior de la pantalla en mobile.** Nunca se esconde al hacer scroll.

### Reglas de accesibilidad

16. **`outline: none` sin reemplazo está prohibido.** Si se elimina el outline nativo, debe reemplazarse con un focus-visible equivalente.
17. **Todos los inputs tienen label visible. Nunca solo placeholder.**
18. **El contraste mínimo para texto es 4.5:1 (WCAG AA).** Sin excepciones para texto de contenido.

### Reglas de contenido

19. **Las imágenes de producto tienen siempre alt text descriptivo.** Nunca vacío excepto para imágenes puramente decorativas.
20. **El número de pedido siempre se muestra en tipografía monoespaciada.** Es un identificador, no un texto narrativo.

---

*Este documento define el lenguaje visual de Member OS v1.0. Las decisiones de implementación en código (CSS variables, componentes React, Tailwind config) se derivan directamente de este documento y no pueden contradecirlo.*

*El design system es un documento vivo. Los cambios requieren actualizar este documento antes de implementarse en código.*
