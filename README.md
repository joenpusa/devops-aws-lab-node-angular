# DevOps AWS Lab — CRUD Fullstack & Cloud Infrastructure

Laboratorio práctico de arquitectura en la nube y cultura DevOps.
Simulación y validación local de servicios AWS mediante **Floci** antes del despliegue en la nube real.

## Arquitectura Objetivo
- **Frontend:** Angular en contenedor Docker (ECS/Fargate).
- **Backend:** Node.js + Express (EC2 / Docker).
- **Base de Datos:** RDS MySQL.
- **Almacenamiento:** Amazon S3 (`materials-images-dev`).
- **Auditoría & Logs:** Amazon DynamoDB (`application-logs`).
- **Mensajería & Serverless:** Amazon SQS + AWS Lambda (borrado asíncrono).
- **Seguridad:** Mínimo privilegio en IAM, VPC, Security Groups.
- **CI/CD:** GitHub Actions.

## Entorno Local (Emulación con Floci)
- **Endpoint:** `http://localhost:4566`
- **Consola Web:** `http://localhost:4566/_floci/ui`
- **AWS CLI Profile:** `floci`

---

## Estado del Laboratorio (Roadmap)
- [x] **Fase 01 — Fundamentos & Gobernanza:**
  - [x] Configuración de entorno local con emulador Floci.
  - [x] Configuración de AWS CLI v2 con perfil dedicado `floci`.
  - [x] Bucket S3 inicial (`materials-images-dev`).
  - [x] Presupuesto simulado en AWS Budgets (`$5.00/mes`).
  - [x] Repositorio Git inicializado y vinculado a GitHub.
- [x] **Fase 02 — Redes y Seguridad (VPC, Subnets, Security Groups):**
  - [x] VPC dedicada (`10.0.0.0/16`).
  - [x] Internet Gateway (IGW) asociado.
  - [x] Subred pública (`10.0.1.0/24`) con tabla de ruteo hacia Internet.
  - [x] Subred privada (`10.0.2.0/24`) aislada.
  - [x] Security Group para Backend (`EC2-SG`: 22, 80, 443).
  - [x] Security Group para Base de Datos (`RDS-SG`: 3306 restringido a `EC2-SG`).
  - [x] Script automatizado en `scripts/01-setup-network.sh`.
- [x] **Fase 03 — IAM (Roles y Políticas de Mínimo Privilegio):**
  - [x] Trust Policy para autorizar al servicio `ec2.amazonaws.com`.
  - [x] Política granular de Mínimo Privilegio para Backend Node.js (S3, DynamoDB, SQS).
  - [x] Rol IAM (`EC2BackendRole`) e Instance Profile (`EC2BackendProfile`).
  - [x] Script automatizado e idempotente en `scripts/02-setup-iam.sh`.
- [x] **Fase 04 — Base de Datos (RDS MySQL):**
  - [x] DB Subnet Group en subredes del laboratorio (`devopslab-db-subnet-group`).
  - [x] Instancia administrada RDS MySQL (`devopslab-db`) aislada sin acceso público.
  - [x] Schema DDL relacional con UUIDs nativos e índices optimizados (`infra/db/schema.sql`).
  - [x] Principio de Mínimo Privilegio con usuario de aplicación (`app_user`).
  - [x] Scripts automatizados en `scripts/03-setup-rds.sh` y `scripts/04-init-db-schema.sh`.
- [ ] **Fase 05 — Backend (Node.js + Express + Docker)**
- [ ] **Fase 06 — Frontend (Angular + Nginx + Docker)**
- [ ] **Fase 07 — Serverless & Mensajería (SQS + Lambda)**
- [ ] **Fase 08 — API Gateway & Observabilidad (CloudWatch)**
- [ ] **Fase 09 — CI/CD con GitHub Actions**

---

## Cómo reproducir el proyecto hasta este punto

### 1. Requisitos
- Docker y Docker Compose instalados.
- AWS CLI v2 instalado.

### 2. Iniciar el emulador de nube local (Floci)
```bash
docker run -d --name floci \
  -p 4566:4566 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  floci/floci:latest
```

### 3. Configurar el perfil local de AWS CLI
```bash
aws configure set profile.floci.aws_access_key_id test
aws configure set profile.floci.aws_secret_access_key test
aws configure set profile.floci.region us-east-1
aws configure set profile.floci.endpoint_url http://localhost:4566

# Activar el perfil en tu terminal
export AWS_PROFILE=floci
export AWS_PAGER=""
```

### 4. Crear los recursos base
```bash
# Bucket S3 para imágenes
aws s3 mb s3://materials-images-dev

# Presupuesto mensual (simulado en Floci)
aws budgets create-budget \
  --account-id 000000000000 \
  --budget file://infra/budget.json
```

### 5. Aprovisionar infraestructura de red y seguridad (VPC, Subnets, SGs)
```bash
./scripts/01-setup-network.sh
```

### 6. Aprovisionar Identidad y Mínimo Privilegio (IAM)
```bash
./scripts/02-setup-iam.sh
```

### 7. Aprovisionar Base de Datos (RDS MySQL) e Inicializar Schema
```bash
# Crear DB Subnet Group e instancia RDS MySQL
./scripts/03-setup-rds.sh

# Crear usuario de aplicación (app_user), schema DDL y seed data
./scripts/04-init-db-schema.sh
```



