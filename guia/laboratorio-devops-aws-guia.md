# Laboratorio DevOps AWS — CRUD Node.js + Angular

## Objetivo

Desplegar una aplicación CRUD sencilla en AWS utilizando servicios administrados y prácticas de DevOps, seguridad, mínimo privilegio, contenedores, serverless y CI/CD.

La aplicación tendrá:

- **Frontend:** Angular dentro de Docker, desplegado en ECS/Fargate.
- **Backend:** Node.js + Express desplegado inicialmente en EC2.
- **Base de datos:** MySQL en RDS.
- **Logs funcionales/auditoría:** DynamoDB.
- **Imágenes de materiales:** S3.
- **Borrado asíncrono de cuentas:** SQS + Lambda.
- **DNS:** Route 53.
- **API:** API Gateway.
- **HTTPS:** ACM.
- **Seguridad:** IAM, Security Groups y posteriormente AWS WAF.
- **CI/CD:** GitHub Actions + Amazon ECR + ECS/EC2.
- **Observabilidad:** CloudWatch.
- **Control de costos:** AWS Budgets/Cost Explorer.

> **Objetivo principal:** construir el laboratorio por fases, verificando cada componente antes de continuar y apagando/eliminando los recursos que puedan generar costos.

---

# 0. Arquitectura objetivo

```text
                                  INTERNET
                                      │
                                      ▼
                                  Route 53
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
             app.midominio.com                    api.midominio.com
                    │                                   │
                    ▼                                   ▼
               ECS/Fargate                        API Gateway
               Angular                                │
                                                       ▼
                                                   EC2 Node.js
                                                       │
                           ┌───────────────────────────┼────────────────────┐
                           │                           │                    │
                           ▼                           ▼                    ▼
                         RDS                       DynamoDB                S3
                         MySQL                       Logs                Imágenes
                           ▲
                           │
                           │
                       Lambda
                           ▲
                           │
                          SQS
```

## Componentes adicionales

```text
GitHub
   │
   ▼
GitHub Actions
   │
   ├── Backend → Docker → ECR → EC2
   │
   └── Frontend → Docker → ECR → ECS/Fargate
```

Seguridad:

```text
IAM
 ├── EC2 Role
 ├── ECS Task Execution Role
 └── Lambda Execution Role

Security Groups
 ├── EC2-SG
 └── RDS-SG

ACM
 └── HTTPS

AWS WAF
 └── Se agrega en una fase posterior
```

---

# 1. Reglas del laboratorio

- [ ] Trabajar inicialmente en **una sola región AWS**.
- [ ] Evitar NAT Gateway en la primera versión.
- [ ] Evitar Load Balancer hasta que sea necesario.
- [ ] No utilizar `AdministratorAccess` para las aplicaciones.
- [ ] No exponer RDS directamente a Internet.
- [ ] No hacer público el bucket S3.
- [ ] No almacenar secretos directamente en el repositorio Git.
- [ ] Etiquetar los recursos.
- [ ] Crear presupuesto y alertas antes de desplegar infraestructura.
- [ ] Al terminar cada sesión, revisar recursos activos.
- [ ] Eliminar o detener recursos facturables que no se necesiten.

Tags sugeridos:

```text
Project     = DevOpsLab
Environment = dev
Owner       = Jorge
ManagedBy   = Manual / GitHubActions
```

---

# 2. Control de costos

## Objetivo

Configurar AWS Billing antes de crear infraestructura.

### Tareas

- [ ] Entrar a AWS Billing.
- [ ] Revisar el Free Tier disponible para la cuenta.
- [ ] Revisar créditos promocionales, si existen.
- [ ] Crear un AWS Budget.
- [ ] Configurar alerta al 50%.
- [ ] Configurar alerta al 80%.
- [ ] Configurar alerta al 100%.
- [ ] Revisar Cost Explorer.
- [ ] Entender qué recursos generan costos aunque estén aparentemente inactivos.

### Presupuesto sugerido

```text
Budget mensual: USD 5
```

> El presupuesto no impide automáticamente los cargos. Sirve principalmente para recibir alertas.

---

# 3. Preparación de la aplicación

## 3.1 Backend

Tecnologías:

