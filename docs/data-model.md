# Modelo de dados

O schema canônico está em `backend/prisma/schema.prisma`; a evolução do banco
é versionada em `backend/prisma/migrations/`.

| Entidade | Finalidade e relações |
|---|---|
| `User` | Usuário ADMIN ou TECNICO; pode ser responsável por chamados, notas, anexos e auditorias. Desativação é lógica. |
| `Company` | Configurações da instalação, incluindo SLA e dias de antecedência do lembrete. O código usa o ID singleton `company-default`. |
| `Client` | Cadastro de cliente e contato; possui vários endereços, chamados e notificações. Desativação é lógica. |
| `Address` | Endereço de um cliente; chamado guarda a referência do endereço atendido. |
| `ServiceType` | Tipo de serviço ativo/inativo; possui campo `maintenanceIntervalDays` no schema, mas o fluxo atual de retorno usa os dias definidos no chamado. |
| `Ticket` | Chamado ligado a cliente, endereço, tipo e opcionalmente responsável; guarda status, agendamento e dados preventivos. |
| `TicketStatusHistory` | Histórico de transições de status e usuário que fez a alteração. |
| `TicketNote` | Nota interna vinculada ao chamado e opcionalmente ao autor. |
| `TicketAttachment` | Metadados e URL de anexo; não armazena o arquivo binário. |
| `NotificationLog` | Log de notificação ligado ao cliente e opcionalmente ao tipo de serviço; `resolution` indica se foi resolvida. |
| `AuditLog` | Auditoria por tipo/ID da entidade e JSON de alterações; a associação é polimórfica, sem FK para a entidade auditada. |

## Status

`TicketStatus`: `ABERTO`, `EM_ANDAMENTO`, `CONCLUIDO`, `CANCELADO`.

`NotificationType`: `MANUTENCAO_VENCIDA`, `LEMBRETE_MANUTENCAO`,
`AGENDAMENTO`, `TECNICO_ATRIBUIDO`, `CHAMADO_CONCLUIDO`.

## Exclusões

Clientes, usuários e tipos de serviço são desativados, preservando histórico.
Endereços têm exclusão física e podem ser impedidos por referências de
chamados. Excluir um chamado remove em cascata histórico de status, notas e
anexos; o log de auditoria genérico não possui FK e pode permanecer.