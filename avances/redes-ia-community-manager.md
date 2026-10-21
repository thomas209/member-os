# Redes + IA — "Tu community manager" (Member OS)

Estado al 20/10/2026. Rama `feature/social`, commits locales `74e2c52` y
`1be6bc2`. **Nada subido a producción.** Todo corre local con
`FEATURE_SOCIAL=true` y `NEXT_PUBLIC_FEATURE_SOCIAL=true` (solo en `.env`
local; en producción el módulo queda apagado hasta que Tommy lo prenda).

Spec original: doc "Member OS — Módulo de redes e IA" (Claude Docs).

---

## 1. Qué está hecho

### Seguridad de la base (commit 74e2c52)
- `.env` = base LOCAL (Postgres.app, puerto 5433, `member_os_dev`).
  `.env.prod-db` = producción. `.env.staging` = staging (vacío, sin usar).
- `scripts/db-guard.mjs` bloquea comandos peligrosos contra producción.
- Scripts: `db:backup`, `db:deploy-prod` (con backup y OK), `db:copy-prod-to-local`,
  `db:deploy-staging`, `db:copy-to-staging`. Workflow de backup en `.github`.
- Reglas en `CLAUDE.md` y `docs/base-de-datos.md`.

### Migraciones nuevas (todas solo CREATE, aditivas)
- `20261018200000_add_ai_layer` — BrandVoice, AiGeneration
- `20261018220000_add_social_account` — SocialAccount (token cifrado AES-256-GCM)
- `20261019030000_add_social_template` — SocialTemplate (plantillas Canva)
- `20261019040000_add_scheduled_post` — ScheduledPost
- `20261019220000_add_inbox` — Conversation, Message

### IA (`lib/ai/`)
- Cliente Anthropic con tope mensual (`AI_MONTHLY_BUDGET_USD=5`) y registro de costos.
- Voz de marca: analiza el perfil de Instagram (posts + imágenes) y guarda tono,
  palabras sí/no y ejemplos.
- Captions con datos reales (no inventa cuotas, descuentos ni promos).
- Recomendador de diseño según los posts que ya funcionan en el perfil.
- Asistente de respuestas del inbox: usa productos reales, horarios del local,
  y solo revela un pedido si coinciden número de pedido Y email. Marca cuándo
  necesita una persona.

### Instagram (`lib/social/`)
- Conexión con token (API de Instagram con login de Instagram), cifrado.
- Publicación: post, carrusel (hasta 10) e historias. Doble confirmación.
  Si un producto se quedó sin stock, no publica y deja el post en pausa.
- Imágenes propias con `next/og`: fotos reales de Cloudinary, logo real,
  etiquetas NEW IN / RESTOCK / ULTIMOS TALLES / SALE, formato post 4:5 e historia 9:16.
- Anuncios (historias de horarios, contacto, envíos) con 4 diseños para elegir,
  autocompletados con `lib/storeInfo.ts`.
- Canva conectado (OAuth PKCE): autofill determinístico con datos de la base.

### Inbox (`/admin/social/inbox`, menú "Mensajes")
- Sincroniza conversaciones de Instagram cada 60 s mientras está abierto.
- Sugerir respuesta con IA, editar y enviar. Indicador de ventana de 24 h.

### Community manager (`/admin/social`, commit 1be6bc2)
- Pantalla simple pensada para un usuario común:
  - Estado: Instagram, mensajes sin leer, próximo post agendado.
  - "Para hoy": propuestas sacadas de la tienda (`lib/social/suggestions.ts`):
    nuevos ingresos (3+ = carrusel), restock, ofertas, últimos talles,
    aviso si hace 3+ días que no se publica, cambio de horario de temporada.
  - "Armalo": arma el borrador en un clic (`lib/social/drafts.ts`):
    imágenes reales → Cloudinary → caption IA → borrador.
  - Revisión con vista previa tipo Instagram: editar texto, agendar
    (atajos "Hoy 20:00", "Mañana 13:00"…), publicar ya, descartar, sacar de agenda.
  - Listas de borradores, agendados y publicados.
- Agenda: en local, el panel abierto publica cada minuto lo vencido
  (`/api/admin/social/run-due`). En producción: `/api/social/cron`
  con header `x-cron-secret` = `CRON_SECRET` (cron-job.org cada 10 min).
- El estudio anterior quedó en `/admin/social/crear` (menú "Crear a mano").

