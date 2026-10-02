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
