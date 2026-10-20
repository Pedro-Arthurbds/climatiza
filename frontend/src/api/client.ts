import axios from "axios";

export const NOTIFICATION_CHANGE_EVENT = "climatiza:notifications-changed";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("climatiza:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token expirado/inválido: derruba a sessão local e manda pro login.
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (method && method !== "get" && method !== "head") {
      const requestUrl = new URL(
        response.config.url ?? "",
        response.config.baseURL ?? window.location.origin
      ).pathname;
      const alteraNotificacoes =
        /\/chamados(?:\/[^/]+)?(?:\/(?:status|atribuir|reagendar))?$/.test(requestUrl) ||
        /\/notificacoes(?:\/[^/]+\/resolver)?$/.test(requestUrl) ||
        /\/dashboard\/verificar-manutencoes$/.test(requestUrl);

      if (alteraNotificacoes) {
        window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("climatiza:token");
      localStorage.removeItem("climatiza:user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    } else if (
      error.response?.status === 402 &&
      error.config?.url !== "/auth/login" &&
      !window.location.pathname.startsWith("/assinatura-pendente")
    ) {
      const mensagem = error.response.data?.error;
      if (typeof mensagem === "string") {
        sessionStorage.setItem("climatiza:billing-message", mensagem);
      }
      window.location.href = "/assinatura-pendente";
    }
    return Promise.reject(error);
  }
);