### Rutas API nuevas
`/api/admin/social/`: brand-voice, caption, generations/[id], products,
account, analyze, canva, canva/connect, templates, templates/[id], canva-post,
post-image, post-image/save, recommend, posts (GET/POST), posts/[id]
(PATCH texto / DELETE borrador), posts/[id]/publish, posts/[id]/schedule,
posts/[id]/cancel, run-due, suggestions, drafts, announcement/*, inbox/*.
Públicas: `/api/social/canva/callback` (validada por state cifrado),
`/api/social/cron` (validada por secreto).

---

## 2. Qué falta (en orden)

### Tommy, para probar en local
1. `npm run db:migrate` (crea las tablas del inbox) y `npm run dev`.
2. Regenerar el token de Instagram en Meta → app Member OS → Instagram →
   Generate token, y reconectar en "Crear a mano".
3. Probar Mensajes: Actualizar, sugerir respuesta, enviar.
4. Probar Community manager: "Armalo" en una propuesta, agendar a unos
   minutos con el panel abierto.
5. Canva: en las 2 plantillas (`DAHYa03hrI0` ficha producto, `DAHYa5pV2Po`
   SALE) reemplazar el logo inventado por "Logo MEMBER CLUB (real)" y agregar
   campos de autofill (Data). Después cargarlas en el panel.

### Próximas funciones
- Métricas de los posts publicados (alcance, likes, guardados).
- Botón "Crear post" desde la ficha del producto en el admin.
- Respuestas automáticas del bot (Fase B): necesita webhook de Meta, o sea
  producción. Hoy solo sugiere y Tommy envía.
- WhatsApp Business con el número actual del local (Fase C). Antes confirmar
  si la "coexistencia" (app + API en el mismo número) está disponible en Argentina.
- Opcional: horarios del local editables desde el admin (hoy en `lib/storeInfo.ts`).

### Para subir a producción (solo con OK de Tommy)
1. `npm run db:backup`.
2. `npm run db:deploy-prod` (aplica las 5 migraciones nuevas, todas aditivas).
3. Variables en Vercel: `ANTHROPIC_API_KEY`, `AI_MODEL`, `AI_MONTHLY_BUDGET_USD`,
   `SOCIAL_TOKEN_KEY`, `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`,
   `CANVA_REDIRECT_URI` (con el dominio real, y agregarlo en la app de Canva),
   `CRON_SECRET`. Dejar `FEATURE_SOCIAL` apagado hasta probar.
4. Merge de `feature/social` y deploy.
5. Configurar cron-job.org → POST `https://memberclubargentina.com/api/social/cron`
   cada 10 min con header `x-cron-secret`.
6. Pasar la app de Meta a modo Live (hoy está en desarrollo, con @member_ba como tester).

### Ojo (no tocado, solo avisado)
- En Vercel todas las variables están en "Production and Preview": los
  previews usan la base de producción.
- Regenerar los códigos de respaldo MFA de Canva (se compartieron en una captura).

---

## 3. Agregado el 21/10/2026

### Crear borrador desde la ficha del producto (commit e12c844)
- Productos → Editar: recuadro "Instagram" (Post/Historia + etiqueta) → arma el
  borrador y abre el community manager con la vista previa. Solo con FEATURE_SOCIAL.

### "Desde un ejemplo" (commit 4a3a532)
- `/admin/social/referencia`: subís un post que te guste, la IA lo describe como
  receta (`lib/ai/referenceStyle.ts`) y `lib/social/styledPostImage.tsx` lo recrea
  con fotos de Cloudinary, logo real (en blanco con e_negate en fondos oscuros),
  logo de la marca y datos reales. Vista previa gratis; solo el análisis gasta IA.
- Fase 2 pendiente: guardar estilos con nombre y usarlos en un clic.

### Inbox de WhatsApp
- Mismas tablas del inbox (platform "whatsapp"), sin migración nueva.
- `lib/social/whatsappInbox.ts` + webhook público `/api/social/whatsapp/webhook`
  (GET verificación, POST mensajes con firma X-Hub-Signature-256).
- Guarda mensajes de clientes y, con coexistencia, lo respondido desde el celu
  (`smb_message_echoes`). Inbox con filtro Todos/Instagram/WhatsApp.
- Enviar: solo dentro de 24 hs (fuera de eso WhatsApp exige plantillas).
- En local no llegan mensajes reales (solo por webhook). Se probó simulando.
- Hay una conversación "PRUEBA (simulado)" en la base LOCAL, se puede ignorar.

### Inbox de Instagram: estado
- Token nuevo OK (cuenta BUSINESS). La API devuelve 0 conversaciones en modo
  desarrollo aun con tester (orbitk.systems). Se prueba al pasar la app a Live.

### Para producción (agregar a la lista de arriba)
- Variables: WHATSAPP_TOKEN (token permanente de usuario del sistema),
  WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN (cualquier texto largo),
  WHATSAPP_APP_SECRET (secreto de la app de Meta).
- Meta → WhatsApp → Configuración → Webhook:
  `https://memberclubargentina.com/api/social/whatsapp/webhook`, suscribir
  `messages` (y `smb_message_echoes` si hay coexistencia).
- ANTES de conectar el número del local: confirmar coexistencia (app + API en el
  mismo número) disponible en Argentina. Si no, el número deja de andar en la app.
- Instagram: publicar la app (Live), webhook de Instagram y probar con un DM real.
