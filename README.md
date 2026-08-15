# ticketSells

Pensei em uma aplicacao Monolitica **NestJS + React (Vite) + Prisma + PostgreSQL** com autenticação JWT, orquestrado por Docker Compose.

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

### Filmes (TMDB)

Consultas públicas; o token fica só no servidor.

- `GET /filmes/search?query=&page=` — busca por título
- `GET /filmes/popular?page=` — populares
- `GET /filmes/now-playing?page=` — em cartaz
- `GET /filmes/:id` — detalhes (`idFilme`, `titulo`, `descricao`, `imgFilme`, …)

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
TMDB_ACCESS_TOKEN=
```

O token da TMDB é o **API Read Access Token** em [TMDB API settings](https://www.themoviedb.org/settings/api).

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
- Vite (proxy `/auth` e `/filmes`): http://localhost:5173  

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


## Meu processo no decorrer do projeto:
O desenvolvimento começou pela modelagem de dados. Antes de implementar qualquer código, mapeei as entidades, atributos e relacionamentos do sistema. Utilizei o Excalidraw para desenhar o diagrama conceitual e visualizar com clareza a estrutura final do banco de dados:
https://excalidraw.com/#json=qXnO6eGhA7YnTsz1KGTJY,Cd0ROHONRHCULO0jqy0Y2A

--Revisei a modelagem várias vezes e, quando havia trade-off, escolhi performance. Por isso há flags booleanas e alguma duplicidade (como idUser em mais de uma tabela): menos joins, consultas mais simples e um desenho mais fácil de escalar--

Boa parte dos DTOs repassei para IA realizar e agi como um revisor e modificava quando necessário.
