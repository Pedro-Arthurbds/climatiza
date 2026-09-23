import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      setErro("E-mail ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-border/80 bg-surface/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(79,163,168,0.18),_transparent_30%)] p-8 lg:p-10">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-xl font-black text-accent">
                  C
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-inkMuted">Sistema</p>
                  <p className="text-2xl font-black tracking-tight text-ink">Climatiza</p>
                </div>
              </div>

              <h1 className="max-w-md text-3xl font-black tracking-tight text-ink lg:text-4xl">
                Centralize operação, tickets e manutenção em um só lugar.
              </h1>
              <p className="mt-4 max-w-md text-base text-inkMuted">
                Acompanhe chamados, técnicos, clientes e alertas de manutenção preventiva com uma visão operacional mais clara.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surfaceAlt/80 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-inkMuted">Agenda</p>
                <p className="mt-2 text-lg font-bold text-ink">Sem travas</p>
              </div>
              <div className="rounded-2xl border border-border bg-surfaceAlt/80 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-inkMuted">Chamados</p>
                <p className="mt-2 text-lg font-bold text-ink">Visão total</p>
              </div>
              <div className="rounded-2xl border border-border bg-surfaceAlt/80 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-inkMuted">SLA</p>
                <p className="mt-2 text-lg font-bold text-ink">Mais controle</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 lg:p-10">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[24px] border border-border bg-base/60 p-6 shadow-inner shadow-black/10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-inkMuted">Acesso</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-ink">Entrar</p>
              <p className="mt-1 text-sm text-inkMuted">Use suas credenciais para continuar.</p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-inkMuted">E-mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="campo-input"
                    placeholder="seu@email.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-inkMuted">Senha</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="campo-input"
                    placeholder="••••••••"
                  />
                </label>
              </div>

              {erro && <p className="mt-4 text-sm text-status-cancelado">{erro}</p>}

              <button
                type="submit"
                disabled={carregando}
                className="mt-6 w-full rounded-xl bg-accent px-3 py-3 text-sm font-bold text-base transition hover:opacity-90 disabled:opacity-60"
              >
                {carregando ? 'Entrando...' : 'Entrar no sistema'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
