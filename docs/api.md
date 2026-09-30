# Referência da API

Base local: `http://localhost:3333/api`. Salvo `/health` e login, as rotas
exigem:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

O login retorna o token JWT e os dados públicos do usuário. Corpos inválidos
retornam `400`; token ausente/inválido retorna `401`; falta de permissão
retorna `403`; registro inexistente retorna `404`; conflito de unicidade
retorna `409`.

## Saúde e autenticação

| Método | Caminho | Acesso | Observação |
|---|---|---|---|
| `GET` | `/health` | Público | Health check da API. |
| `POST` | `/auth/login` | Público | Corpo: `{ "email": "...", "password": "..." }`. |

## Usuários

Todas as rotas abaixo são ADMIN.

| Método | Caminho | Observação |
|---|---|---|
| `GET` | `/usuarios` | Listar usuários. |
| `GET` | `/usuarios/:id` | Consultar usuário. |
| `POST` | `/usuarios` | Criar usuário. |
| `PATCH` | `/usuarios/:id` | Atualizar dados/estado permitido. |
| `DELETE` | `/usuarios/:id` | Desativação lógica. |

## Clientes e endereços

| Método | Caminho | Acesso |
|---|---|---|
| `GET` | `/clientes` | ADMIN, TECNICO |
| `GET` | `/clientes/:id` | ADMIN, TECNICO |
| `POST` | `/clientes` | ADMIN |
| `PATCH` | `/clientes/:id` | ADMIN |
| `DELETE` | `/clientes/:id` | ADMIN; desativa cliente |
| `POST` | `/clientes/:clienteId/enderecos` | ADMIN |
| `PATCH` | `/enderecos/:id` | ADMIN |
| `DELETE` | `/enderecos/:id` | ADMIN |

## Tipos de serviço

| Método | Caminho | Acesso |
|---|---|---|
| `GET` | `/tipos-servico` | ADMIN, TECNICO |
| `POST` | `/tipos-servico` | ADMIN |
| `PATCH` | `/tipos-servico/:id` | ADMIN |
| `DELETE` | `/tipos-servico/:id` | ADMIN; desativa tipo |

## Chamados

| Método | Caminho | Acesso | Observação |
|---|---|---|---|
| `GET` | `/chamados` | ADMIN, TECNICO | Técnico vê atribuídos a si ou sem responsável. Aceita `status` e `userId`. |
| `GET` | `/chamados/agenda?from=ISO&to=ISO` | ADMIN, TECNICO | Aceita filtros `userId`, `city`, `status`, `serviceTypeId`. |
| `GET` | `/chamados/:id` | ADMIN, técnico com escopo | Detalhe, cliente/endereço, histórico, notas, anexos e auditoria. |
| `POST` | `/chamados` | ADMIN | Abre chamado; campos incluem cliente, endereço, serviço, equipamento, problema, agendamento e dados preventivos opcionais. |
| `PATCH` | `/chamados/:id` | ADMIN | Edita campos permitidos do chamado. |
| `DELETE` | `/chamados/:id` | ADMIN | Remove chamado e dependências em cascata. |
| `PATCH` | `/chamados/:id/status` | ADMIN ou técnico responsável | Corpo: `{ "status": "EM_ANDAMENTO", "note": "..." }`. |
| `PATCH` | `/chamados/:id/atribuir` | ADMIN | Corpo: `{ "userId": "..." }`; aceita `null` para remover atribuição. |
| `PATCH` | `/chamados/:id/reagendar` | ADMIN | Corpo: `{ "scheduledAt": "ISO-8601" }`; aceita `null` para limpar. |
| `POST` | `/chamados/:id/notas` | Usuário com acesso ao chamado | Corpo: `{ "content": "..." }`. |
| `DELETE` | `/chamados/:id/notas/:notaId` | ADMIN ou autor técnico | Nota precisa pertencer ao chamado da rota. |
| `POST` | `/chamados/:id/anexos` | Usuário com acesso ao chamado | Corpo: `{ "filename": "...", "url": "https://...", "mimeType": "..." }`. |
| `DELETE` | `/chamados/:id/anexos/:anexoId` | ADMIN | Remove metadados do anexo. |

Status válidos: `ABERTO`, `EM_ANDAMENTO`, `CONCLUIDO`, `CANCELADO`.
Conclusão registra `completedAt`; em chamado preventivo calcula a data de
retorno. Reabertura limpa conclusão e retorno.

## Notificações

| Método | Caminho | Acesso | Observação |
|---|---|---|---|
| `GET` | `/notificacoes` | ADMIN, TECNICO | Filtros opcionais: `clientId`, `resolution=true|false`, `type`. |
| `POST` | `/notificacoes` | ADMIN | Criar registro manual. |
| `PATCH` | `/notificacoes/:id/resolver` | ADMIN | Marcar como resolvida. |

## Dashboard e empresa

| Método | Caminho | Acesso | Observação |
|---|---|---|---|
| `GET` | `/dashboard/resumo` | ADMIN, TECNICO | Contagens e SLA. |
| `GET` | `/dashboard/contatos-prioritarios` | ADMIN, TECNICO | Logs pendentes agrupados por período. |
| `GET` | `/dashboard/por-tecnico` | ADMIN, TECNICO | Carga e chamados concluídos por usuário ativo. |
| `GET` | `/dashboard/grafico` | ADMIN, TECNICO | Chamados por mês e serviço. |
| `GET` | `/dashboard/alertas` | ADMIN, TECNICO | Retornos preventivos pendentes associados ao chamado. |
| `POST` | `/dashboard/verificar-manutencoes` | ADMIN | Disparar verificação de retornos próximos. |
| `GET` | `/empresa` | ADMIN, TECNICO | Ler configurações da empresa singleton. |
| `PATCH` | `/empresa` | ADMIN | Atualizar campos aceitos pelo schema do controller. |

## Notas de integração

- Datas da API são ISO-8601; a interface de usuário apresenta e aceita o
  padrão brasileiro.
- O frontend utiliza `VITE_API_URL` como base, incluindo o prefixo `/api`.
- A rota `exemplo` existe em código, mas não está montada em `routes/index.ts`
  e não faz parte da API publicada.