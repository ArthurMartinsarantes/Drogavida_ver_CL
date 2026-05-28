import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppLayout } from "@/pages/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FrotaPage } from "@/components/frota/frota-page";
import { CaixaPage } from "@/components/caixa/caixa-page";
import { RotasPage } from "@/components/rotas/rotas-page";
import { CartoesPage } from "@/components/cartoes/cartoes-page";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/frota" element={<FrotaPage />} />
            <Route path="/caixa" element={<CaixaPage />} />
            <Route path="/rotas" element={<RotasPage />} />
            <Route path="/cartoes" element={<CartoesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
