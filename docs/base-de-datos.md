# Base de datos: reglas y flujo de trabajo

> Contexto: el 13/8/2026 se corrió `prisma migrate dev` desde la Mac con el
> `.env` apuntando a producción. Prisma detectó diferencias, reseteó la base y
> se perdieron todos los productos y clientes. Este flujo existe para que no
> vuelva a pasar.

## Las dos bases

| Base | Dónde | Archivo | Para qué |
|---|---|---|---|
| **Local (desarrollo)** | Postgres.app en la Mac | `.env` → `DATABASE_URL` | Probar todo. Se puede romper sin problema. |
| **Producción** | Railway (`valiant-delight`) | `.env.prod-db` → `PROD_DATABASE_URL` + Vercel | La tienda real. Nunca se toca a mano. |
| **Testing (staging)** | Railway, servicio aparte `member-os-staging` | `.env.staging` → `STAGING_DATABASE_URL` + Vercel Preview | Probar features con una copia de producción antes de pasarlas. |

La URL de producción **nunca** va en `.env`. Así cualquier comando de Prisma en
la Mac solo puede afectar la base local. Ambos archivos están fuera de git.

## Comandos

| Comando | Qué hace | ¿Toca producción? |
|---|---|---|
| `npm run dev` | Levanta la tienda local (bloquea si `.env` no es local) | No |
| `npm run db:migrate` | Crea/aplica una migración nueva en la base local | No (bloqueado) |
| `npm run db:studio` | Abre Prisma Studio sobre la base local | No (bloqueado) |
| `npm run db:backup` | Backup de producción a `backups/` | Solo lectura |
| `npm run db:backup -- local` | Backup de la base local | No |
| `npm run db:copy-to-local` | Copia el último backup de producción a la base local | No |
| `npm run db:deploy-staging` | Aplica migraciones pendientes a staging (bloquea si la URL es prod o local) | No |
| `npm run db:copy-to-staging` | Copia el último backup de producción a staging (pide confirmar) | No |
| `npm run db:deploy-prod` | Aplica migraciones pendientes a producción, con backup antes y después | **Sí, con confirmación** |

## Cómo hacer un cambio en la base (paso a paso)

1. Editar `prisma/schema.prisma`.
2. `npm run db:migrate -- --name descripcion-del-cambio` → crea la migración y la aplica en local.
3. Revisar el `migration.sql` generado. Si tiene `DROP`, `DELETE` o `TRUNCATE`, frenar y pensar.
4. Probar en local (`npm run dev`).
5. Commit + push del código **y** la migración.
6. `npm run db:deploy-prod` → muestra lo pendiente, avisa si hay algo destructivo, hace backup, pide escribir `APLICAR EN PRODUCCION`, aplica y compara filas.

Orden recomendado: aplicar la migración (paso 6) **antes** de que Vercel
despliegue código que use columnas nuevas, para que no haya errores de
"column does not exist".

## Prohibido contra producción

- `prisma migrate dev`
- `prisma migrate reset`
- `prisma db push`
- Borrar o editar archivos de `prisma/migrations/` que ya están aplicados.
- Borrar modelos de `schema.prisma` sin revisar la migración que genera (ej: `QuoteRequest` se mantiene a propósito).

## Backups

- **Automático:** GitHub Actions, todos los días 03:00 (ARG), guarda un `pg_dump` 90 días.
  Se ve en GitHub → Actions → "Backup base de datos". Requiere el secret `PROD_DATABASE_URL`.
- **Manual:** `npm run db:backup` antes de cualquier cambio.
- Railway Hobby no incluye backups propios.

## Restaurar un backup automático (emergencia)

Descargar el `.dump` desde GitHub Actions y restaurarlo **primero en la base
local** para revisarlo:

```
pg_restore --clean --if-exists --no-owner -d postgresql://localhost:5432/member_os_dev member-os-XXXX.dump
```

Restaurar sobre producción solo después de verificarlo y con backup previo.

## Base de testing (staging)

Se usa para probar features grandes (ej: módulo de redes) con datos reales sin tocar producción.

1. `npm run db:backup` → backup de producción (solo lectura).
2. `npm run db:deploy-staging` → crea/actualiza las tablas en staging.
3. `npm run db:copy-to-staging` → carga el backup en staging.

En Vercel, `DATABASE_URL` de **Preview** apunta a staging y la de **Production** a la base real.
Staging tiene datos de clientes: no se comparte ni se usa fuera de las pruebas.
