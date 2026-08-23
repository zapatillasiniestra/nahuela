# Nahuela

Open-source infrastructure for auditable, provider-agnostic AI-powered onboarding and regulated decision systems.

Nahuela provides a reusable backend foundation for identity verification, document verification, compliance checks, AI assessment, and tamper-evident audit trails.

---

## Architecture

Nahuela uses a layered backend architecture with pluggable providers:

```text
Client
  ↓
REST API
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
PostgreSQL

Providers
  ├── Identity
  ├── Documents
  ├── Compliance
  └── AI

Audit Events
  ↓
SHA-256 hash chain
  ↓
Verification
```

---

## Core Features

* JWT authentication and RBAC
* Identity, document, compliance verification with pluggable providers
* AI-powered risk assessment
* Tamper-evident audit events with SHA-256 hash chaining
* End-to-end decision history and audit verification
* Controlled onboarding status transitions
* REST APIs with Swagger/OpenAPI documentation
* Zod request validation
* Search, filtering, sorting, and pagination
* Health and database connectivity checks
* Automated unit and integration tests
* Frontend application for display
* GitHub Actions CI
  
---

## Tech Stack

* TypeScript
* NodeJS
* React
* Express
* PostgreSQL
* Zod
* Jest
* Swagger/OpenAPI
* GitHub Actions
* Docker

---

## Local Development

### With Docker

```bash
docker compose up --build
```

### With Node.js

```bash
npm install
npm run migrate
npm run dev
```

The API runs at:

```text
http://localhost:3000
```

Swagger documentation:

```text
http://localhost:3000/docs
```

Health checkpoint:

```text
http://localhost:3000/health
```

---

## Testing

Run the test suite with:

```bash
npm test
```

Build with:

```bash
npm run build
```

The project is structured so that unit and integration tests can run against the application layers with minimal coupling to infrastructure.

---

## Repository Structure

```text
src/
├── controllers/
├── services/
├── repositories/
├── providers/
│   ├── identity/
│   ├── document/
│   ├── compliance/
│   └── audit/
├── middleware/
├── validators/
├── routes/
├── db/
├── jobs/
├── types/
├── utils/
└── tests/
```
