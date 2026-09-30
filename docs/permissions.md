# Perfis e permissões

| Operação | ADMIN | TECNICO | Público |
|---|:---:|:---:|:---:|
| Health check `GET /health` | Sim | Sim | Sim |
| Login `POST /api/auth/login` | Sim | Sim | Sim |
| Dashboard, agenda e consultas | Sim | Sim | Não |
| Gerenciar usuários | Sim | Não | Não |
| Criar/editar/desativar cliente | Sim | Não | Não |
| Consultar clientes e tipos de serviço | Sim | Sim | Não |
| Criar/editar/desativar tipo de serviço | Sim | Não | Não |
| Criar, editar ou excluir chamado | Sim | Não | Não |
| Alterar status de chamado | Sim | Chamado próprio | Não |
| Atribuir e reagendar | Sim | Não | Não |
| Consultar chamado | Todos | Próprio ou sem responsável | Não |
| Criar nota/anexo | Sim | Chamado acessível | Não |
| Excluir nota | Qualquer nota | Própria nota em chamado acessível | Não |
| Excluir anexo / resolver notificação | Sim | Não | Não |

As rotas de API exigem `Authorization: Bearer <token>`, exceto login e
`/health`. O JWT dura oito horas e contém o ID e papel do usuário. O backend
valida o token e os controllers aplicam escopo por recurso; não confie apenas
na visibilidade de menus ou rotas do frontend.

Técnicos veem chamados atribuídos a si ou sem responsável. A rota de agenda
usa o mesmo filtro. A carga de equipe do dashboard inclui usuários ativos
ADMIN e TECNICO.