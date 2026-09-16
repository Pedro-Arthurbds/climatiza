import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "TECNICO"] },
  { to: "/chamados", label: "Chamados", roles: ["ADMIN", "TECNICO"] },
  { to: "/agenda", label: "Agenda", roles: ["ADMIN", "TECNICO"] },
  { to: "/clientes", label: "Clientes", roles: ["ADMIN", "TECNICO"] },
  { to: "/tipos-servico", label: "Tipos de serviço", roles: ["ADMIN"] },
  { to: "/usuarios", label: "Usuários", roles: ["ADMIN"] },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="px-5 py-6">
          <p className="text-lg font-extrabold tracking-tight">Climatiza</p>
          <p className="text-sm text-inkMuted">{user?.name}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links
            .filter((link) => user && link.roles.includes(user.role))
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/15 text-accent"
                      : "text-inkMuted hover:bg-surfaceAlt hover:text-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={logout}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-inkMuted hover:bg-surfaceAlt hover:text-ink"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
