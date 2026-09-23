export interface EnvioNotificacao {
  destinatario: string;
  assunto?: string;
  mensagem: string;
}

// Canal de envio isolado do resto do sistema de propósito: hoje só loga
// no console (a notificação em si já fica gravada no NotificationLog,
// isso aqui é só o "disparo" externo). Quando decidir o provedor de
// e-mail (Resend, SendGrid...) ou WhatsApp (Cloud API), troca só o corpo
// desta função — nenhum outro arquivo do sistema precisa mudar.
export async function enviarNotificacao(envio: EnvioNotificacao) {
  console.log(`[notificação] → ${envio.destinatario}: ${envio.mensagem}`);
}
