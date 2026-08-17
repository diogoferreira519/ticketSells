# ticketSells

Aplicação monolítica **NestJS + React (Vite) + Prisma + PostgreSQL** com autenticação JWT, orquestrada por Docker Compose. Pagamentos são **simulados** via fila **RabbitMQ** (sem cobrança real).

**Pré-requisitos:** Node.js 20+, npm, Docker e Docker Compose.

## Como rodar (dev)

1. Copie o `.env` e suba Postgres + RabbitMQ:

```bash
cp .env.example .env
npm run docker:up
```

2. Instale dependências, migre o banco e rode o **seed** (cria os usuários de teste):

```bash
npm install
npm install --prefix client
npm run db:generate
npm run db:migrate
npm run db:seed
```

3. Em **dois terminais**:

```bash
npm run dev:api      # http://localhost:3000
npm run dev:client  # http://localhost:5173
```

4. Abra http://localhost:5173 e faça login com um usuário do seed (senha **`senha123`**):

| Papel       | Email                       |
|-------------|-----------------------------|
| Organizador | `org@ticketsells.local`     |
| Cliente     | `cliente@ticketsells.local` |
| Portaria    | `portaria@ticketsells.local`|

Para parar Postgres/RabbitMQ: `npm run docker:down`.

| Serviço     | URL                            |
|-------------|--------------------------------|
| Frontend    | http://localhost:5173          |
| API         | http://localhost:3000          |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

## Produção local (Docker)

```bash
npm run docker:prod
```

Abra http://localhost:3000 (Nest serve o React). O entrypoint aplica as migrations. Rode o seed no host se ainda precisar dos usuários de teste: `npm run db:seed` (com `DATABASE_URL` apontando para o Postgres do Compose).

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
| `npm test` | Testes unitários da API |
| `npm run test:watch` | Testes unitários em watch |

## Meu processo no decorrer do projeto

O desenvolvimento começou pela modelagem de dados. Antes de implementar qualquer código, mapeei as entidades, atributos e relacionamentos do sistema. Utilizei o Excalidraw para desenhar o diagrama conceitual e visualizar com clareza a estrutura final do banco de dados:
https://excalidraw.com/#json=qXnO6eGhA7YnTsz1KGTJY,Cd0ROHONRHCULO0jqy0Y2A

--Revisei a modelagem várias vezes e, quando havia trade-off, escolhi performance. Por isso há flags booleanas e alguma duplicidade (como idUser em mais de uma tabela): menos joins, consultas mais simples e um desenho mais fácil de escalar--

Boa parte dos DTOs, services e controllers (código mais boilerplate) repassei para IA realizar e agi como um revisor, intervindo quando necessário. Decidi fazer uma aplicacao de arquitetura monolitica pela facilidade de manutencao. Pensei nos microservicos para parte de pagamentos, mas iria ser um overengineering. Uma decisão que eu gostei de ter feito foi jogar para fila do RabbitMQ os pagamentos, assegurando ordem e retirando a carga no backend das requisicoes


--Eu queria realizar o deploy mas sabia que com rabbitmq, banco e api mais complexa teria que arcar com um plano para hospedar então decidi deixar a aplicacao local apenas
