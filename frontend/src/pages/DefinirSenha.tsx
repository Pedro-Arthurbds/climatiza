import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    } catch {
      setError("Não foi possível definir a senha. Use pelo menos 6 caracteres.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f1e8] px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[26px] border border-[#d9cbb4] bg-[#fffdf9] p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-inkMuted">Primeiro acesso</p>
        <h1 className="mt-2 text-3xl text-ink">Crie sua senha</h1>
        <p className="mt-2 text-sm leading-6 text-inkMuted">Escolha uma senha pessoal para continuar no Climatiza.</p>

        {error && <p className="mt-4 rounded-2xl border border-[#d9a39b] bg-[#f6e1df] px-4 py-3 text-sm text-[#8c3d35]" role="alert">{error}</p>}

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-inkMuted">Nova senha</span>
            <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="campo-input" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-inkMuted">Confirme a nova senha</span>
            <input required minLength={6} type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="campo-input" />
          </label>
        </div>

        <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-[#2f4f48] px-4 py-2.5 text-sm font-semibold text-[#f9f5f0] hover:bg-[#24413d] disabled:opacity-50">
          {loading ? "Salvando..." : "Definir senha e continuar"}
        </button>
      </form>
    </div>
  );
}