```text
Node.js
Express
MySQL
Docker
```

Endpoints CRUD sugeridos:

```text
POST   /api/auth/login
POST   /api/users
GET    /api/users
GET    /api/users/:id
DELETE /api/users/:id

POST   /api/materials
GET    /api/materials
GET    /api/materials/:id
PUT    /api/materials/:id
DELETE /api/materials/:id

DELETE /api/account
```

### Tareas

- [ ] Crear backend Node.js + Express.
- [ ] Crear conexión MySQL.
- [ ] Crear migraciones/schema.
- [ ] Implementar CRUD de usuarios.
- [ ] Implementar CRUD de materiales.
- [ ] Implementar autenticación.
- [ ] Implementar validaciones.
- [ ] Implementar manejo de errores.
- [ ] Crear endpoint `/health`.
- [ ] Crear Dockerfile.
- [ ] Probar localmente.
- [ ] Crear `.env.example`.
- [ ] Verificar que `.env` esté en `.gitignore`.

---

# 4. Base de datos local

## Modelo mínimo

### users

```text
id
name
email
password_hash
created_at
updated_at
```

### materials

```text
id
name
description
price
image_key
created_at
updated_at
```

### Relaciones

```text
users
  │
  └── account ownership / audit references

materials
  │
  └── image_key → S3
```

### Tareas

- [ ] Crear base de datos local.
- [ ] Crear tablas.
- [ ] Crear índices.
- [ ] Crear usuario de aplicación diferente del usuario root.
- [ ] Probar CRUD.
- [ ] Preparar script de inicialización.

---

# 5. Frontend Angular

### Tareas

- [ ] Crear aplicación Angular.
- [ ] Crear login.
- [ ] Crear pantalla de usuarios.
- [ ] Crear CRUD de materiales.
- [ ] Crear carga de imágenes.
- [ ] Crear manejo de errores HTTP.
- [ ] Configurar URL de API mediante environment.
- [ ] Crear Dockerfile.
- [ ] Servir Angular mediante Nginx.
- [ ] Probar contenedor localmente.

Arquitectura local:

```text
Browser
   │
   ▼
Angular/Nginx
   │
   ▼
Node.js/Express
   │
   ▼
MySQL
```

---

# 6. AWS IAM

## Objetivo

Implementar mínimo privilegio desde el principio.

### Roles sugeridos

```text
EC2BackendRole
ECSExecutionRole
LambdaDeleteUserRole
```

## EC2BackendRole

Debe poder realizar únicamente las operaciones necesarias.

Ejemplo conceptual:

```text
DynamoDB
 └── PutItem

S3
 └── PutObject

SQS
 └── SendMessage
```

### Tareas

- [ ] Crear IAM Role para EC2.
- [ ] Asociarlo posteriormente a la instancia.
- [ ] Crear política específica para DynamoDB.
- [ ] Crear política específica para S3.
- [ ] Crear política específica para SQS.
- [ ] No utilizar Access Key/Secret Key dentro del código.
- [ ] Verificar permisos con pruebas reales.

---

# 7. VPC

## Primera versión

Para mantener el laboratorio sencillo:

```text
VPC
10.0.0.0/16

Public subnet
10.0.1.0/24

Private subnet
10.0.2.0/24
```

### Tareas

- [ ] Crear VPC.
- [ ] Crear Internet Gateway.
- [ ] Crear subnet pública.
- [ ] Crear subnet privada.
- [ ] Crear route table pública.
- [ ] Asociar subnet pública.
- [ ] Crear route table privada.
- [ ] Asociar subnet privada.
- [ ] Verificar conectividad.

> No crear NAT Gateway inicialmente porque puede generar costos innecesarios.

---

# 8. RDS MySQL

## Objetivo

Crear la base de datos administrada.

Configuración inicial sugerida:

```text
Engine: MySQL
Deployment: Single-AZ
Instance: clase elegible para Free Tier
Public access: No
```

### Security Group

Crear:

```text
RDS-SG
```

Regla:

```text
TCP 3306
Source: EC2-SG
```

No utilizar:

```text
0.0.0.0/0
```

### Tareas

