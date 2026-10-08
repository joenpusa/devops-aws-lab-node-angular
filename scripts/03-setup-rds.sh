#!/usr/bin/env bash
set -e

# ==============================================================================
# Script: 03-setup-rds.sh
# Propósito: Aprovisionar DB Subnet Group e Instancia RDS MySQL de forma idempotente.
# Cero Secretos: Genera credenciales dinámicas en tiempo de ejecución y las
#                 guarda únicamente en infra/.env.db (ignorado por Git).
# ==============================================================================

# 1. Cargar variables de red existentes
if [ ! -f "infra/.env.network" ]; then
  echo "❌ Error: No se encontró infra/.env.network. Ejecuta primero scripts/01-setup-network.sh"
  exit 1
fi

source infra/.env.network

# 2. Gestión segura de credenciales (Sin contraseñas quemadas en Git)
# Si ya existe infra/.env.db, reutilizamos las credenciales existentes para garantizar idempotencia.
if [ -f "infra/.env.db" ]; then
  source infra/.env.db
  DB_ADMIN_PASS="${DB_ADMIN_PASSWORD}"
  DB_APP_PASS="${DB_APP_PASSWORD}"
fi

# Si no existen, las generamos aleatoriamente de forma segura
if [ -z "$DB_ADMIN_PASS" ]; then
  DB_ADMIN_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
fi

if [ -z "$DB_APP_PASS" ]; then
  DB_APP_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
fi

DB_INSTANCE_ID="devopslab-db"
DB_NAME="devopslab"
DB_ADMIN_USER="admin"
DB_APP_USER="app_user"

echo "=== [1/3] Verificando / Creando DB Subnet Group ==="
DB_SUBNET_GROUP_NAME="devopslab-db-subnet-group"

if aws rds describe-db-subnet-groups --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" >/dev/null 2>&1; then
  echo "✔ El DB Subnet Group $DB_SUBNET_GROUP_NAME ya existe. Reutilizando..."
else
  aws rds create-db-subnet-group \
    --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" \
    --db-subnet-group-description "Subnet group para RDS MySQL en subredes del laboratorio" \
    --subnet-ids "$PUB_SUBNET_ID" "$PRIV_SUBNET_ID" >/dev/null
  echo "✔ DB Subnet Group creado exitosamente: $DB_SUBNET_GROUP_NAME"
fi

echo "=== [2/3] Verificando / Creando Instancia RDS MySQL ==="

if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" >/dev/null 2>&1; then
  echo "✔ La instancia RDS $DB_INSTANCE_ID ya existe. Reutilizando..."
else
  echo "Creando instancia RDS MySQL ($DB_INSTANCE_ID)..."
  aws rds create-db-instance \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --db-name "$DB_NAME" \
    --engine mysql \
    --engine-version "8.0" \
    --master-username "$DB_ADMIN_USER" \
    --master-user-password "$DB_ADMIN_PASS" \
    --db-instance-class db.t3.micro \
    --allocated-storage 20 \
    --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" \
    --vpc-security-group-ids "$RDS_SG_ID" \
    --no-publicly-accessible >/dev/null
  echo "✔ Instancia RDS creada exitosamente: $DB_INSTANCE_ID"
fi

echo "=== [3/3] Obteniendo Endpoint y Exportando Configuración ==="
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null || echo "localhost")

DB_PORT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --query 'DBInstances[0].Endpoint.Port' --output text 2>/dev/null || echo "3306")

if [ "$DB_ENDPOINT" == "None" ] || [ -z "$DB_ENDPOINT" ]; then
  DB_ENDPOINT="localhost"
fi

if [ "$DB_PORT" == "None" ] || [ -z "$DB_PORT" ]; then
  DB_PORT="3306"
fi

# Guardar credenciales de forma local únicamente (ignorado por .gitignore)
cat << ENV_EOF > infra/.env.db
DB_HOST=$DB_ENDPOINT
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_ADMIN_USER=$DB_ADMIN_USER
DB_ADMIN_PASSWORD=$DB_ADMIN_PASS
DB_APP_USER=$DB_APP_USER
DB_APP_PASSWORD=$DB_APP_PASS
DB_INSTANCE_ID=$DB_INSTANCE_ID
DB_SUBNET_GROUP=$DB_SUBNET_GROUP_NAME
ENV_EOF

echo "✔ Parámetros de conexión exportados a infra/.env.db (protegido por .gitignore)"
echo "Host: $DB_ENDPOINT | Puerto: $DB_PORT | Base de datos: $DB_NAME"
echo ""
echo "=== ¡Fase 04 (Infraestructura RDS) aprovisionada con éxito! ==="
