import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";

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
    } catch (error) {
      const resposta = (
        error as { response?: { status?: number; data?: { error?: unknown } } }
      ).response;
      setErro(
        resposta?.status === 402 && typeof resposta.data?.error === "string"
          ? resposta.data.error
          : "E-mail ou senha inválidos."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-3 py-4 sm:px-4 sm:py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-gradient-to-br from-[#0b1320] via-[#111c2e] to-[#1e293b] p-6 text-white sm:p-8 md:p-10">
            <div>
              <div className="mb-4 sm:mb-8">
                <Logo variant="sidebar" subtitle="Sistema" />
              </div>

              <h1 className="max-w-md text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                Operação mais clara para climatizar cada atendimento.
              </h1>
              <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-[#94a3b8] md:block">
                Centralize chamados, agenda, clientes e manutenções com precisão técnica e agilidade no dia a dia.
              </p>
            </div>

            <div className="mt-8 hidden gap-3 md:grid md:grid-cols-3">
              <div className="rounded-xl border border-[#334155] bg-[#0b1320]/60 p-3">
                <p className="text-xs font-medium text-[#94a3b8]">Agenda</p>
                <p className="mt-1 text-sm font-bold text-white">Sem conflitos</p>
              </div>
              <div className="rounded-xl border border-[#334155] bg-[#0b1320]/60 p-3">
                <p className="text-xs font-medium text-[#94a3b8]">Chamados</p>
                <p className="mt-1 text-sm font-bold text-white">Visão total</p>
              </div>
              <div className="rounded-xl border border-[#334155] bg-[#0b1320]/60 p-3">
                <p className="text-xs font-medium text-[#94a3b8]">SLA</p>
                <p className="mt-1 text-sm font-bold text-white">No prazo</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-surfaceAlt/40 p-5 sm:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-subtle sm:p-7">
              <p className="text-xs font-semibold text-accent">Acesso ao sistema</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Entrar</h2>
              <p className="mt-1 text-xs text-inkMuted">Informe suas credenciais para continuar.</p>

              <div className="mt-5 space-y-3.5">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink">E-mail</span>
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
                  <span className="mb-1 block text-xs font-medium text-ink">Senha</span>
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

              {erro && <p className="mt-3 text-xs font-medium text-status-cancelado">{erro}</p>}

              <button
                type="submit"
                disabled={carregando}
                className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accentMuted disabled:opacity-50"
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
