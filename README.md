# ticketSells

Monolito **NestJS + React (Vite) + Prisma + PostgreSQL** com autenticação JWT, orquestrado por Docker Compose.

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Abra http://localhost:3000

| Serviço  | URL / porta            |
|----------|------------------------|
| App      | http://localhost:3000  |
| Postgres | localhost:5432         |

### Auth API

- `POST /auth/register` — `{ "email", "password" }`
- `POST /auth/login` — `{ "email", "password" }` → `{ "access_token" }`
- `GET /auth/me` — header `Authorization: Bearer <token>`

## Desenvolvimento local

1. Suba só o Postgres:

```bash
docker compose up postgres -d
```

2. Configure o `.env` apontando para o host:

```env
DATABASE_URL=postgresql://ticketsells:ticketsells@localhost:5432/ticketsells?schema=public
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=1d
PORT=3000
```

3. Instale e rode:

```bash
npm install
npm install --prefix client
npm run db:generate
npm run db:migrate
npm run dev:api
npm run dev:client
```

- API: http://localhost:3000  
- Vite (proxy `/auth`): http://localhost:5173  

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run docker:up` | Build e sobe app + postgres |
| `npm run docker:down` | Para os serviços |
| `npm run dev:api` | NestJS em watch |
| `npm run dev:client` | Vite dev server |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:generate` | Gera Prisma Client |
| `npm run build` | Build do client + API |
