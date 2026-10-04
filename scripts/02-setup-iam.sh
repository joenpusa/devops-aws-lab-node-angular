#!/usr/bin/env bash
set -e

# ==============================================================================
# Script: 02-setup-iam.sh
# Propósito: Aprovisionar Roles, Políticas e Instance Profiles con Mínimo Privilegio.
# Idempotencia: Si los recursos ya existen, los detecta y reutiliza sin fallar.
# ==============================================================================

echo "=== [1/4] Verificando / Creando Política de Mínimo Privilegio ==="
POLICY_NAME="DevOpsLab-BackendPolicy"
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null || echo "000000000000")
EXPECTED_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

# Comprobación de existencia para garantizar idempotencia
if aws iam get-policy --policy-arn "$EXPECTED_POLICY_ARN" >/dev/null 2>&1; then
  echo "✔ La política $POLICY_NAME ya existe ($EXPECTED_POLICY_ARN). Reutilizando..."
  POLICY_ARN="$EXPECTED_POLICY_ARN"
else
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --description "Politica de minimo privilegio para Backend Node.js (S3, DynamoDB, SQS)" \
    --policy-document file://infra/iam/policy-backend-least-privilege.json \
    --query 'Policy.Arn' --output text)
  echo "✔ Política creada exitosamente: $POLICY_ARN"
fi

echo "=== [2/4] Verificando / Creando IAM Role para EC2 ==="
ROLE_NAME="EC2BackendRole"

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "✔ El rol $ROLE_NAME ya existe. Reutilizando..."
  ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
else
  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --description "Rol de aplicacion para la instancia EC2 Backend" \
    --assume-role-policy-document file://infra/iam/trust-policy-ec2.json \
    --query 'Role.Arn' --output text)
  echo "✔ Rol creado exitosamente: $ROLE_ARN"
fi

echo "=== [3/4] Asociando Política al Rol ==="
# attach-role-policy en AWS CLI es intrínsecamente idempotente (no falla si ya está asociada)
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "$POLICY_ARN"
echo "✔ Política $POLICY_NAME asociada a $ROLE_NAME."

echo "=== [4/4] Verificando / Creando Instance Profile para EC2 ==="
PROFILE_NAME="EC2BackendProfile"

if aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" >/dev/null 2>&1; then
  echo "✔ El Instance Profile $PROFILE_NAME ya existe. Reutilizando..."
else
  aws iam create-instance-profile \
    --instance-profile-name "$PROFILE_NAME" >/dev/null
  echo "✔ Instance Profile creado: $PROFILE_NAME"
fi

# Verificar si el rol ya está en el Instance Profile antes de añadirlo
ATTACHED_ROLES=$(aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" \
  --query "InstanceProfile.Roles[?RoleName=='$ROLE_NAME'].RoleName" --output text 2>/dev/null || echo "")

if [ "$ATTACHED_ROLES" == "$ROLE_NAME" ]; then
  echo "✔ El rol $ROLE_NAME ya está vinculado a $PROFILE_NAME."
else
  aws iam add-role-to-instance-profile \
    --instance-profile-name "$PROFILE_NAME" \
    --role-name "$ROLE_NAME"
  echo "✔ Rol $ROLE_NAME vinculado exitosamente a $PROFILE_NAME."
fi

# Exportar variables de entorno a infra/.env.iam (ignorado por .gitignore)
cat << ENV_EOF > infra/.env.iam
POLICY_NAME=$POLICY_NAME
POLICY_ARN=$POLICY_ARN
ROLE_NAME=$ROLE_NAME
ROLE_ARN=$ROLE_ARN
INSTANCE_PROFILE_NAME=$PROFILE_NAME
ENV_EOF

echo ""
echo "Variables guardadas en infra/.env.iam"
