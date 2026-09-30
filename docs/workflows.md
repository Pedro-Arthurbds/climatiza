# Fluxos operacionais

## Abrir e atender chamado

1. ADMIN seleciona um cliente existente ou cadastra um cliente novo pelo
   formulário de chamado.
2. Seleciona endereço, tipo de serviço, data/hora, técnico opcional e dados
   do equipamento/problema.
3. O chamado inicia em `ABERTO`; transições ficam em `TicketStatusHistory`.
4. ADMIN atribui técnico ou reagenda. O técnico atualiza status apenas em
   chamados atribuídos a ele.
5. Ao concluir, `completedAt` recebe a hora real da conclusão.

## Retorno preventivo

Ao marcar o chamado como preventivo, informe `maintenanceReturnDays`. A data
`maintenanceNextAt` é calculada quando o atendimento é concluído:

```text
maintenanceNextAt = completedAt + maintenanceReturnDays
```

Reabrir o chamado limpa `completedAt` e `maintenanceNextAt`; concluir
novamente inicia uma nova contagem. O job consulta chamados preventivos
concluídos cuja data de retorno está entre o início do dia atual e a janela
de antecedência. A antecedência vem de `Company.maintenanceReminderDays`,
com padrão de 7 dias.

O job roda ao iniciar a API e diariamente às 08:00 conforme o fuso do
processo. O botão ADMIN “Verificar retornos próximos” executa a mesma
verificação imediatamente. O registro aparece como notificação interna e
não é enviado ao cliente.

## Notificações

Agendamento, atribuição e conclusão criam logs associados ao cliente. O canal
externo atual somente escreve no console; não existe integração real de
e-mail/WhatsApp. O retorno preventivo também fica no log interno, mas não
dispara o canal externo.

Marcar uma notificação como resolvida define `resolution=true`. Para gerar
outro alerta de retorno para o mesmo chamado, a janela precisa ser verificada
e não deve já existir log preventivo dentro da mesma janela.

## Auditoria

Alterações importantes registram ator, entidade, ação, valores anteriores e
posteriores quando aplicável. O histórico de status é separado do `AuditLog`
genérico para manter transições legíveis.