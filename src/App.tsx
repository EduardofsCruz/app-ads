import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import Home from "@/pages/Home";
import CardapioVivo from "@/pages/CardapioVivo";
import Fidelidade from "@/pages/Fidelidade";
import DashboardEmpreendedor from "@/pages/DashboardEmpreendedor";
import Perfil from "@/pages/Perfil";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/cardapio/:id" element={<CardapioVivo />} />
              <Route path="/fidelidade" element={<Fidelidade />} />
              <Route path="/perfil" element={<Perfil />} />

              <Route element={<ProtectedRoute tipoPermitido="empreendedor" />}>
                <Route path="/trailer/dashboard" element={<DashboardEmpreendedor />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
