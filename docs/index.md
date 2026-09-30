# Climatiza

O Climatiza organiza a rotina de uma equipe de serviços técnicos: cadastro
de clientes e endereços, chamados, agenda, atribuição de técnicos, histórico
operacional e lembretes de retorno preventivo.

## Componentes

| Componente | Tecnologia | Diretório |
|---|---|---|
| API | Node.js, Express, TypeScript, Prisma | `backend/` |
| Banco | PostgreSQL | externo; Compose local em `backend/` |
| Aplicação web | React, Vite, TypeScript, Tailwind CSS | `frontend/` |
| Documentação | MkDocs Material | `docs/` |

## Começar

1. Siga [Instalação local](getting-started.md).
2. Configure as [variáveis de ambiente](configuration.md).
3. Conheça [perfis e permissões](permissions.md) antes de criar usuários.
4. Consulte a [API](api.md) para integrações e suporte.

## Funções disponíveis

- Login com token JWT e papéis `ADMIN` e `TECNICO`.
- Cadastro e edição de clientes e endereços, incluindo consulta de CEP via ViaCEP.
- Chamados com agendamento, técnico responsável, status, histórico, notas e links de anexos.
- Agenda com visualizações por período e filtros operacionais.
- Dashboard com resumo, gráficos, carga por técnico e alertas preventivos.
- Lembrete interno quando se aproxima o retorno definido em um chamado preventivo.

## Situação do projeto

O sistema possui builds de produção para frontend e backend e migrações
Prisma versionadas. Este repositório não contém configuração de deploy,
pipeline CI ou testes automatizados. O canal de notificação atual registra
eventos no banco e escreve no console; não envia e-mail, SMS ou WhatsApp.
Consulte [Hospedagem e deploy](deployment.md) e [Segurança e limitações](security.md)
antes de publicar na internet.