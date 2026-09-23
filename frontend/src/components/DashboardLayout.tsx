import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "TECNICO"] },
  { to: "/chamados", label: "Chamados", roles: ["ADMIN", "TECNICO"] },
  { to: "/agenda", label: "Agenda", roles: ["ADMIN", "TECNICO"] },
  { to: "/clientes", label: "Clientes", roles: ["ADMIN", "TECNICO"] },
  { to: "/notificacoes", label: "Notificações", roles: ["ADMIN", "TECNICO"] },
  { to: "/tipos-servico", label: "Tipos de serviço", roles: ["ADMIN"] },
  { to: "/usuarios", label: "Usuários", roles: ["ADMIN"] },
];

// Intervalo de checagem do contador de pendentes — simples "alerta dentro
// do sistema" sem precisar de websocket/push; se quiser tempo real de
// verdade depois, é aqui que entra.
const INTERVALO_POLL_MS = 60_000;

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    async function carregarContagem() {
      try {
        const { data } = await api.get<{ id: string }[]>("/notificacoes", {
          params: { resolution: false },
        });
        setPendentes(data.length);
      } catch {
        // silencioso — o contador não é crítico o bastante pra travar a tela
      }
    }
    carregarContagem();
    const id = setInterval(carregarContagem, INTERVALO_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : 'Técnico';

  return (
    <div className="app-shell min-h-screen">
      <aside className="sidebar-panel">
        <div className="px-5 py-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-lg font-bold text-accent">
              C
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-ink">Climatiza</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-inkMuted">Operação</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surfaceAlt/70 p-3">
            <p className="text-sm font-semibold text-ink">{user?.name}</p>
            <p className="text-xs text-inkMuted">{roleLabel}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links
            .filter((link) => user && link.roles.includes(user.role))
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <span>{link.label}</span>
                {link.to === "/notificacoes" && pendentes > 0 && (
                  <span className="rounded-full bg-status-cancelado px-1.5 py-0.5 text-[10px] font-bold text-base">
                    {pendentes}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={logout}
            className="w-full rounded-xl border border-border px-3 py-2 text-left text-sm font-medium text-inkMuted transition hover:border-accent/70 hover:bg-surfaceAlt hover:text-ink"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-base/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Visão geral</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Operação Climatiza</h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-inkMuted sm:inline-flex">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
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
