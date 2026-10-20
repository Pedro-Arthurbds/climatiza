import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api, NOTIFICATION_CHANGE_EVENT } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { BannerAssinatura } from "./BannerAssinatura";
import { useAssinatura } from "../context/SubscriptionContext";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "TECNICO"] },
  { to: "/chamados", label: "Chamados", roles: ["ADMIN", "TECNICO"] },
  { to: "/agenda", label: "Agenda", roles: ["ADMIN", "TECNICO"] },
  { to: "/clientes", label: "Clientes", roles: ["ADMIN", "TECNICO"] },
  { to: "/notificacoes", label: "Notificações", roles: ["ADMIN", "TECNICO"] },
  { to: "/tipos-servico", label: "Tipos de serviço", roles: ["ADMIN"] },
  { to: "/usuarios", label: "Usuários", roles: ["ADMIN"] },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { assinatura } = useAssinatura();
  const [pendentes, setPendentes] = useState(0);
  const [erroContagem, setErroContagem] = useState(false);
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);

  useEffect(() => {
    async function carregarContagem() {
      try {
        const { data } = await api.get<{ total: number }>("/notificacoes/contagem", {
          params: { resolution: false },
        });
        setPendentes(data.total);
        setErroContagem(false);
      } catch {
        setErroContagem(true);
      }
    }

    function aoAlterarNotificacoes() {
      void carregarContagem();
    }

    function aoVoltarParaAba() {
      if (document.visibilityState === "visible") {
        void carregarContagem();
      }
    }

    carregarContagem();

    window.addEventListener(NOTIFICATION_CHANGE_EVENT, aoAlterarNotificacoes);
    window.addEventListener("focus", aoVoltarParaAba);

    return () => {
      window.removeEventListener(NOTIFICATION_CHANGE_EVENT, aoAlterarNotificacoes);
      window.removeEventListener("focus", aoVoltarParaAba);
    };
  }, []);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && mobileMenuAberto) {
        setMobileMenuAberto(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuAberto]);
  const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : 'Técnico';

  const navContent = (
    <>
      <div className="px-5 py-6">
        <div className="mb-5">
          <Logo variant="sidebar" subtitle="Operação" />
        </div>

        <div className="rounded-2xl border border-[#3f5653] bg-[#263939] p-3">
          <p className="text-sm font-semibold text-[#fffaf3]">{user?.name}</p>
          <p className="text-xs text-[#d5d0c7]">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
        {links
          .filter((link) => user && link.roles.includes(user.role))
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMobileMenuAberto(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <span>{link.label}</span>
              {link.to === "/notificacoes" && pendentes > 0 && (
                <span className="rounded-full bg-status-cancelado px-1.5 py-0.5 text-[10px] font-bold text-base">
                  {pendentes}
                </span>
              )}
              {link.to === "/notificacoes" && erroContagem && (
                <span className="text-[10px] text-status-cancelado" role="status">
                  Contagem indisponível
                </span>
              )}
            </NavLink>
          ))}
        {assinatura?.canManage && (
          <NavLink
            to="/admin/assinatura"
            onClick={() => setMobileMenuAberto(false)}
            className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
          >
            <span>Mensalidade</span>
          </NavLink>
        )}
      </nav>

      <div className="border-t border-[#3f5653] p-3">
        <button
          onClick={logout}
          className="w-full rounded-xl border border-[#3f5653] bg-[#263939] px-3 py-2 text-left text-sm font-medium text-[#e2dccf] transition hover:border-[#d58e5d]/60 hover:bg-[#2d4643] hover:text-white"
        >
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell min-h-screen lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <a
        href="#app-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-base"
      >
        Pular para o conteúdo principal
      </a>

      <aside className="sidebar-panel lg:sticky lg:top-0 lg:h-dvh">
        {navContent}
      </aside>

      <div
        className={`mobile-drawer-backdrop ${mobileMenuAberto ? 'is-open' : ''}`}
        onClick={() => setMobileMenuAberto(false)}
      />

      <aside
        id="mobile-nav"
        aria-label="Menu principal mobile"
        className={`mobile-sidebar ${mobileMenuAberto ? 'is-open' : ''}`}
      >
        {navContent}
      </aside>

      <main
        id="app-main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 overflow-y-auto outline-none bg-[#f6f1e8] lg:h-dvh lg:min-h-0"
      >
        <BannerAssinatura />
        <header className="sticky top-0 z-10 border-b border-border/80 bg-[#f7f3eb]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={mobileMenuAberto ? 'Fechar menu' : 'Abrir menu'}
                aria-controls="mobile-nav"
                aria-expanded={mobileMenuAberto}
                onClick={() => setMobileMenuAberto((v) => !v)}
                className="mobile-nav-toggle lg:hidden"
              >
                ☰
              </button>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Visão geral</p>
                <h2 className="mt-1 text-2xl text-ink">Operação Climatiza</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-inkMuted sm:inline-flex">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="rounded-full border border-[#2f4f48]/20 bg-[#2f4f48]/10 px-3 py-1.5 text-xs font-semibold text-accent">
                {roleLabel}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
