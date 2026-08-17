# ticketSells

Aplicação monolítica **NestJS + React (Vite) + Prisma + PostgreSQL** com autenticação JWT, orquestrada por Docker Compose. Pagamentos são **simulados** via fila **RabbitMQ** (sem cobrança real).

## Pré-requisitos

- Node.js 20+ e npm
- Docker e Docker Compose

## Configurar o ambiente

Na raiz do repositório:

```bash
cp .env.example .env
```

Variáveis principais no `.env`:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres (em dev: `localhost:5432`) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Auth JWT |
| `RABBITMQ_URL` / `RABBITMQ_QUEUE_PAGAMENTOS` | Fila de pagamentos simulados |
| `TMDB_ACCESS_TOKEN` | Busca de filmes (API Read Access Token da TMDB) |
| `CORS_ORIGIN` | Origem do frontend em dev (`http://localhost:5173`) |
| `PORT` | Porta da API (padrão `3000`) |

O token da TMDB é o **API Read Access Token** em [TMDB API settings](https://www.themoviedb.org/settings/api).

## Desenvolvimento

O Docker Compose sobe **apenas Postgres + RabbitMQ**. API e frontend rodam no host (hot reload).

```bash
cp .env.example .env   # se ainda não tiver .env
npm run docker:up
npm install
npm install --prefix client
npm run db:generate
npm run db:migrate
npm run db:seed
```

Em **dois terminais** separados:

```bash
npm run dev:api      # NestJS → http://localhost:3000
npm run dev:client  # Vite → http://localhost:5173
```

Abra o frontend em http://localhost:5173. O Vite faz proxy das rotas de API para a porta 3000.

| Serviço     | URL / porta                        |
|-------------|------------------------------------|
| Frontend    | http://localhost:5173              |
| API         | http://localhost:3000              |
| Postgres    | localhost:5432                     |
| RabbitMQ    | localhost:5672 (AMQP)              |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

O `.env` de desenvolvimento usa `localhost` no `DATABASE_URL` e em `RABBITMQ_URL`.

Para parar Postgres e RabbitMQ:

```bash
npm run docker:down
```

## Produção local (Docker)

Build da API + React; o Nest serve o `client/dist` na mesma porta. O entrypoint aplica `prisma migrate deploy` e sobe o app.

```bash
npm run docker:prod
# equivalente: docker compose --profile prod up --build
```

Abra http://localhost:3000. O serviço `app` conecta em `postgres` e `rabbitmq` na rede Docker (as URLs internas já vêm do `docker-compose.yml`).

Usuários de seed (senha `senha123`):

| Papel        | Email                     |
|--------------|---------------------------|
| Organizador  | `org@ticketsells.local`   |
| Cliente      | `cliente@ticketsells.local` |
| Portaria     | `portaria@ticketsells.local` |

## Pagamento simulado

1. Cliente reserva assentos → `Pedido` com `pagamentoStatus: PENDENTE` (assentos ficam ocupados).
2. No frontend, **Confirmar pagamento** ou **Recusar pagamento** publica na fila `pagamentos`.
3. Consumer Nest processa a mensagem (delay simulado) e atualiza o pedido:
   - Confirmar → `PAGO` (ingressos válidos em Meus ingressos).
   - Recusar → `CANCELADO` + ingressos `CANCELADO` (assentos liberados).

Endpoints (JWT):

- `POST /pagamentos/:idPedido/confirmar`
- `POST /pagamentos/:idPedido/recusar`
- `GET /pagamentos/:idPedido` — status para polling

Variáveis: `RABBITMQ_URL`, `RABBITMQ_QUEUE_PAGAMENTOS`.

## Auth API

- `POST /auth/register` — `{ "nome", "email", "password" }`
- `POST /auth/login` — `{ "email", "password" }` → `{ "access_token" }`
- `GET /auth/me` — header `Authorization: Bearer <token>`

## Filmes (TMDB)

Consultas públicas; o token fica só no servidor.

- `GET /filmes/search?query=&page=` — busca por título
- `GET /filmes/popular?page=` — populares
- `GET /filmes/now-playing?page=` — em cartaz
- `GET /filmes/:id` — detalhes (`idFilme`, `titulo`, `descricao`, `imgFilme`, …)

## Eventos (organizador)

Requer JWT e `isOrg`.

- `GET /eventos` — lista os eventos do organizador logado
- `GET /eventos/:id` — detalhe (somente do organizador)
- `POST /eventos` — cria evento
- `PATCH /eventos/:id` — atualiza
- `DELETE /eventos/:id` — remove

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run docker:up` | Sobe Postgres + RabbitMQ |
| `npm run docker:prod` | Postgres + RabbitMQ + app de produção |
| `npm run docker:down` | Para os serviços |
| `npm run dev:api` | NestJS em watch |
| `npm run dev:client` | Vite dev server |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:seed` | Usuários organizador, cliente e portaria |
| `npm run db:generate` | Gera Prisma Client |
| `npm run build` | Build do client + API |

## Meu processo no decorrer do projeto

O desenvolvimento começou pela modelagem de dados. Antes de implementar qualquer código, mapeei as entidades, atributos e relacionamentos do sistema. Utilizei o Excalidraw para desenhar o diagrama conceitual e visualizar com clareza a estrutura final do banco de dados:
https://excalidraw.com/#json=qXnO6eGhA7YnTsz1KGTJY,Cd0ROHONRHCULO0jqy0Y2A

--Revisei a modelagem várias vezes e, quando havia trade-off, escolhi performance. Por isso há flags booleanas e alguma duplicidade (como idUser em mais de uma tabela): menos joins, consultas mais simples e um desenho mais fácil de escalar--

Boa parte dos DTOs repassei para IA realizar e agi como um revisor, intervindo quando necessário.
