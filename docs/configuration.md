# Configuração

## Backend

O arquivo de referência é `backend/.env.example`. Crie `backend/.env` para
desenvolvimento local. Arquivos `.env` reais não devem ser versionados.

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `DATABASE_URL` | Sim | URL PostgreSQL consumida pelo Prisma/adapter-pg. |
| `JWT_SECRET` | Sim | Chave de assinatura/verificação JWT, mínimo de 32 bytes. |
| `CORS_ORIGIN` | Recomendado | Lista separada por vírgulas das origens web permitidas. |
| `PORT` | Não | Porta HTTP; padrão `3333`. |
| `SEED_ADMIN_EMAIL` | Para seed | E-mail do primeiro administrador. |
| `SEED_ADMIN_PASSWORD` | Para seed | Senha do primeiro administrador, mínimo de 16 caracteres. |

Exemplo local alinhado ao Compose:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gestao_ar_os?schema=public"
CORS_ORIGIN="http://localhost:5173"
JWT_SECRET="<gere uma chave aleatória com openssl rand -base64 48>"
PORT=3333
```

Não copie uma chave real para `.env.example`, documentação, logs ou Git. Se
uma chave JWT foi publicada, substitua-a e considere todos os tokens emitidos
com ela comprometidos.

## Frontend

`frontend/.env.example` documenta `VITE_API_URL`, por exemplo:

```dotenv
VITE_API_URL="http://localhost:3333/api"
```

Variáveis `VITE_*` são embutidas no bundle durante o build e ficam visíveis
para usuários do navegador. Nunca coloque senhas, tokens privados ou strings
de conexão nelas.

## Identidade e datas

O sistema usa o fuso `America/Sao_Paulo` para apresentação e entrada de
agendamentos no frontend. O armazenamento de datas é feito como `DateTime`
no PostgreSQL/Prisma; em produção, mantenha os servidores sincronizados por
NTP e configure explicitamente o fuso do processo para rotinas agendadas.