- [ ] Crear DB subnet group.
- [ ] Crear RDS MySQL.
- [ ] Crear Security Group.
- [ ] Desactivar acceso público.
- [ ] Crear usuario de aplicación.
- [ ] Crear base de datos.
- [ ] Probar conexión desde EC2.
- [ ] Ejecutar schema.
- [ ] Ejecutar CRUD desde Node.js.
- [ ] Verificar que RDS no sea accesible directamente desde Internet.

---

# 9. EC2 + Backend Node.js

## Configuración

```text
EC2
Amazon Linux
Clase elegible para laboratorio
```

### Security Group

```text
EC2-SG
```

Reglas iniciales:

```text
SSH 22
Source: TU_IP/32

HTTP 80
Source: 0.0.0.0/0

HTTPS 443
Source: 0.0.0.0/0
```

### Tareas

- [ ] Crear instancia EC2.
- [ ] Asociar `EC2-SG`.
- [ ] Asociar `EC2BackendRole`.
- [ ] Conectarse por SSH.
- [ ] Actualizar sistema.
- [ ] Instalar Docker.
- [ ] Instalar AWS CLI.
- [ ] Instalar Git.
- [ ] Clonar backend.
- [ ] Configurar variables.
- [ ] Ejecutar contenedor.
- [ ] Configurar Nginx si es necesario.
- [ ] Crear endpoint `/health`.
- [ ] Probar desde Internet.
- [ ] Probar conexión EC2 → RDS.

---

# 10. Amazon S3 — imágenes

## Bucket

Ejemplo:

```text
materials-images-dev
```

### Configuración

- [ ] Crear bucket.
- [ ] Bloquear acceso público.
- [ ] Desactivar políticas públicas innecesarias.
- [ ] Crear estructura lógica de objetos.

Ejemplo:

```text
materials/
  1/
    image.jpg
  2/
    image.jpg
```

### Backend

El backend debe guardar en MySQL únicamente la referencia:

```text
image_key
```

Ejemplo:

```text
materials/123/image.jpg
```

### Tareas

- [ ] Crear bucket.
- [ ] Mantener Block Public Access activado.
- [ ] Crear IAM policy para EC2.
- [ ] Implementar upload.
- [ ] Implementar lectura.
- [ ] Implementar eliminación.
- [ ] Probar permisos.
- [ ] Verificar que un usuario no pueda acceder directamente a objetos no autorizados.

---

# 11. DynamoDB — logs funcionales

## Tabla

```text
application-logs
```

Claves:

```text
PK
SK
```

Ejemplo:

```text
PK = USER#123
SK = 2026-10-01T21:30:00Z
```

Documento:

```json
{
  "userId": 123,
  "action": "CREATE_MATERIAL",
  "resource": "material",
  "resourceId": 55,
  "timestamp": "2026-10-01T21:30:00Z"
}
```

### Eventos a registrar

- [ ] LOGIN
- [ ] LOGIN_FAILED
- [ ] CREATE_USER
- [ ] DELETE_USER
- [ ] CREATE_MATERIAL
- [ ] UPDATE_MATERIAL
- [ ] DELETE_MATERIAL
- [ ] UPLOAD_IMAGE
- [ ] DELETE_IMAGE
- [ ] REQUEST_DELETE_ACCOUNT

### Tareas

- [ ] Crear tabla.
- [ ] Definir PK/SK.
- [ ] Configurar capacidad adecuada para laboratorio.
- [ ] Crear IAM policy.
- [ ] Implementar escritura desde backend.
- [ ] Implementar consulta de logs.
- [ ] Probar mínimo privilegio.

---

# 12. Amazon ECR

## Objetivo

Almacenar las imágenes Docker.

Repositorios:

```text
angular-frontend
node-backend
```

### Tareas

- [ ] Crear repositorio `angular-frontend`.
- [ ] Crear repositorio `node-backend`.
- [ ] Autenticarse desde Docker.
- [ ] Construir imagen Angular.
- [ ] Construir imagen Node.
- [ ] Etiquetar imágenes.
- [ ] Hacer push a ECR.
- [ ] Verificar imágenes.
- [ ] Definir política de limpieza de imágenes antiguas posteriormente.

---

