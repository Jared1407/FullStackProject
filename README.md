# Secure Task Management System (NX Monorepo)

A secure, role-based Task Management System implemented in a modular NX workspace:

```
apps/
  api/         # NestJS backend (JWT, RBAC, TypeORM + SQLite)
  dashboard/   # Minimal dashboard (vanilla JS here for portability; can be replaced with Angular CLI app)

libs/
  data/        # Shared TypeScript interfaces & DTOs
  auth/        # Reusable RBAC decorators/guards
```

> Note: For simplicity in this environment, the `dashboard` folder contains a lightweight HTML+JS client that talks to the NestJS API. You can scaffold a full Angular app and move the same API calls into Angular services/components if preferred. The RBAC, JWT, and backend architecture align with the challenge spec while remaining runnable with minimal setup.

## Quick Start

### 1) Install dependencies (root)
```bash
npm install
```

### 2) Configure environment (API)
Create `apps/api/.env` from the example:
```bash
cp apps/api/.env.example apps/api/.env
```
Adjust values if desired (e.g., `PORT`, `DB_PATH`, `JWT_SECRET`).

### 3) Run the API (NestJS)
```bash
npm run start:api
```
The API will start at `http://localhost:3500` unless you changed `PORT`.

### 4) Seed demo data
Use the API to create demo orgs and users (Owner/Admin/Viewer). You can do this with cURL or Postman:
```bash
curl -X POST http://localhost:3500/auth/seed
```
Seeded accounts:
- owner@acme.com / Password123!
- admin@acme.com / Password123!
- viewer@acme.com / Password123!

### 5) Open the Dashboard
Open `apps/dashboard/src/index.html` in your browser (via a lightweight static server such as VSCode Live Server or `npx http-server apps/dashboard/src -p 4200`).

> The dashboard assumes the API is reachable at `http://localhost:3500`. If different, set in DevTools:
```js
localStorage.setItem('API_BASE', 'http://localhost:YOUR_PORT')
```

Log in with one of the seeded users. Create/edit/delete tasks (subject to RBAC). View the audit log (Owner/Admin only).

---

## Architecture Overview

- **NX Workspace**: Monorepo organization and path mapping (`nx.json`, `tsconfig.base.json`).
- **Backend (NestJS)**:
  - **Authentication**: JWT via Passport; `/auth/login` issues access tokens; `JwtStrategy` validates them.
  - **RBAC**: `libs/auth` exposes `@Permissions()` decorator and `RbacGuard` enforcing role→permission mapping (Owner > Admin > Viewer). Guards run with `JwtAuthGuard` on protected controllers.
  - **Access Scope**: Org hierarchy (2 levels) enforced in `TasksService` (org or child org visibility for Owner/Admin; same-org read-only for Viewer).
  - **Audit Logging**: `AuditService` appends structured lines to `LOG_PATH`; `/audit-log` tails recent entries (`audit:read` permission).
  - **Persistence**: SQLite via TypeORM; entities for `User`, `Organization`, `Task`. Auto-sync enabled for convenience.
- **Frontend (Dashboard)**:
  - Demonstrates login (JWT storage), CRUD on `/tasks`, and calling `/audit-log` with bearer token.
  - Minimal CSS approximates Tailwind look-and-feel; can be replaced with Tailwind + Angular easily.

## Data Model

### Entities
- **Organization**: `id`, `name`, `parentOrgId (nullable)` — forms a two-level tree.
- **User**: `id`, `email (unique)`, `passwordHash`, `role (OWNER|ADMIN|VIEWER)`, `orgId`.
- **Task**: `id`, `title`, `description`, `category`, `status (TODO|IN_PROGRESS|DONE)`, `ownerId`, `orgId`.

A small ERD:

```
Organization (id, name, parentOrgId)
   ^
   |
User (id, email, passwordHash, role, orgId) ---- owns ---> Task (id, title, status, ownerId, orgId)
```

## Access Control

- **Roles**: 
  - `OWNER`: Full permissions across own org and its child orgs.
  - `ADMIN`: Same as Owner for tasks; can also view audit log.
  - `VIEWER`: Read-only access to tasks in **their own** org.
- **Permissions** (enforced via `@Permissions` + `RbacGuard`):
  - `task:create`, `task:read`, `task:update`, `task:delete`, `audit:read`.

**Org Scope Logic** (in `TasksService`):
- Owner/Admin: can access tasks where `task.orgId === user.orgId` **or** `org.parentOrgId === user.orgId`.
- Viewer: can access tasks only where `task.orgId === user.orgId`.
- Viewers cannot delete; updates limited (cannot update others' tasks).

## API

All endpoints require `Authorization: Bearer <token>` except `/auth/login` and `/auth/seed`.

- `POST /auth/login` → `{ access_token }`
- `POST /auth/seed` → initializes demo org/users

- `GET /tasks` → list tasks within user's scope
- `POST /tasks` → create task (requires `task:create`)
- `PUT /tasks/:id` → update task (requires `task:update`)
- `DELETE /tasks/:id` → delete task (requires `task:delete`)

- `GET /audit-log?limit=200` → returns `{ lines: [...] }` (Owner/Admin)

### Example
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3500/auth/login   -H "Content-Type: application/json"   -d '{"email":"owner@acme.com","password":"Password123!"}' | jq -r .access_token)

# Create a task
curl -X POST http://localhost:3500/tasks   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"title":"Finish RBAC","status":"IN_PROGRESS","category":"Work"}'
```

## Testing

- **API**: Simple Jest example in `apps/api/src/auth/rbac.spec.ts`. Extend with integration tests (supertest) for `/tasks`, `/audit-log`, and authentication flows.
- **Dashboard**: The example is framework-lite; if you adopt Angular CLI, enable Jest/Karma and write component/service tests accordingly.

## Environment

Create `apps/api/.env`:
```
JWT_SECRET=super_secret_change_me
JWT_EXPIRES=1d
DB_PATH=./taskdb.sqlite
LOG_PATH=./logs/audit.log
PORT=3500
```

## Future Considerations

- Role delegation & custom permission sets
- JWT refresh tokens, token revocation/rotation
- CSRF mitigation for cookie-based auth (if switching from bearer)
- Caching permission checks and org maps
- PostgreSQL in production, migrations enabled
- Replace dashboard with full Angular + Tailwind + NgRx + CDK drag-drop

---

