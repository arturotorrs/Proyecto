import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { logoutApi } from "../../api/auth.api";
import { getSocket } from "../../lib/socket";

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Conectar socket y escuchar alertas en TODAS las páginas
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.on('alerta:stock_bajo', (data: { nombre: string; cantidad: number; mensaje: string }) => {
      addToast({ type: 'warning', title: 'Stock Bajo', message: data.mensaje });
    });
    socket.on('alerta:stock_critico', (data: { nombre: string; mensaje: string }) => {
      addToast({ type: 'error', title: 'Stock Crítico', message: data.mensaje });
    });
    socket.on('alerta:caducidad', (data: { nombre: string; dias_restantes: number; mensaje: string }) => {
      addToast({ type: 'warning', title: 'Caducidad Próxima', message: data.mensaje });
    });

    return () => {
      socket.off('alerta:stock_bajo');
      socket.off('alerta:stock_critico');
      socket.off('alerta:caducidad');
      socket.disconnect();
    };
  }, [addToast]);

  async function handleLogout() {
    setOpen(false);
    try {
      await logoutApi();
    } catch {
      // Ignorar errores del servidor en logout
    }
    logout();
    navigate("/login");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = getInitials(user.nombre);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Título */}
        <Link to="/menu" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src="/IMSS_Logo.png"
            alt="Logo IMSS"
            className="w-8 h-8 object-contain"
          />
          <span className="font-semibold text-[#006455] text-sm uppercase tracking-wide hidden sm:block">
            Inventario Traumatología
          </span>
        </Link>

        {/* Dropdown de usuario */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Ícono genérico de usuario */}
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            {/* Iniciales */}
            <span className="text-sm font-semibold text-gray-700">{initials}</span>
            {/* Chevron */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Menú desplegable */}
          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
              {/* Nombre y rol */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
              </div>
              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 mt-1 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
