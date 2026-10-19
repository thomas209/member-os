# PENDIENTE — Base de datos segura (dev separada + backups)

Creado: 29/9/2026. Contexto completo y reglas en `docs/base-de-datos.md`.

## Qué pasó (resumen)

- **13/8/2026 18:10:** se corrió `prisma migrate dev` desde la Mac con `.env` apuntando a PRODUCCIÓN.
  Prisma reseteó la base y se perdieron productos y clientes.
- Las columnas del CRM de clientes (`loginToken`, `loginTokenExpiresAt`, `notes`, `tags`) se habían
  creado con `db push`, sin migración, y no volvieron. Resultado: `/admin/customers` daba error 500
  y el checkout dejó de guardar clientes.
- **29/9/2026 — ARREGLADO:** se agregaron esas columnas en producción (solo `ADD COLUMN`, verificado
  con backup antes/después: ninguna tabla perdió filas). Se vincularon los 3 pedidos a sus clientes.
- **La ruleta se sacó del proyecto** (archivada en `_archivo-ruleta/`, fuera de git). No fue la causa
  del borrado, pero se decidió no seguir con ella por ahora.

## Ya hecho (en el repo)

- [x] Commit `586393b`: migración `20260929200000_restore_customer_crm_columns` + script de backup. **Falta `git push`.**
- [x] Migración `20260813180000_add_quote_request` recuperada del historial + modelo `QuoteRequest` en el schema
      (la tabla existe en producción; así schema, migraciones y base coinciden). *Sin commitear.*
- [x] Traba de seguridad `scripts/db-guard.mjs`: bloquea `npm run dev`, `db:migrate`, `db:reset`, `db:push`, `db:studio`
      si la base no es local. Probada. *Sin commitear.*
- [x] Scripts `db:backup`, `db:copy-to-local`, `db:deploy-prod` + `scripts/setup-local-db.sh`. *Sin commitear.*
- [x] Workflow de backup diario `.github/workflows/db-backup.yml` (03:00 ARG, 90 días). *Sin commitear.*
- [x] Reglas escritas: `docs/base-de-datos.md` y `CLAUDE.md`. *Sin commitear.*

## PENDIENTE (en orden)

### 1. Instalar Postgres.app en la Mac
- [ ] Descargar de https://postgresapp.com → arrastrar a Aplicaciones → abrir → **Initialize** → que diga "Running".

### 2. Separar `.env` (lo hace Claude)
- [ ] Guardar copia de `.env` actual como `.env.backup-2026-09-29`.
- [ ] Crear `.env.prod-db` con `PROD_DATABASE_URL="<la URL de Railway que hoy está en .env>"`.
- [ ] Cambiar `DATABASE_URL` en `.env` a `postgresql://thomascaronia@localhost:5432/member_os_dev`.

### 3. Armar la base local (lo corre Tommy, un solo comando)
- [ ] `cd ~/member-OS && ./scripts/setup-local-db.sh`
      Crea la base local, aplica migraciones, verifica que schema == migraciones, hace backup de producción
      (solo lectura) y copia los datos a la base local.
- [ ] Verificar con `npm run db:backup -- local` que las cantidades coincidan con producción.
- [ ] Probar `npm run dev` y que la tienda local cargue con los productos.

### 4. Subir todo a GitHub
- [ ] Revisar y commitear: `CLAUDE.md`, `docs/`, `scripts/`, `.github/`, `package.json`, `prisma/`.
- [ ] `git push` (la web no cambia: son scripts, docs y un modelo sin uso).

### 5. Activar el backup diario
- [ ] GitHub → repo `member-os` → Settings → Secrets and variables → Actions → New secret:
      nombre `PROD_DATABASE_URL`, valor = la URL de Railway. (Lo carga Tommy, no Claude.)
- [ ] Actions → "Backup base de datos" → **Run workflow** para probarlo y ver que genere el `.dump`.

### 6. Registrar la migración del 29/9 en producción
- [ ] `npm run db:deploy-prod`. La única pendiente va a ser `20260929200000_restore_customer_crm_columns`
      (ya aplicada a mano, usa `IF NOT EXISTS`, no cambia nada). Sirve como primer uso real y
      seguro del flujo nuevo, y deja registrada la migración.

## Para después (no urgente)

- [ ] Agregar `pg` como devDependency (los scripts lo usan; hoy está instalado pero no declarado).
      Ojo: el repo tiene 3 lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`); definir cuál usa Vercel y borrar los otros.
- [ ] En `.env` local hay claves de producción (Mercado Pago, Resend, Cloudinary). Usar claves de prueba
      en local para no generar cobros o mails reales al probar.
- [ ] Borrar archivos sueltos del repo: `_q.mjs`, `_tmp_check_admin.mjs`, `reset-admin-password.mjs` (revisar antes).
- [ ] Evaluar Railway Pro (~USD 20/mes) si se quieren backups nativos con restauración a un punto en el tiempo.
- [ ] Volver a pensar la ruleta (u otras funciones nuevas) usando el flujo seguro: migración en local → `db:deploy-prod`.

## Reglas de oro

1. La URL de producción **nunca** en `.env`.
2. Nunca `migrate dev` / `migrate reset` / `db push` contra producción.
3. Cambios a producción **solo** con `npm run db:deploy-prod`, con backup.
4. Todo cambio de schema con su migración en `prisma/migrations/`.

## 1/10/2026 — columna `Product.pickupLocation`

- Se agrego en produccion con `prisma db execute` (solo `ADD COLUMN IF NOT EXISTS ... DEFAULT 'PINAMAR'`),
  con backup antes y despues (`backups/2026-10-01T20-40-53-570Z-local` y `...T20-42-14-152Z-local`): mismas
  cantidades en todas las tablas y ningun otro dato de Product cambio.
- Migracion: `prisma/migrations/20261001120000_add_product_pickup_location`. Igual que la del 29/9, se aplico
  con `db execute`, asi que NO figura en `_prisma_migrations`. Cuando se termine el setup de base local hay que
  marcarla como aplicada (`prisma migrate resolve --applied ...`) antes de usar `db:deploy-prod`.