# 13. ECS + Fargate — Frontend

## Arquitectura

```text
ECS Cluster
   │
   └── Service
        │
        └── Task
             │
             └── Angular/Nginx
```

### Tareas

- [ ] Crear ECS Cluster.
- [ ] Crear Task Definition.
- [ ] Definir CPU.
- [ ] Definir memoria.
- [ ] Configurar container port 80.
- [ ] Configurar ECS Task Execution Role.
- [ ] Utilizar imagen desde ECR.
- [ ] Crear ECS Service.
- [ ] Ejecutar una tarea.
- [ ] Verificar logs.
- [ ] Verificar acceso al frontend.
- [ ] Probar conexión frontend → API.

### Control de costos

Cuando termine la práctica:

```text
desired count = 0
```

o eliminar el servicio.

---

# 14. API Gateway

## Objetivo

Exponer la API mediante un endpoint administrado.

Ejemplo:

```text
https://api.midominio.com
```

### Primera versión

```text
API Gateway
      │
      ▼
EC2 Node.js
```

### Rutas

```text
ANY /{proxy+}
```

o rutas específicas:

```text
GET    /users
POST   /users
GET    /materials
POST   /materials
PUT    /materials/{id}
DELETE /materials/{id}
DELETE /account
```

### Tareas

- [ ] Crear HTTP API.
- [ ] Crear integration.
- [ ] Configurar rutas.
- [ ] Probar endpoint.
- [ ] Verificar headers.
- [ ] Verificar CORS.
- [ ] Probar autenticación.
- [ ] Probar errores.
- [ ] Revisar métricas.

---

# 15. AWS Certificate Manager — HTTPS

## Objetivo

Utilizar HTTPS.

### Tareas

- [ ] Crear certificado público.
- [ ] Solicitar certificado para `app.midominio.com`.
- [ ] Solicitar certificado para `api.midominio.com`.
- [ ] Validar dominio.
- [ ] Verificar estado `Issued`.
- [ ] Asociar certificado donde corresponda.
- [ ] Probar HTTPS.
- [ ] Verificar que HTTP redireccione a HTTPS donde corresponda.

---

# 16. Route 53

## Dominio

Ejemplo:

```text
midominio.com
```

Registros:

```text
app.midominio.com
api.midominio.com
```

### Tareas

- [ ] Registrar dominio si se desea utilizar Route 53 Registrar.
- [ ] Crear/confirmar Hosted Zone.
- [ ] Configurar DNS.
- [ ] Crear registro para frontend.
- [ ] Crear registro para API.
- [ ] Verificar propagación.
- [ ] Probar dominio.
- [ ] Probar HTTPS.

### Costos a controlar

- Registro anual del dominio.
- Hosted Zone.
- Consultas DNS.

---

# 17. SQS + Lambda — borrado de cuenta

## Flujo

```text
DELETE /account
       │
       ▼
Node.js
       │
       ▼
SQS
       │
       ▼
Lambda
       │
       ├── RDS
       ├── DynamoDB
       └── S3
```

## Mensaje

```json
{
  "userId": 123
}
```

## Lambda

Responsabilidades:

1. Eliminar información del usuario en RDS.
2. Eliminar logs relacionados en DynamoDB.
3. Eliminar imágenes asociadas en S3.
4. Eliminar relaciones adicionales.
5. Registrar resultado.
6. Manejar errores.

### Tareas

- [ ] Crear SQS Queue.
- [ ] Crear IAM Role para Lambda.
- [ ] Dar permisos mínimos sobre RDS/DynamoDB/S3.
- [ ] Crear Lambda.
- [ ] Configurar trigger SQS → Lambda.
- [ ] Implementar proceso.
- [ ] Probar mensaje manualmente.
- [ ] Probar eliminación real.
- [ ] Probar fallo controlado.
- [ ] Verificar reintentos.
- [ ] Revisar Dead Letter Queue posteriormente.

---

# 18. Seguridad del backend

## Autenticación

- [ ] Implementar JWT.
- [ ] Expiración corta del access token.
- [ ] Implementar refresh token si aplica.
- [ ] Validar roles/permisos.
- [ ] No guardar passwords en texto plano.

## Fuerza bruta

