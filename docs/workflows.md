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
não é enviado ao cliente. A configuração `maintenanceReminderDays` pode ser
alterada por ADMIN em `PATCH /api/empresa`; aceita valores de 0 a 365 dias.
Com 0, o job alerta somente no dia do retorno.

## Notificações

Agendamento, atribuição, conclusão e retorno preventivo criam logs internos
associados ao cliente e ao chamado de origem. Não há integração de e-mail ou
WhatsApp, nem tentativa de entrega externa. A exclusão do chamado preserva o
histórico e remove apenas o vínculo com o chamado.

Técnicos consultam notificações dos chamados atribuídos a eles ou sem
responsável; ADMIN consulta todas. Apenas ADMIN pode resolver notificações.
Marcar uma notificação como resolvida define `resolution=true`. A resolução
preventiva é deduplicada por chamado e data de retorno, inclusive em execuções
concorrentes do job. Ao reabrir um chamado concluído, lembretes preventivos
pendentes daquele chamado são marcados como resolvidos, preservando o histórico.
Uma nova conclusão calcula outra data de retorno e pode gerar novo lembrete.

## Auditoria

Alterações importantes registram ator, entidade, ação, valores anteriores e
posteriores quando aplicável. O histórico de status é separado do `AuditLog`
genérico para manter transições legíveis.