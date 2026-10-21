# Runbook — subir el módulo de redes e IA a producción

Regla de oro: cada paso tiene un "cómo vuelvo atrás". Si algo no da OK, se frena ahí.
Nada de esto se hace sin el OK explícito de Tommy en el momento.

## Fase 0 — Ensayo (no toca producción)
| # | Paso | Comando | Resultado esperado |
|---|---|---|---|
| 0.1 | Ensayo de base sobre una copia de producción | `npm run db:ensayo` | "ENSAYO OK" + `backups/<fecha>-ensayo/INFORME.md` |
| 0.2 | Compilar la versión de producción (con `npm run dev` CORTADO, Ctrl+C) | `npm run build` | Termina sin errores. Después volver a `npm run dev`. |
| 0.3 | Probar la tienda en local | Navegar home → producto → carrito → checkout | Igual que siempre |

## Fase 1 — Código, con el módulo APAGADO
- Preparación: en Vercel, `FEATURE_SOCIAL` y `NEXT_PUBLIC_FEATURE_SOCIAL` NO existen o están en `false`.
- Push de `feature/social` → PR → revisar el preview → merge a `main`.
  - Ojo: los previews de Vercel hoy usan la base de PRODUCCIÓN (variables en "Production and Preview"). Con el módulo apagado el preview no escribe nada nuevo, pero no hay que tocar el panel social en el preview.
- Verificar en producción: home, un producto, carrito, checkout hasta Mercado Pago (sin pagar), admin → pedidos.
- **Vuelta atrás:** Vercel → Deployments → el deploy anterior → "Instant Rollback".

## Fase 2 — Base de datos
- Horario de poco movimiento.
- `npm run db:deploy-prod` (hace backup, pide escribir "APLICAR EN PRODUCCION", migra con `prisma migrate deploy`, hace otro backup y compara filas).
- Esperado: solo se crean las tablas nuevas; todas las existentes con las mismas filas.
- **Vuelta atrás:** las tablas nuevas no las usa nadie con el módulo apagado. Si hiciera falta, restaurar con el `produccion.dump` del ensayo o el backup previo (`pg_restore`), con Tommy presente.

## Fase 3 — Prender el módulo (solo admin)
- Vercel → variables: `ANTHROPIC_API_KEY`, `AI_MODEL`, `AI_MONTHLY_BUDGET_USD`, `SOCIAL_TOKEN_KEY` (la misma de local, si no los tokens guardados no se pueden leer), `CANVA_*`, `CRON_SECRET`, `FEATURE_SOCIAL=true`, `NEXT_PUBLIC_FEATURE_SOCIAL=true` → Redeploy.
- Reconectar Instagram en "Crear a mano" (la base de producción no tiene el token de local).
- Probar: armar un borrador, agendar una historia de prueba.
- **Vuelta atrás:** `FEATURE_SOCIAL=false` + redeploy. El módulo desaparece, la tienda sigue igual.

## Fase 4 — Automatizaciones (otro día)
- cron-job.org → POST `/api/social/cron` cada 1-2 min con header `x-cron-secret`.
- Meta: app en Live, webhook de Instagram, prueba con DM real.
- WhatsApp: confirmar coexistencia ANTES de conectar el número del local; variables `WHATSAPP_*`; webhook `/api/social/whatsapp/webhook`.

## Resultado Fase 0 — 21/10/2026
- 0.1 Ensayo de base: ✓ OK (backups/2026-10-21T22-54-51-324Z-ensayo/INFORME.md).
  7 migraciones pendientes (2 viejas idempotentes + 5 del módulo), ninguna tabla cambió filas.
- 0.2 `npm run build`: ✓ compila sin errores.
- 0.3 Tienda en local: ✓ home, catálogo, producto, checkout, favoritos, stores,
  cuenta, sitemap, robots, feed y admin (pedidos/productos) responden 200, sin errores en consola.

## Resultado Fase 1 y 2 — 21/10/2026
- Fase 1: código en producción (commit 87d799f, deploy Ready 1m 14s), módulo APAGADO.
  Tienda, admin, sitemap y feed OK (2 pasadas). Rutas del módulo responden 404.
- Fase 2: `npm run db:deploy-prod` aplicó 7 migraciones. Backups:
  `backups/2026-10-21T23-29-09-523Z-pre-deploy` y `...T23-30-14-279Z-post-deploy`.
  Todas las tablas existentes con las mismas filas; 7 tablas nuevas vacías; web OK después.
- Bug viejo (no de este deploy): `/catalog?gender=hombre` en minúscula da 500. Los links del menú usan mayúscula.
- Pendiente: Fase 3 (prender el módulo). Repo de GitHub público: pasarlo a privado y recién ahí volver a agregar el backup diario.