Primera fase:

```text
express-rate-limit
```

Ejemplo conceptual:

```text
POST /login

Máximo:
5 intentos/minuto/IP
```

### Tareas

- [ ] Rate limiting.
- [ ] Validación de input.
- [ ] CORS restringido.
- [ ] Helmet.
- [ ] Sanitización.
- [ ] Protección contra SQL injection mediante queries parametrizadas/ORM.
- [ ] Validación de archivos.
- [ ] Limitar tamaño de uploads.
- [ ] Logs de seguridad.

---

# 19. AWS WAF — fase avanzada

> No es necesario para la primera versión del laboratorio. Se agrega después para practicar seguridad AWS.

Arquitectura:

```text
Internet
   │
   ▼
API Gateway
   │
   ▼
AWS WAF
   │
   ▼
Backend
```

### Tareas

- [ ] Crear Web ACL.
- [ ] Asociar WAF al recurso compatible.
- [ ] Configurar reglas administradas.
- [ ] Configurar rate-based rule.
- [ ] Probar exceso de solicitudes.
- [ ] Revisar métricas.
- [ ] Revisar logs si se habilitan.
- [ ] Comparar comportamiento con el rate limiting del backend.

### Costos

- [ ] Revisar pricing antes de habilitarlo.
- [ ] Revisar costo por Web ACL.
- [ ] Revisar costo por reglas.
- [ ] Revisar costo por solicitudes.

---

# 20. CloudWatch

## Logs

Crear/revisar:

```text
EC2
ECS
Lambda
API Gateway
```

### Tareas

- [ ] Revisar logs de EC2.
- [ ] Revisar logs de ECS.
- [ ] Revisar logs de Lambda.
- [ ] Revisar métricas de API Gateway.
- [ ] Crear alarma de errores.
- [ ] Crear alarma de CPU de EC2.
- [ ] Revisar retención de logs.
- [ ] Evitar retenciones innecesariamente largas.

---

# 21. CI/CD con GitHub Actions

## Flujo objetivo

```text
Developer
    │
    ▼
GitHub
    │
    ▼
GitHub Actions
    │
    ├───────────────┐
    │               │
    ▼               ▼
Backend           Frontend
    │               │
Docker build      Docker build
    │               │
    ▼               ▼
   ECR             ECR
    │               │
    ▼               ▼
  EC2             ECS
```

## Backend pipeline

```text
git push
   │
   ▼
GitHub Actions
   │
   ├── test
   ├── lint
   ├── docker build
   ├── docker push
   └── deploy
```

### Tareas

- [ ] Crear workflow.
- [ ] Ejecutar tests.
- [ ] Ejecutar lint.
- [ ] Construir imagen.
- [ ] Autenticarse con AWS.
- [ ] Push a ECR.
- [ ] Actualizar backend.
- [ ] Verificar `/health`.

## Frontend pipeline

- [ ] Ejecutar tests.
- [ ] Ejecutar build.
- [ ] Construir Docker.
- [ ] Push a ECR.
- [ ] Actualizar ECS.
- [ ] Esperar deployment.
- [ ] Verificar aplicación.

---

# 22. Seguridad de GitHub → AWS

No guardar:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

directamente en el repositorio si puede evitarse.

Objetivo:

```text
GitHub Actions
       │
       ▼
OIDC
       │
       ▼
AWS IAM Role
```

### Tareas

- [ ] Crear IAM OIDC Provider para GitHub.
- [ ] Crear IAM Role para GitHub Actions.
- [ ] Restringir repositorio.
- [ ] Restringir branch.
- [ ] Definir permisos mínimos.
- [ ] Probar workflow.
- [ ] Verificar CloudTrail/IAM cuando corresponda.

---

# 23. Pruebas funcionales finales

## Frontend

- [ ] Login.
- [ ] Logout.
- [ ] Crear usuario.
- [ ] Consultar usuarios.
- [ ] Crear material.
- [ ] Consultar materiales.
- [ ] Editar material.
- [ ] Eliminar material.
- [ ] Subir imagen.
- [ ] Visualizar imagen.
- [ ] Eliminar cuenta.

## Backend

