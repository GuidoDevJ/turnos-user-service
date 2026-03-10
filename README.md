# turnos-user-service

Microservicio de gestión de usuarios para la plataforma **Turnos**. Administra usuarios con sus perfiles de cliente y/o profesional, integra autenticación Firebase, se comunica con `turnos-role-service` mediante SQS para mantener un caché local de roles, y expone un endpoint SQS para consultas de perfil desde otros servicios.

---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Configuración](#configuración)
- [Instalación y arranque](#instalación-y-arranque)
- [Base de datos](#base-de-datos)
- [Mensajería SQS](#mensajería-sqs)
- [API REST](#api-rest)
- [Tests](#tests)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Arquitectura

El servicio sigue **arquitectura hexagonal (Ports & Adapters)**:

```
src/
├── domain/           → Entidades y puertos (interfaces) — lógica de negocio pura
├── application/      → Use cases — orquestación de la lógica
└── infrastructure/   → Adaptadores concretos (Prisma, HTTP, SQS, Firebase)
```

### Integración con turnos-role-service

El user-service **no depende de HTTP del role-service**. La integración es completamente asíncrona mediante SQS:

```
role-service                          user-service
    │                                     │
    │── ROLE_CREATED/UPDATED/DELETED ──▶  │  actualiza roles_cache (tabla local)
    │                                     │
    │◀── ROLES_SYNC_REQUESTED ───────────  │  al arrancar, si el caché está vacío
    │─── ROLES_SYNC_RESOLVED ───────────▶ │  responde con todos los roles
    │                                     │
    │          (otros servicios)          │
    │◀── USER_PROFILE_REQUESTED ─────────  │  consulta de perfil
    │─── USER_PROFILE_RESPONDED ────────▶ │  responde con el perfil completo
```

**Stack técnico:**
- Runtime: Node.js + TypeScript
- Framework HTTP: Express 5
- ORM: Prisma 7 con adaptador `@prisma/adapter-pg`
- Base de datos: PostgreSQL 16
- Mensajería: AWS SQS (LocalStack en desarrollo)
- Autenticación: Firebase Admin SDK
- Tests: Vitest + Supertest
- Documentación: Swagger (OpenAPI)

---

## Requisitos

- Node.js >= 18
- Docker y Docker Compose
- AWS CLI (para inspeccionar colas SQS en desarrollo)
- `turnos-role-service` corriendo (para el sync de roles en startup)
- Cuenta de Firebase con un proyecto configurado

---

## Configuración

Crear el archivo `.env` en la raíz del servicio:

```env
PORT=3001
NODE_ENV=development

# Base de datos
DATABASE_URL="postgresql://turnos:turnos@localhost:5432/turnos_users?schema=public"

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT='{ ...json del service account... }'

# SQS (LocalStack en desarrollo)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
SQS_ENDPOINT_URL=http://localhost:4566

# Colas
SQS_REQUEST_QUEUE_URL=http://localhost:4566/000000000000/user-profile-requests
SQS_ROLE_EVENTS_QUEUE_URL=http://localhost:4566/000000000000/role-events
SQS_ROLES_SYNC_REQUEST_QUEUE_URL=http://localhost:4566/000000000000/roles-sync-requests
SQS_USER_EVENTS_QUEUE_URL=http://localhost:4566/000000000000/user-events
```

> El `FIREBASE_SERVICE_ACCOUNT` se obtiene en la consola de Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.

---

## Instalación y arranque

> **Primera vez levantando el servicio** — seguir los pasos en orden. No saltear el paso 4 (`prisma:generate`): el cliente Prisma se genera en `src/generated/prisma/` (ruta personalizada) y **no está commiteado al repositorio**, por lo que el servidor no levanta sin este paso.

### 1. Instalar dependencias
```bash
npm install
```

### 2. Levantar la infraestructura local
```bash
docker compose up -d
# Levanta PostgreSQL (5432) y LocalStack (4566) con las 5 colas SQS
```

Verificar que las colas existan:
```bash
aws --endpoint-url=http://localhost:4566 --region us-east-1 sqs list-queues
```

Deben aparecer las colas: `user-profile-requests`, `user-profile-responses`, `role-events`, `roles-sync-requests`, `user-events`.

### 3. Aplicar migraciones
```bash
npx prisma migrate deploy
```

### 4. Generar el cliente Prisma

> ⚠️ Paso obligatorio en la primera instalación y cada vez que cambie `prisma/schema.prisma`.

```bash
npm run prisma:generate
```

### 5. Iniciar el servidor

**Desarrollo** (con hot-reload):
```bash
npm run dev
```

**Producción**:
```bash
npm run build
npm start
```

El servicio queda disponible en `http://localhost:3001`.
Swagger UI en `http://localhost:3001/api-docs`.

### Startup sync de roles

Al arrancar, el servicio verifica si la tabla `roles_cache` está vacía. Si lo está:
1. Envía un mensaje `ROLES_SYNC_REQUESTED` a `roles-sync-requests`
2. Espera hasta 30 segundos la respuesta `ROLES_SYNC_RESOLVED` del role-service
3. Inserta todos los roles recibidos en la tabla `roles_cache`

Si el role-service no responde en 30s, el servicio arranca de todas formas usando los IDs de roles definidos en `src/config/roles.ts` como fallback.

---

## Base de datos

### Modelos

```
User          → users         (id, firebaseUid, username, email, firstName, lastName,
                                phone, address, roleId, isActive, isVerified, timestamps)
Client        → clients       (id, userId, preferredPaymentMethod, loyaltyPoints, notes, timestamps)
Professional  → professionals (id, userId, bio, specialization, licenseNumber,
                                yearsExperience, isAvailable, timestamps)
RoleCache     → roles_cache   (id, name, isActive, syncedAt)
```

**Relaciones:**
- Un `User` puede tener un `Client` y/o un `Professional` (perfil dual posible)
- `RoleCache` replica los roles del role-service para evitar dependencia HTTP en tiempo real

### Comandos útiles

```bash
# Crear una nueva migración (desarrollo)
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar migraciones pendientes (producción / CI)
npx prisma migrate deploy

# Regenerar el cliente Prisma tras cambios en el schema
npm run prisma:generate
```

---

## Mensajería SQS

### Colas

| Cola | Tipo | Descripción |
|------|------|-------------|
| `user-profile-requests` | Consumer | Responde consultas de perfil de usuario |
| `role-events` | Consumer | Actualiza `roles_cache` al recibir cambios de roles |
| `roles-sync-requests` | Publisher | Envía pedido de sincronización al arrancar |
| `user-events` | Publisher | Publica cuando un usuario cambia de rol |

### Eventos consumidos

**`USER_PROFILE_REQUESTED`** — otro servicio pide el perfil de un usuario:

```json
{
  "eventType": "USER_PROFILE_REQUESTED",
  "correlationId": "uuid-correlacion",
  "replyQueueUrl": "http://localhost:4566/000000000000/user-profile-responses",
  "payload": { "userId": 42 }
}
```

El servicio responde en `replyQueueUrl` con `USER_PROFILE_RESPONDED`.

**`ROLE_CREATED` / `ROLE_UPDATED` / `ROLE_DELETED`** — el role-service notifica cambios:

```json
{
  "eventType": "ROLE_UPDATED",
  "payload": { "id": 3, "name": "CLIENT", "isActive": false }
}
```

El servicio actualiza la fila correspondiente en `roles_cache`.

### Eventos publicados

**`USER_ROLE_ASSIGNED`** — cuando un usuario cambia de rol via `POST /api/users/:id/assign-role`:

```json
{
  "eventType": "USER_ROLE_ASSIGNED",
  "payload": {
    "userId": 42,
    "roleId": 3,
    "roleName": "CLIENT"
  }
}
```

---

## API REST

Todos los endpoints requieren autenticación Firebase:
```
Authorization: Bearer <firebase_id_token>
```

Para obtener un token en desarrollo:
```bash
curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<FIREBASE_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tupassword","returnSecureToken":true}' | jq .idToken
```

### Usuarios — `/api/users`

| Método | Ruta | Descripción | Body requerido |
|--------|------|-------------|----------------|
| `POST` | `/api/users` | Crear usuario base | `{ firebaseUid, username, email, firstName, lastName, roleId }` |
| `POST` | `/api/users/client` | Registrar como cliente | `{ firebaseUid, username, email, firstName, lastName }` + opcionales de cliente |
| `POST` | `/api/users/professional` | Registrar como profesional | `{ firebaseUid, username, email, firstName, lastName }` + opcionales de profesional |
| `GET` | `/api/users` | Listar usuarios | — (`?page=1&limit=10`) |
| `GET` | `/api/users/:id` | Obtener por ID | — |
| `GET` | `/api/users/:id/profile` | Perfil completo (usuario + rol + perfiles) | — |
| `PUT` | `/api/users/:id` | Actualizar usuario | campos opcionales |
| `DELETE` | `/api/users/:id` | Eliminar usuario | — |
| `POST` | `/api/users/:id/assign-role` | Asignar o transicionar rol | `{ role: "CLIENT"\|"PROFESSIONAL" }` + opcionales |

> Los IDs son **numéricos** (enteros positivos, autoincrement).

#### Campos opcionales en `/api/users/client`
- `phone`, `address`
- `preferredPaymentMethod` (máx. 50 chars)
- `notes`

#### Campos opcionales en `/api/users/professional`
- `phone`, `address`
- `bio`
- `specialization` (máx. 100 chars)
- `licenseNumber` (máx. 50 chars, único)
- `yearsExperience` (entero, 0–80)

#### Campos opcionales en `/api/users/:id/assign-role`
- Si `role = "CLIENT"`: `preferredPaymentMethod`, `notes`
- Si `role = "PROFESSIONAL"`: `bio`, `specialization`, `licenseNumber`, `yearsExperience`

> Si el usuario ya tenía un perfil del tipo solicitado, se **preserva** el perfil existente.

### Clientes — `/api/clients`

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| `GET` | `/api/clients/:id` | Obtener perfil de cliente | — |
| `PUT` | `/api/clients/:id` | Actualizar perfil de cliente | `{ preferredPaymentMethod?, loyaltyPoints?, notes? }` |

### Profesionales — `/api/professionals`

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| `GET` | `/api/professionals/:id` | Obtener perfil de profesional | — |
| `PUT` | `/api/professionals/:id` | Actualizar perfil de profesional | `{ bio?, specialization?, licenseNumber?, yearsExperience?, isAvailable? }` |

### Health check

```
GET /health  →  { "status": "ok" }
```

---

## Tests

Los tests son de integración y levantan una app Express con un middleware de auth bypass (sin necesidad de token Firebase real):

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:coverage
```

### Suites disponibles

| Archivo | Descripción |
|---------|-------------|
| `client.integration.test.ts` | CRUD de clientes y registro como cliente |
| `professional.integration.test.ts` | CRUD de profesionales y registro como profesional |
| `sqs-handler.integration.test.ts` | Handler de `USER_PROFILE_REQUESTED` vía SQS |

---

## Estructura del proyecto

```
turnos-user-service/
├── prisma/
│   ├── schema.prisma              # Modelos de BD
│   └── migrations/                # Historial de migraciones
├── scripts/
│   ├── localstack-init.sh         # Crea las 5 colas SQS en LocalStack al arrancar
│   └── test-sqs.ts                # Script manual para probar el flujo SQS
├── src/
│   ├── config/
│   │   ├── env.ts                 # Variables de entorno validadas
│   │   ├── firebase.ts            # Inicialización de Firebase Admin
│   │   └── roles.ts               # IDs de roles fallback (desde env vars)
│   ├── domain/
│   │   ├── entities/              # User, Client, Professional, RoleCache, UserFullProfile
│   │   ├── repositories/          # Interfaces (puertos): IUserRepository, IClientRepository,
│   │   │                          #   IProfessionalRepository, IRoleCacheRepository
│   │   └── errors/                # Errores de dominio tipados (NotFoundError, ConflictError, etc.)
│   ├── application/
│   │   └── use-cases/
│   │       ├── create-user.use-case.ts
│   │       ├── create-client.use-case.ts          # Registro como cliente
│   │       ├── create-professional.use-case.ts    # Registro como profesional
│   │       ├── user/
│   │       │   ├── get-user-full-profile.use-case.ts
│   │       │   └── assign-user-role.use-case.ts   # Transición de rol
│   │       ├── client/
│   │       │   ├── get-client.use-case.ts
│   │       │   └── update-client.use-case.ts
│   │       ├── professional/
│   │       │   ├── get-professional.use-case.ts
│   │       │   └── update-professional.use-case.ts
│   │       └── role/
│   │           └── sync-role-cache.use-case.ts    # Upsert en roles_cache
│   ├── infrastructure/
│   │   ├── database/prisma/
│   │   │   ├── client.ts                          # Instancia de PrismaClient
│   │   │   ├── user.repository.impl.ts
│   │   │   ├── client.repository.impl.ts
│   │   │   ├── professional.repository.impl.ts
│   │   │   ├── role-cache.repository.impl.ts
│   │   │   └── prisma-error.helper.ts             # Extracción de campo en errores P2002
│   │   ├── http/
│   │   │   ├── controllers/                       # UserController, ClientController,
│   │   │   │                                      #   ProfessionalController, AuthController
│   │   │   ├── routes/                            # user.routes, client.routes,
│   │   │   │                                      #   professional.routes, auth.routes
│   │   │   ├── middlewares/                       # firebaseAuth, validate, errorHandler
│   │   │   ├── validators/                        # Schemas Zod por entidad
│   │   │   └── swagger.ts
│   │   └── messaging/
│   │       ├── ports/                             # IMessageHandler, IMessageConsumer
│   │       └── sqs/
│   │           ├── sqs.client.ts
│   │           ├── sqs.publisher.ts
│   │           ├── sqs.consumer.ts
│   │           └── handlers/
│   │               ├── user-profile-requested.handler.ts
│   │               ├── role-event.handler.ts      # ROLE_CREATED/UPDATED/DELETED
│   │               └── index.ts                   # Registros de handlers
│   ├── __tests__/
│   │   ├── helpers/app.helper.ts                  # App de test con auth bypass
│   │   ├── client.integration.test.ts
│   │   ├── professional.integration.test.ts
│   │   └── sqs-handler.integration.test.ts
│   └── index.ts                                   # Punto de entrada, wiring, warmRolesCache
├── docker-compose.yml                             # PostgreSQL (5432) + LocalStack (4566)
├── prisma.config.ts
├── tsconfig.json
└── package.json
```
