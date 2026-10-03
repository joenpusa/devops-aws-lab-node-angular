#!/usr/bin/env bash
set -e

echo "=== [1/6] Creando VPC (10.0.0.0/16) ==="
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=DevOpsLab-VPC},{Key=Project,Value=DevOpsLab},{Key=Environment,Value=dev}]' \
  --query 'Vpc.VpcId' --output text)
echo "VPC Creada: $VPC_ID"

echo "=== [2/6] Creando Internet Gateway (IGW) ==="
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=DevOpsLab-IGW},{Key=Project,Value=DevOpsLab}]' \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID"
echo "IGW Creado y asociado: $IGW_ID"

echo "=== [3/6] Creando Subred Pública (10.0.1.0/24) y Privada (10.0.2.0/24) ==="
PUB_SUBNET_ID=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=DevOpsLab-Public-Subnet}]' \
  --query 'Subnet.SubnetId' --output text)

PRIV_SUBNET_ID=$(aws ec2 create-subnet \
  --vpc-id "$VPC_ID" \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=DevOpsLab-Private-Subnet}]' \
  --query 'Subnet.SubnetId' --output text)
echo "Subred Pública: $PUB_SUBNET_ID | Subred Privada: $PRIV_SUBNET_ID"

echo "=== [4/6] Configurando Tabla de Ruteo Pública hacia Internet ==="
PUB_RT_ID=$(aws ec2 create-route-table \
  --vpc-id "$VPC_ID" \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=DevOpsLab-Public-RT}]' \
  --query 'RouteTable.RouteTableId' --output text)

# Ruta por defecto 0.0.0.0/0 apuntando al Internet Gateway
aws ec2 create-route --route-table-id "$PUB_RT_ID" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID"
# Asociar tabla de ruteo a la subred pública
aws ec2 associate-route-table --subnet-id "$PUB_SUBNET_ID" --route-table-id "$PUB_RT_ID"
echo "Tabla de ruteo pública configurada: $PUB_RT_ID"

echo "=== [5/6] Creando Security Group para Backend (EC2-SG) ==="
EC2_SG_ID=$(aws ec2 create-security-group \
  --group-name "EC2-SG" \
  --description "Security Group para EC2 Backend" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' --output text)

# Reglas de entrada: SSH (22), HTTP (80), HTTPS (443)
aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0
echo "EC2-SG Creado: $EC2_SG_ID"

echo "=== [6/6] Creando Security Group para Base de Datos (RDS-SG) ==="
RDS_SG_ID=$(aws ec2 create-security-group \
  --group-name "RDS-SG" \
  --description "Security Group para RDS MySQL" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' --output text)

# Regla de oro: MySQL (3306) solo accesible DESDE el Security Group del EC2
aws ec2 authorize-security-group-ingress --group-id "$RDS_SG_ID" --protocol tcp --port 3306 --source-group "$EC2_SG_ID"
echo "RDS-SG Creado: $RDS_SG_ID"

# Guardar los IDs en un archivo de entorno local para que otras fases lo puedan consumir
cat << ENV_EOF > infra/.env.network
VPC_ID=$VPC_ID
IGW_ID=$IGW_ID
PUB_SUBNET_ID=$PUB_SUBNET_ID
PRIV_SUBNET_ID=$PRIV_SUBNET_ID
EC2_SG_ID=$EC2_SG_ID
RDS_SG_ID=$RDS_SG_ID
ENV_EOF

echo "=== Red configurada con éxito. Variables guardadas en infra/.env.network ==="
