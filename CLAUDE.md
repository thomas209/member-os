# Member OS — reglas para cualquier agente de IA o desarrollador

## Base de datos (CRITICO — leer docs/base-de-datos.md)

- La base de produccion ya se borro una vez (13/8/2026) por correr `prisma migrate dev` contra ella. No puede volver a pasar.
- NUNCA correr contra produccion: `prisma migrate dev`, `prisma migrate reset`, `prisma db push`, ni SQL con DROP/DELETE/TRUNCATE.
- `.env` = base LOCAL. `.env.prod-db` = produccion. Nunca poner la URL de produccion en `.env`.
- Cambios de schema: `npm run db:migrate` en local, y a produccion SOLO con `npm run db:deploy-prod`, y solo con OK explicito de Tommy.
- Antes de cualquier cosa que escriba en produccion: `npm run db:backup` y OK explicito de Tommy.
- No borrar ni editar migraciones ya aplicadas. No borrar modelos del schema (ej: QuoteRequest) sin revisar la migracion que genera.
- Todo modelo/columna nueva DEBE tener su migracion en `prisma/migrations/` (nada de `db push`).
