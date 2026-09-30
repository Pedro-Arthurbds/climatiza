import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { Agenda } from "./pages/Agenda";
import { Chamados } from "./pages/Chamados";
import { Clientes } from "./pages/Clientes";
import { DefinirSenha } from "./pages/DefinirSenha";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Notificacoes } from "./pages/Notificacoes";
import { TiposServico } from "./pages/TiposServico";
import { Usuarios } from "./pages/Usuarios";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowPasswordChange />}>
          <Route path="/definir-senha" element={<DefinirSenha />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chamados" element={<Chamados />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/notificacoes" element={<Notificacoes />} />

            <Route element={<ProtectedRoute allow={["ADMIN"]} />}>
              <Route path="/tipos-servico" element={<TiposServico />} />
              <Route path="/usuarios" element={<Usuarios />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
