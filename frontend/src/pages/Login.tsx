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
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-8"
      >
        <p className="text-xl font-extrabold tracking-tight">Climatiza</p>
        <p className="mb-6 mt-1 text-sm text-inkMuted">
          Entre com sua conta para acessar os chamados.
        </p>

        <label className="mb-1 block text-sm font-medium text-inkMuted">
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-border bg-surfaceAlt px-3 py-2 text-sm outline-none focus:border-accent"
        />

        <label className="mb-1 block text-sm font-medium text-inkMuted">
          Senha
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 w-full rounded-md border border-border bg-surfaceAlt px-3 py-2 text-sm outline-none focus:border-accent"
        />

        {erro && <p className="mb-2 text-sm text-status-cancelado">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="mt-4 w-full rounded-md bg-accent px-3 py-2 text-sm font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
