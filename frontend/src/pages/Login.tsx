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
    <div className="flex min-h-screen items-center justify-center bg-[#f6f1e8] px-4 py-10">
      <div className="w-full max-w-6xl overflow-hidden rounded-[30px] border border-[#d5cab2] bg-[#fffdf9]/95 shadow-[0_28px_60px_rgba(31,42,42,0.12)] backdrop-blur-xl">
        <div className="grid md:grid-cols-[1.12fr_0.88fr]">
          <div className="flex flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(47,79,72,0.14),_transparent_32%),linear-gradient(180deg,_#edf2ee_0%,_#f9f3ea_100%)] p-8 lg:p-10">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d58e5d] text-xl font-black text-[#1f2a2a] shadow-[inset_0_0_0_1px_rgba(31,42,42,0.07)]">
                  C
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#5f6a62]">Sistema</p>
                  <p className="text-2xl font-black tracking-tight text-[#1f2a2a]">Climatiza</p>
                </div>
              </div>

              <h1 className="max-w-md text-4xl leading-none text-[#1f2a2a] lg:text-5xl">
                Operação mais clara para climatizar cada atendimento.
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-[#5f6a62]">
                Centralize chamados, agenda, clientes e manutenções com uma visão mais objetiva do dia a dia técnico.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#d9cbb4] bg-[#fffdf9] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#5f6a62]">Agenda</p>
                <p className="mt-2 text-lg font-bold text-[#1f2a2a]">Sem travas</p>
              </div>
              <div className="rounded-2xl border border-[#d9cbb4] bg-[#fffdf9] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#5f6a62]">Chamados</p>
                <p className="mt-2 text-lg font-bold text-[#1f2a2a]">Visão total</p>
              </div>
              <div className="rounded-2xl border border-[#d9cbb4] bg-[#fffdf9] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#5f6a62]">SLA</p>
                <p className="mt-2 text-lg font-bold text-[#1f2a2a]">Mais controle</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-[#f9f3ea] p-6 lg:p-10">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[26px] border border-[#d9cbb4] bg-[#fffdf9] p-6 shadow-[0_18px_40px_rgba(31,42,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5f6a62]">Acesso</p>
              <p className="mt-2 text-3xl text-[#1f2a2a]">Entrar</p>
              <p className="mt-1 text-sm text-[#5f6a62]">Use suas credenciais para continuar.</p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#5f6a62]">E-mail</span>
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
                  <span className="mb-1.5 block text-sm font-medium text-[#5f6a62]">Senha</span>
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
                className="mt-6 w-full rounded-xl bg-[#2f4f48] px-3 py-3 text-sm font-bold text-[#f8f5f0] transition hover:bg-[#24413d] disabled:opacity-60"
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
