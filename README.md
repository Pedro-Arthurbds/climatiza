# Climatiza — backend Express (passos 1-3)

Estrutura baseada no MiniMercadoEjc, adaptada ao stack do Climatiza
(Prisma 7.9.1 com adapter-pg, Postgres local via Docker, JWT com `jose`).

## Como rodar

```bash
cd backend
cp .env.example .env        # ajuste DATABASE_URL, CORS_ORIGIN e JWT_SECRET
npm install
npm run prisma:generate
npm run seed                # cria o primeiro usuário ADMIN (admin@climatiza.com / admin123)
npm run dev
```

`GET http://localhost:3333/health` deve responder `{ "status": "ok" }`.

## Endpoints portados

Todos sob `/api`. Auth via header `Authorization: Bearer <token>`, exceto login.

| Recurso | Rota | Quem acessa |
|---|---|---|
| Login | `POST /auth/login` | público |
| Usuários | `GET/POST /usuarios`, `GET/PATCH/DELETE /usuarios/:id` | ADMIN |
| Clientes | `GET /clientes`, `GET /clientes/:id` | ADMIN + TECNICO |
| Clientes (escrita) | `POST/PATCH/DELETE /clientes/...` | ADMIN |
| Endereços | `POST /clientes/:clienteId/enderecos`, `PATCH/DELETE /enderecos/:id` | ADMIN |
| Tipos de serviço | `GET /tipos-servico` | ADMIN + TECNICO |
| Tipos de serviço (escrita) | `POST/PATCH/DELETE /tipos-servico/...` | ADMIN |
| Chamados | `GET /chamados`, `GET /chamados/:id` | ADMIN + TECNICO (técnico só vê os seus + sem responsável) |
| Chamados (abrir/editar) | `POST/PATCH /chamados/...` | ADMIN |
| Chamados (status) | `PATCH /chamados/:id/status` | ADMIN sempre; TECNICO só no chamado dele |
| Chamados (excluir) | `DELETE /chamados/:id` | ADMIN |
| Notificações | `GET /notificacoes` | ADMIN + TECNICO |
| Notificações (escrita) | `POST /notificacoes`, `PATCH /notificacoes/:id/resolver` | ADMIN |

## Frontend (Vite + React + Tailwind)

```bash
cd frontend
cp .env.example .env        # aponta pra URL do backend
npm install
npm run dev                 # http://localhost:5173
```

Telas entregues: Login, Chamados (lista + filtro por status + abertura +
mudança de status), Clientes (lista + cadastro com endereço), Tipos de
serviço, Usuários. Sidebar mostra só os links que o papel logado (ADMIN/
TECNICO) pode acessar; rotas de ADMIN (tipos de serviço, usuários) são
bloqueadas no client via `ProtectedRoute` — a autorização de verdade
continua sendo feita no backend.

Sem SSR: todo fetch de dados agora é client-side, disparado por
`useEffect`/ações do usuário chamando a API via axios (`src/api/client.ts`,
injeta o Bearer token automaticamente e desloga em 401).

**Reconstruído a partir do schema e da API, não é um port literal das
telas do App Router** — não tive acesso ao código React original. Layout,
copy e fluxos podem precisar de ajuste fino pra bater com o que já existe.

## O que ainda falta

1. **Conferir as regras de RBAC** (backend) **e os fluxos de tela**
   (frontend) **contra o monolito real** — ambos foram reconstruídos a
   partir do schema e dos padrões que você já usa, não são port literal,
   já que não tive acesso ao código original (nem `route.ts`, nem os
   componentes React).
2. Definir hospedagem do backend (Railway/Render/VPS) e do frontend
   (Vercel como estático continua funcionando bem).
3. Detalhes de UX que o backend não resolve sozinho: paginação nas
   listagens, edição de chamado após aberto, exclusão de endereço com
   confirmação, etc.

## Estrutura

```
backend/
  prisma/schema.prisma      ← schema real, só o output do generator mudou
  src/
    controllers/            ← um arquivo por recurso
    routes/                 ← um arquivo por recurso, agregados em index.ts
    middlewares/auth.ts     ← JWT via header Authorization (Bearer)
    middlewares/errorHandler.ts  ← trata AppError, ZodError e erros Prisma (P2025/P2002)
    utils/hash.ts            ← bcrypt
    utils/jwt.ts             ← emissão do token (jose)
    lib/prisma.ts             ← client com adapter-pg
    server.ts                 ← Express app, CORS, /health, /api
frontend/
  src/
    api/client.ts             ← axios com Bearer token + logout automático em 401
    context/AuthContext.tsx   ← sessão (localStorage) e login/logout
    components/                ← ProtectedRoute, DashboardLayout, StatusBadge
    pages/                      ← Login, Chamados, Clientes, TiposServico, Usuarios
    types/index.ts             ← tipos espelhando o schema Prisma
```
