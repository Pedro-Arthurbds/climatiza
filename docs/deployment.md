# Hospedagem e deploy

Este repositório não fixa provedor nem contém pipeline CI ou Dockerfile da
aplicação. O Compose atual serve apenas para PostgreSQL local. A hospedagem
precisa fornecer Node.js, PostgreSQL persistente, HTTPS e configuração de
variáveis de ambiente.

## Backend

Passos típicos em um serviço Node:

1. Instalar dependências com `npm ci` em `backend/`.
2. Gerar Prisma Client com `npm run prisma:generate`.
3. Compilar com `npm run build`.
4. Em etapa de release, aplicar migrações versionadas com `npx prisma migrate deploy`.
5. Iniciar com `npm start`.
6. Configurar health check em `/health`.

Variáveis mínimas:

- `DATABASE_URL`: conexão PostgreSQL de produção, com TLS conforme o serviço.
- `JWT_SECRET`: aleatória, privada, com no mínimo 32 bytes; não reutilize a chave local.
- `CORS_ORIGIN`: origem exata do frontend publicado, sem curingas.
- `PORT`: porta indicada pela plataforma, se exigida.

Crie o ADMIN inicial uma única vez pelo seed antes de abrir acesso público;
forneça `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` como variáveis temporárias
seguras, e remova-as após o seed. Não execute `prisma migrate dev` em produção.

## Frontend estático

1. Instalar dependências com `npm ci` em `frontend/`.
2. Definir `VITE_API_URL` para `https://<api>/api` durante o build.
3. Executar `npm run build` e publicar `frontend/dist/`.
4. Configurar fallback SPA para `index.html` nas rotas do React Router.

## Banco, backups e rede

- Use banco gerenciado ou PostgreSQL privado; não publique a porta do banco
  diretamente na internet.
- Use credenciais únicas, privilégios mínimos e TLS quando disponível.
- Configure backups automáticos e teste restauração antes de operar dados reais.
- Monitore espaço, conexões e execução das migrações.
- Restrinja logs e configure retenção adequada; logs podem conter dados pessoais.

## Processos em mais de uma réplica

O cron preventivo roda dentro da API. Com múltiplas instâncias, cada instância
executará a rotina. Antes de escalar horizontalmente, mova o cron para um
worker único/scheduler ou implemente trava/idempotência distribuída.

## Após publicar

- `GET /health` responde com sucesso.
- Login ADMIN e TECNICO funciona; endpoints ADMIN rejeitam TECNICO.
- CORS permite somente o domínio público do frontend.
- Frontend chama a URL HTTPS pública, não `localhost`.
- Migrações aplicadas e seed executado com segurança.
- Backups e restauração verificados.
- Logs confirmam início do job preventivo no fuso planejado.