- [ ] `/health`.
- [ ] Autenticación.
- [ ] Autorización.
- [ ] CRUD.
- [ ] Validaciones.
- [ ] Manejo de errores.
- [ ] Logs.

## AWS

- [ ] EC2 → RDS.
- [ ] EC2 → S3.
- [ ] EC2 → DynamoDB.
- [ ] EC2 → SQS.
- [ ] SQS → Lambda.
- [ ] ECS → API Gateway.
- [ ] GitHub → ECR.
- [ ] ECS → ECR.
- [ ] HTTPS.
- [ ] DNS.

---

# 24. Pruebas de seguridad

- [ ] Intentar acceder directamente a RDS desde Internet.
- [ ] Intentar acceder al bucket S3 públicamente.
- [ ] Probar IAM con permisos insuficientes.
- [ ] Probar acceso a un material que el usuario no debería modificar.
- [ ] Probar SQL injection.
- [ ] Probar XSS en campos de texto.
- [ ] Probar fuerza bruta contra `/login`.
- [ ] Probar archivos demasiado grandes.
- [ ] Probar extensiones de archivos no permitidas.
- [ ] Verificar HTTPS.
- [ ] Revisar Security Groups.
- [ ] Revisar roles IAM.
- [ ] Revisar políticas S3.
- [ ] Revisar logs.

---

# 25. Observabilidad

Crear un pequeño dashboard:

```text
AWS CloudWatch Dashboard
```

Métricas:

```text
EC2 CPU
EC2 Network
API Gateway Requests
API Gateway 4XX
API Gateway 5XX
Lambda Invocations
Lambda Errors
SQS Messages
ECS CPU
ECS Memory
```

### Tareas

- [ ] Crear dashboard.
- [ ] Crear alarmas.
- [ ] Provocar un error controlado.
- [ ] Verificar alarma.
- [ ] Revisar logs.
- [ ] Documentar diagnóstico.

---

# 26. Simulación de carga

Después de tener todo funcionando:

```text
Cliente
   │
   ▼
API Gateway
   │
   ▼
EC2
   │
   ▼
RDS
```

Utilizar herramientas como:

```text
k6
Apache JMeter
Artillery
```

Pruebas:

- [ ] 10 usuarios concurrentes.
- [ ] 50 usuarios.
- [ ] 100 usuarios.
- [ ] Medir latencia.
- [ ] Medir errores.
- [ ] Revisar CPU EC2.
- [ ] Revisar RDS.
- [ ] Revisar API Gateway.
- [ ] Revisar CloudWatch.

> No hacer pruebas de carga grandes sin revisar límites, costos y recursos disponibles.

---

# 27. Segunda arquitectura — evolución

Después de dominar la primera arquitectura:

```text
                    Route 53
                       │
                       ▼
                  API Gateway
                       │
                       ▼
                 Load Balancer
                       │
                 ┌─────┴─────┐
                 ▼           ▼
               ECS         ECS
               Task        Task
                 │           │
                 └─────┬─────┘
                       ▼
                      RDS
```

Objetivos:

- [ ] Migrar backend de EC2 a ECS.
- [ ] Crear múltiples tasks.
- [ ] Añadir Load Balancer.
- [ ] Health checks.
- [ ] Auto Scaling.
- [ ] Rolling deployment.
- [ ] Blue/Green deployment.
- [ ] Revisar costos.

---

# 28. Plan de apagado al terminar cada práctica

## EC2

- [ ] Detener instancia si no se necesita.
- [ ] Si el laboratorio terminó definitivamente, eliminar instancia.
- [ ] Revisar volúmenes EBS.
- [ ] Revisar Elastic IP si existe.

## RDS

- [ ] Crear snapshot si se necesita conservar datos.
- [ ] Detener o eliminar instancia según el objetivo.
- [ ] Revisar snapshots.
- [ ] Revisar almacenamiento.

## ECS/Fargate

- [ ] Cambiar desired count a `0`.
- [ ] Detener/eliminar tasks.
- [ ] Eliminar service si no se necesita.
- [ ] Eliminar cluster si corresponde.

## S3

- [ ] Eliminar objetos si ya no son necesarios.
- [ ] Eliminar bucket si el laboratorio terminó.

