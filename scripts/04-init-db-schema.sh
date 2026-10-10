#!/usr/bin/env bash
set -e

# ==============================================================================
# Script: 04-init-db-schema.sh
# Propósito: Inicializar el schema SQL y aprovisionar el usuario de aplicación
#            de forma dinámica usando las variables locales de infra/.env.db.
# Cero Secretos: La contraseña del usuario de aplicación se inyecta por variable
#                 y jamás se escribe en el archivo schema.sql ni en Git.
# ==============================================================================

if [ ! -f "infra/.env.db" ]; then
  echo "❌ Error: No se encontró infra/.env.db. Ejecuta primero scripts/03-setup-rds.sh"
  exit 1
fi

source infra/.env.db

echo "=== [0/2] Esperando disponibilidad de MySQL ($DB_HOST:$DB_PORT) ==="
MAX_RETRIES=15
COUNT=0
until MYSQL_PWD="$DB_ADMIN_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_ADMIN_USER" -e "SELECT 1;" >/dev/null 2>&1; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Error: MySQL no respondió tras $MAX_RETRIES intentos."
    exit 1
  fi
  echo "Esperando que MySQL acepte conexiones ($COUNT/$MAX_RETRIES)..."
  sleep 2
done
echo "✔ Conexión a MySQL lista."

echo "=== [1/2] Creando Usuario de Aplicación ($DB_APP_USER) con Mínimo Privilegio ==="

# Crear base de datos si no existía y aprovisionar el usuario con su contraseña dinámica
MYSQL_PWD="$DB_ADMIN_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_ADMIN_USER" << SQL_EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_APP_USER}'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';
ALTER USER '${DB_APP_USER}'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE ON ${DB_NAME}.* TO '${DB_APP_USER}'@'%';
FLUSH PRIVILEGES;
SQL_EOF

echo "✔ Usuario $DB_APP_USER configurado exitosamente sin credenciales expuestas en Git."

echo "=== [2/2] Aplicando Schema DDL y Datos Iniciales (Seed) ==="
MYSQL_PWD="$DB_ADMIN_PASSWORD" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_ADMIN_USER" < infra/db/schema.sql

echo "✔ Schema DDL y seed data aplicados exitosamente en la base de datos '$DB_NAME'."
