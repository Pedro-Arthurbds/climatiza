# Aplicação web

O frontend é uma SPA React, TypeScript e Vite. As rotas estão em
`frontend/src/App.tsx`; os tipos que espelham os modelos da API ficam em
`frontend/src/types/index.ts`.

## Páginas

| Rota | Página | Uso |
|---|---|---|
| `/login` | Login | Autenticar usuário ativo. |
| `/` | Dashboard | Indicadores, gráficos, carga da equipe e retornos preventivos. |
| `/chamados` | Chamados | Filtrar, abrir chamado, ver detalhe, status, notas e histórico. |
| `/agenda` | Agenda | Consultar agenda por período e abrir/reagendar chamados. |
| `/clientes` | Clientes | Buscar, cadastrar e editar clientes e endereços. |
| `/notificacoes` | Notificações | Consultar pendentes/resolvidas e verificar retornos (ADMIN). |
| `/tipos-servico` | Tipos de serviço | Gerenciar tipos (ADMIN). |
| `/usuarios` | Usuários | Gerenciar contas e papéis (ADMIN). |

## Sessão e API

O token é mantido em `localStorage` e enviado via `Authorization: Bearer`.
Em 401, a sessão local é removida e o usuário é enviado ao login. O bundle é
estático e pode ser hospedado em CDN; configure `VITE_API_URL` no momento do
build para o endpoint público da API.

## Datas

Entrada de data e hora de atendimento usa `dd/mm/aaaa` e `HH:MM`, convertidos
para o fuso `America/Sao_Paulo`. A exibição de datas do chamado e histórico
usa a mesma localização.

## Build

```bash
cd frontend
npm ci
npm run build
```

O resultado é gerado em `frontend/dist/`. Para SPA, configure o host estático
para encaminhar rotas não encontradas para `index.html`.