## DynamoDB

- [ ] Mantener si se quiere reutilizar.
- [ ] Eliminar si el laboratorio terminó.

## Lambda

- [ ] Eliminar si no se necesita.

## SQS

- [ ] Eliminar queues si no se necesitan.

## API Gateway

- [ ] Eliminar API si no se necesita.

## WAF

- [ ] Eliminar Web ACL si fue creado para una práctica puntual.

## Route 53

- [ ] Mantener dominio si se desea conservarlo.
- [ ] Eliminar Hosted Zone si ya no se necesita.
- [ ] Revisar registro del dominio por separado.

## ECR

- [ ] Eliminar imágenes antiguas.
- [ ] Eliminar repositorio si ya no se necesita.

---

# 29. Checklist final de costos

Antes de cerrar AWS:

- [ ] Revisar EC2.
- [ ] Revisar RDS.
- [ ] Revisar ECS Tasks.
- [ ] Revisar Load Balancers.
- [ ] Revisar NAT Gateways.
- [ ] Revisar Elastic/Public IPv4.
- [ ] Revisar EBS volumes.
- [ ] Revisar S3.
- [ ] Revisar DynamoDB.
- [ ] Revisar ECR.
- [ ] Revisar Lambda.
- [ ] Revisar SQS.
- [ ] Revisar API Gateway.
- [ ] Revisar WAF.
- [ ] Revisar Route 53.
- [ ] Revisar CloudWatch Logs.
- [ ] Revisar snapshots.
- [ ] Revisar Cost Explorer.

---

# 30. Checklist de avance general

## Fase A — Fundamentos

- [ ] AWS Account
- [ ] Billing
- [ ] Budget
- [ ] Region
- [ ] Tags
- [ ] VPC
- [ ] Subnets
- [ ] Security Groups

## Fase B — Backend

- [ ] Node.js
- [ ] Express
- [ ] Docker
- [ ] EC2
- [ ] IAM Role
- [ ] RDS
- [ ] MySQL
- [ ] CRUD
- [ ] `/health`

## Fase C — AWS Storage

- [ ] S3
- [ ] IAM S3 permissions
- [ ] DynamoDB
- [ ] IAM DynamoDB permissions

## Fase D — Frontend

- [ ] Angular
- [ ] Docker
- [ ] ECR
- [ ] ECS
- [ ] Fargate
- [ ] Nginx

## Fase E — API

- [ ] API Gateway
- [ ] CORS
- [ ] Authentication
- [ ] Routes
- [ ] HTTPS

## Fase F — DNS

- [ ] Route 53
- [ ] Domain
- [ ] Hosted Zone
- [ ] `app.domain`
- [ ] `api.domain`
- [ ] ACM
- [ ] HTTPS

## Fase G — Serverless

- [ ] SQS
- [ ] Lambda
- [ ] IAM Lambda
- [ ] Borrado de cuenta
- [ ] Reintentos
- [ ] DLQ

## Fase H — Seguridad

- [ ] IAM least privilege
- [ ] Security Groups
- [ ] S3 private
- [ ] RDS private
- [ ] Rate limiting
- [ ] AWS WAF
- [ ] CloudWatch

## Fase I — DevOps

- [ ] GitHub
- [ ] GitHub Actions
- [ ] OIDC
- [ ] ECR
- [ ] Automated tests
- [ ] Docker build
- [ ] Deployment
- [ ] Rollback
- [ ] Monitoring

## Fase J — Escalabilidad

- [ ] ECS backend
- [ ] Load Balancer
- [ ] Multiple tasks
- [ ] Auto Scaling
- [ ] Health checks
- [ ] Blue/Green deployment

---

# 31. Registro personal de avances

## Sesión 1

Fecha:

```text
____________________
```

Objetivo:

```text
____________________
```

Realizado:

```text
____________________
```

Problemas:

```text
____________________
```

Costos observados:

```text
____________________
```

Pendiente:

```text
____________________
```

---

## Sesión 2

Fecha:

```text
____________________
```

Objetivo:

```text
____________________
```

Realizado:

```text
____________________
```

Problemas:

```text
____________________
```

Costos observados:

```text
____________________
```

