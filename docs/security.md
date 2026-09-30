# Segurança e limitações

## Controles implementados

- Senhas são armazenadas com hash bcrypt.
- JWT HS256 expira em oito horas; o backend exige `JWT_SECRET` com pelo
  menos 32 bytes antes de assinar ou validar tokens.
- Rotas têm autenticação bearer e autorização ADMIN/TECNICO por recurso.
- Técnicos só consultam chamados próprios ou sem responsável; alterações
  de status são limitadas aos chamados atribuídos a eles.
- Notas e anexos verificam que o técnico tem acesso ao chamado; técnico só
  remove as próprias notas.
- Entradas são validadas por schemas Zod e respostas de erro genéricas não
  expõem stack trace ao cliente.
- O seed não tem senha padrão, exige senha de 16 caracteres ou mais e não
  grava a senha nos logs.

## Configuração obrigatória antes de produção

- Gerar e guardar `JWT_SECRET` em cofre/gerenciador de segredos. A chave
  anteriormente presente no arquivo de exemplo foi removida; se já foi
  compartilhada, não a reutilize.
- Configurar allowlist CORS explícita. O servidor ainda aceita qualquer
  origem quando `CORS_ORIGIN` fica vazia; defina a variável antes de publicar.
- Nunca versionar `.env`, credenciais de banco, segredos ou dados reais.
- Remover credenciais temporárias de seed do ambiente após uso.
- Usar HTTPS para frontend e API, banco não público, backups e retenção
  controlada de logs.

## Limitações conhecidas

- Não há rate limiting próprio no login; configure proteção na borda/API gateway.
- JWT não é revogado imediatamente quando usuário é desativado ou tem papel
  alterado; token já emitido pode permanecer válido até expirar.
- Canal de notificação só registra em console, sem e-mail/SMS/WhatsApp real.
- Anexos são URLs e metadados; não existe upload, antivírus ou política de
  domínio/storage no sistema.
- O job cron embutido não tem coordenação distribuída entre réplicas.
- Não há suíte automatizada de testes configurada no `package.json`.
- `npm audit` deve ser executado regularmente e atualizações major devem ser
  avaliadas e testadas antes de deploy.

## Dados pessoais

O sistema armazena nome, e-mail, telefone, documento e endereço de clientes,
além de notas internas e dados de atendimento. Restrinja acesso, defina
retenção e descarte, formalize backups e avalie os requisitos legais de
privacidade aplicáveis à operação.