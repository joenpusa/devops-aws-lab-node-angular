#!/usr/bin/env bash
set -e

# ==============================================================================
# Script: 01-setup-network.sh
# Propósito: Aprovisionar VPC, Subnets, Gateways, Route Tables y Security Groups.
# Idempotencia: Si los recursos ya existen, los detecta y reutiliza sin duplicar.
# ==============================================================================

echo "=== [1/6] Verificando / Creando VPC (10.0.0.0/16) ==="
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=DevOpsLab-VPC" \
  --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "None")

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
  VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=DevOpsLab-VPC},{Key=Project,Value=DevOpsLab},{Key=Environment,Value=dev}]' \
    --query 'Vpc.VpcId' --output text)
  echo "✔ VPC creada: $VPC_ID"
else
  echo "✔ La VPC DevOpsLab-VPC ya existe: $VPC_ID. Reutilizando..."
fi

echo "=== [2/6] Verificando / Creando Internet Gateway (IGW) ==="
IGW_ID=$(aws ec2 describe-internet-gateways \
  --filters "Name=tag:Name,Values=DevOpsLab-IGW" \
  --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null || echo "None")

if [ "$IGW_ID" == "None" ] || [ -z "$IGW_ID" ]; then
  IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=DevOpsLab-IGW},{Key=Project,Value=DevOpsLab}]' \
    --query 'InternetGateway.InternetGatewayId' --output text)
  aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID"
  echo "✔ IGW creado y asociado: $IGW_ID"
else
  echo "✔ El IGW DevOpsLab-IGW ya existe: $IGW_ID. Reutilizando..."
  ATTACHED_VPC=$(aws ec2 describe-internet-gateways \
    --internet-gateway-ids "$IGW_ID" \
    --query "InternetGateways[0].Attachments[?VpcId=='$VPC_ID'].VpcId" --output text 2>/dev/null || echo "")
  if [ -z "$ATTACHED_VPC" ] || [ "$ATTACHED_VPC" == "None" ]; then
    aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID"
    echo "✔ IGW $IGW_ID asociado a VPC $VPC_ID."
  fi
fi

echo "=== [3/6] Verificando / Creando Subred Pública y Privada ==="
PUB_SUBNET_ID=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=DevOpsLab-Public-Subnet" \
  --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")

if [ "$PUB_SUBNET_ID" == "None" ] || [ -z "$PUB_SUBNET_ID" ]; then
  PUB_SUBNET_ID=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block 10.0.1.0/24 \
    --availability-zone us-east-1a \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=DevOpsLab-Public-Subnet}]' \
    --query 'Subnet.SubnetId' --output text)
  echo "✔ Subred Pública creada: $PUB_SUBNET_ID"
else
  echo "✔ Subred Pública ya existe: $PUB_SUBNET_ID. Reutilizando..."
fi

PRIV_SUBNET_ID=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=DevOpsLab-Private-Subnet" \
  --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")

if [ "$PRIV_SUBNET_ID" == "None" ] || [ -z "$PRIV_SUBNET_ID" ]; then
  PRIV_SUBNET_ID=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block 10.0.2.0/24 \
    --availability-zone us-east-1b \
    --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=DevOpsLab-Private-Subnet}]' \
    --query 'Subnet.SubnetId' --output text)
  echo "✔ Subred Privada creada: $PRIV_SUBNET_ID"
else
  echo "✔ Subred Privada ya existe: $PRIV_SUBNET_ID. Reutilizando..."
fi

echo "=== [4/6] Configurando Tabla de Ruteo Pública ==="
PUB_RT_ID=$(aws ec2 describe-route-tables \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=DevOpsLab-Public-RT" \
  --query 'RouteTables[0].RouteTableId' --output text 2>/dev/null || echo "None")

if [ "$PUB_RT_ID" == "None" ] || [ -z "$PUB_RT_ID" ]; then
  PUB_RT_ID=$(aws ec2 create-route-table \
    --vpc-id "$VPC_ID" \
    --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=DevOpsLab-Public-RT}]' \
    --query 'RouteTable.RouteTableId' --output text)
  echo "✔ Tabla de ruteo creada: $PUB_RT_ID"
else
  echo "✔ Tabla de ruteo ya existe: $PUB_RT_ID. Reutilizando..."
fi

HAS_INTERNET_ROUTE=$(aws ec2 describe-route-tables \
  --route-table-ids "$PUB_RT_ID" \
  --query "RouteTables[0].Routes[?DestinationCidrBlock=='0.0.0.0/0'].GatewayId" --output text 2>/dev/null || echo "")

if [ -z "$HAS_INTERNET_ROUTE" ] || [ "$HAS_INTERNET_ROUTE" == "None" ]; then
  aws ec2 create-route --route-table-id "$PUB_RT_ID" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID" >/dev/null
  echo "✔ Ruta 0.0.0.0/0 hacia IGW agregada."
fi

IS_ASSOCIATED=$(aws ec2 describe-route-tables \
  --route-table-ids "$PUB_RT_ID" \
  --query "RouteTables[0].Associations[?SubnetId=='$PUB_SUBNET_ID'].RouteTableAssociationId" --output text 2>/dev/null || echo "")

if [ -z "$IS_ASSOCIATED" ] || [ "$IS_ASSOCIATED" == "None" ]; then
  aws ec2 associate-route-table --subnet-id "$PUB_SUBNET_ID" --route-table-id "$PUB_RT_ID" >/dev/null
  echo "✔ Subred pública asociada a la tabla de ruteo."
fi

echo "=== [5/6] Verificando / Creando Security Group para Backend (EC2-SG) ==="
EC2_SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=EC2-SG" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")

if [ "$EC2_SG_ID" == "None" ] || [ -z "$EC2_SG_ID" ]; then
  EC2_SG_ID=$(aws ec2 create-security-group \
    --group-name "EC2-SG" \
    --description "Security Group para EC2 Backend" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' --output text)
  aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 >/dev/null
  aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 >/dev/null
  aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 >/dev/null
  echo "✔ EC2-SG creado y configurado: $EC2_SG_ID"
else
  echo "✔ EC2-SG ya existe: $EC2_SG_ID. Reutilizando..."
fi

echo "=== [6/6] Verificando / Creando Security Group para Base de Datos (RDS-SG) ==="
RDS_SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=RDS-SG" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")

if [ "$RDS_SG_ID" == "None" ] || [ -z "$RDS_SG_ID" ]; then
  RDS_SG_ID=$(aws ec2 create-security-group \
    --group-name "RDS-SG" \
    --description "Security Group para RDS MySQL" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' --output text)
  aws ec2 authorize-security-group-ingress --group-id "$RDS_SG_ID" --protocol tcp --port 3306 --source-group "$EC2_SG_ID" >/dev/null
  echo "✔ RDS-SG creado y vinculado a EC2-SG: $RDS_SG_ID"
else
  echo "✔ RDS-SG ya existe: $RDS_SG_ID. Reutilizando..."
fi

# Guardar los IDs en infra/.env.network
cat << ENV_EOF > infra/.env.network
VPC_ID=$VPC_ID
IGW_ID=$IGW_ID
PUB_SUBNET_ID=$PUB_SUBNET_ID
PRIV_SUBNET_ID=$PRIV_SUBNET_ID
EC2_SG_ID=$EC2_SG_ID
RDS_SG_ID=$RDS_SG_ID
ENV_EOF

echo ""
echo "=== Red configurada con éxito. Variables guardadas en infra/.env.network ==="