Pendiente:

```text
____________________
```

---

# 32. Arquitectura final esperada

Al terminar todas las fases:

```text
                                  ┌───────────────┐
                                  │    GitHub     │
                                  └───────┬───────┘
                                          │
                                     GitHub Actions
                                          │
                                  ┌───────┴────────┐
                                  ▼                ▼
                                 ECR              ECR
                                  │                │
                                  ▼                ▼
                             Backend           Frontend
                                EC2             ECS/Fargate
                                  │
                                  │
                          ┌───────┼────────┐
                          │       │        │
                          ▼       ▼        ▼
                         RDS   DynamoDB    S3
                          ▲
                          │
                      Lambda
                          ▲
                          │
                         SQS


              Internet
                  │
                  ▼
              Route 53
                  │
             ┌────┴────┐
             ▼         ▼
           Front      API
             │         │
             ▼         ▼
           ECS     API Gateway
                       │
                       ▼
                     WAF
                       │
                       ▼
                      EC2
```

---

# 33. Resultado esperado del laboratorio

Al finalizar deberías poder explicar y demostrar:

- Cómo desplegar una aplicación Docker en AWS.
- Cómo utilizar EC2.
- Cómo utilizar ECS/Fargate.
- Cómo almacenar imágenes en S3.
- Cómo utilizar RDS MySQL.
- Cómo utilizar DynamoDB.
- Cómo implementar procesamiento asíncrono con SQS + Lambda.
- Cómo configurar IAM con mínimo privilegio.
- Cómo utilizar Security Groups.
- Cómo exponer APIs mediante API Gateway.
- Cómo configurar DNS con Route 53.
- Cómo configurar HTTPS con ACM.
- Cómo proteger APIs con rate limiting y WAF.
- Cómo monitorear infraestructura con CloudWatch.
- Cómo construir imágenes Docker.
- Cómo almacenar imágenes en ECR.
- Cómo automatizar despliegues con GitHub Actions.
- Cómo utilizar OIDC para evitar credenciales AWS permanentes.
- Cómo controlar costos.
- Cómo apagar/eliminar infraestructura.
- Cómo evolucionar una aplicación desde EC2 hacia una arquitectura containerizada y escalable.

---

# 34. Orden recomendado de ejecución

```text
01. Billing + Budget
        ↓
02. VPC
        ↓
03. IAM
        ↓
04. RDS
        ↓
05. EC2
        ↓
06. Node.js + Docker
        ↓
07. S3
        ↓
08. DynamoDB
        ↓
09. ECR
        ↓
10. ECS/Fargate + Angular
        ↓
11. API Gateway
        ↓
12. ACM
        ↓
13. Route 53
        ↓
14. SQS
        ↓
15. Lambda
        ↓
16. CloudWatch
        ↓
17. Seguridad
        ↓
18. WAF
        ↓
19. GitHub Actions
        ↓
20. OIDC
        ↓
21. CI/CD completo
        ↓
22. Pruebas de carga
        ↓
23. ECS Backend
        ↓
24. Load Balancer
        ↓
25. Auto Scaling
```

## Estado actual

```text
[ ] Fase 01 — Billing + Budget
[ ] Fase 02 — VPC
[ ] Fase 03 — IAM
[ ] Fase 04 — RDS
[ ] Fase 05 — EC2
[ ] Fase 06 — Backend Node.js
[ ] Fase 07 — S3
[ ] Fase 08 — DynamoDB
[ ] Fase 09 — ECR
[ ] Fase 10 — ECS/Fargate
[ ] Fase 11 — API Gateway
[ ] Fase 12 — ACM
[ ] Fase 13 — Route 53
[ ] Fase 14 — SQS
[ ] Fase 15 — Lambda
[ ] Fase 16 — CloudWatch
[ ] Fase 17 — Seguridad
[ ] Fase 18 — WAF
[ ] Fase 19 — GitHub Actions
[ ] Fase 20 — OIDC
[ ] Fase 21 — CI/CD
[ ] Fase 22 — Pruebas de carga
[ ] Fase 23 — Backend en ECS
[ ] Fase 24 — Load Balancer
[ ] Fase 25 — Auto Scaling
```
