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
- [ ] **Fase 02 — Redes y Seguridad (VPC, Subnets, Security Groups)**
- [ ] **Fase 03 — IAM (Roles y Políticas de Mínimo Privilegio)**
- [ ] **Fase 04 — Base de Datos (RDS MySQL)**
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
