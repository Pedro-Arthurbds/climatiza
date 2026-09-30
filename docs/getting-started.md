# Instalação local

## Pré-requisitos

- Node.js compatível com as dependências do projeto e npm.
- PostgreSQL 16 ou Docker com Docker Compose.
- Python e pip apenas para executar o site de documentação.

## 1. Banco de dados

O Compose do backend sobe somente PostgreSQL para desenvolvimento local:

```bash
cd backend
docker compose up -d postgres
```

O serviço local usa banco `gestao_ar_os`, usuário `postgres` e senha `postgres`.
Essas credenciais são exclusivamente locais e não devem ser reutilizadas em
produção. A porta publicada é `5432`.

## 2. API

```bash
cd backend
npm ci
cp .env.example .env
```

Edite `backend/.env` e configure um segredo JWT. Gere uma chave aleatória:

```bash
openssl rand -base64 48
```

Cole o resultado em `JWT_SECRET`. O backend rejeita chaves com menos de 32
bytes. Depois, gere o cliente Prisma, aplique as migrações pendentes e inicie:

```bash
npm run prisma:generate
npx prisma migrate dev
npm run dev
```

A API responde em `http://localhost:3333`; `GET /health` deve responder:

```json
{"status":"ok"}
```

### Criar o primeiro administrador

O seed não possui credenciais padrão. Informe-as apenas no ambiente do
processo que executa o seed:

```bash
SEED_ADMIN_EMAIL="admin@exemplo.com" \
SEED_ADMIN_PASSWORD="uma-senha-forte-com-pelo-menos-16" \
npm run seed
```

A senha deve ter no mínimo 16 caracteres. O seed não imprime a senha. Não
use os valores do exemplo como credenciais reais.

## 3. Aplicação web

Em outro terminal:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`. O valor `VITE_API_URL` deve apontar para a
API, normalmente `http://localhost:3333/api`.

## Comandos frequentes

| Diretório | Comando | Uso |
|---|---|---|
| `backend/` | `npm run dev` | API local com reinício automático |
| `backend/` | `npm run build` | Compilar TypeScript para `dist/` |
| `backend/` | `npm start` | Executar `dist/server.js` |
| `backend/` | `npm run prisma:generate` | Gerar Prisma Client |
| `backend/` | `npx prisma migrate dev` | Criar/aplicar migração em desenvolvimento |
| `backend/` | `npm run seed` | Criar o ADMIN inicial com variáveis obrigatórias |
| `frontend/` | `npm run dev` | Servidor Vite local |
| `frontend/` | `npm run build` | Verificar tipos e gerar arquivos estáticos |
| raiz | `mkdocs serve` | Servir documentação em `127.0.0.1:8000` |