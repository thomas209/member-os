#!/bin/bash
# Configuracion UNICA de la base local de desarrollo (Postgres.app).
# No se conecta a produccion salvo para leer (backup de solo lectura).
set -e
cd "$(dirname "$0")/.."
PG=/Applications/Postgres.app/Contents/Versions/latest/bin
export PGPORT="${PGPORT:-5433}"   # Postgres.app de Tommy corre en 5433
LOCAL_URL="postgresql://$(whoami)@localhost:$PGPORT/member_os_dev"
SHADOW_URL="postgresql://$(whoami)@localhost:$PGPORT/member_os_shadow"

echo "== 1/6 Verificando que .env ya apunte a la base local"
node scripts/db-guard.mjs

echo "== 2/6 Creando bases locales (member_os_dev y member_os_shadow)"
$PG/psql -lqt | cut -d'|' -f1 | grep -qw member_os_dev || $PG/createdb member_os_dev
$PG/psql -lqt | cut -d'|' -f1 | grep -qw member_os_shadow || $PG/createdb member_os_shadow

echo "== 3/6 Aplicando migraciones en la base LOCAL"
npx prisma migrate deploy
npx prisma generate   # regenera el cliente con las tablas nuevas

echo "== 4/6 Verificando que schema.prisma y las migraciones coincidan"
DIFF=$(npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$SHADOW_URL" --script)
if echo "$DIFF" | grep -qiE "ALTER|CREATE|DROP"; then
  echo "⚠️  El schema y las migraciones NO coinciden:"; echo "$DIFF"; exit 1
fi
echo "✓ Schema y migraciones coinciden"

echo "== 5/6 Backup de produccion (solo lectura)"
node scripts/db-backup.mjs

echo "== 6/6 Copiando ese backup a la base local"
node scripts/db-copy-prod-to-local.mjs

echo ""
echo "✓ Listo. Base local: $LOCAL_URL"
