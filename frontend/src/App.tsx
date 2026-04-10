import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MenuPrincipal from './pages/MenuPrincipal';
import EntradaRegistroInsumos from './pages/EntradaRegistroInsumos';
import SalidaInsumos from './pages/SalidaInsumos';
import GestionInventario from './pages/GestionInventario';
import ConfiguracionAlertas from './pages/ConfiguracionAlertas';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protegidas — cualquier rol autenticado */}
        <Route element={<ProtectedRoute />}>
          <Route path="/menu" element={<MenuPrincipal />} />
          <Route path="/inventario" element={<GestionInventario />} />
          <Route path="/alertas" element={<ConfiguracionAlertas />} />
        </Route>

        {/* Protegidas — solo admin y user (no viewer) */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
          <Route path="/entradas" element={<EntradaRegistroInsumos />} />
          <Route path="/salidas" element={<SalidaInsumos />} />
        </Route>

        {/* Raíz → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
