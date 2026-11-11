import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";

export function DefinirSenha() {
  const { user, finishFirstAccess } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== passwordConfirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await finishFirstAccess(password, passwordConfirmation);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { error?: string; detalhes?: Array<{ mensagem: string }> } } })?.response?.data;
      const detalheMsg = resp?.detalhes?.[0]?.mensagem;
      setError(detalheMsg ?? resp?.error ?? "Não foi possível definir a senha. Use pelo menos 8 caracteres contendo letras e números.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-surface p-7 shadow-panel">
        <div className="mb-5">
          <Logo variant="login" subtitle="Primeiro acesso" />
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Crie sua senha</h1>
        <p className="mt-1 text-xs leading-5 text-inkMuted">Escolha uma senha pessoal para acessar o Climatiza (mínimo de 8 caracteres com letras e números).</p>

        {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800" role="alert">{error}</p>}

        <div className="mt-5 space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink">Nova senha</span>
            <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink">Confirme a nova senha</span>
            <input required minLength={8} type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="campo-input" />
          </label>
        </div>

        <button type="submit" disabled={loading} className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accentMuted disabled:opacity-50">
          {loading ? "Salvando..." : "Definir senha e continuar"}
        </button>
      </form>
    </div>
  );
}