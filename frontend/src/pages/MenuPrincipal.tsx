import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import FooterIMSS from "../components/layout/FooterIMSS";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import ToastContainer from "../components/ui/Toast";

interface CardInfo {
  title: string;
  description: string;
  buttonLabel: string;
  route: string;
  icon: ReactElement;
  adminOnly?: boolean;
  viewerHidden?: boolean;
}

const cards: CardInfo[] = [
  {
    title: "ENTRADA DE INSUMOS",
    description: "Registra entradas de insumos",
    buttonLabel: "ENTRADA DE INSUMOS",
    route: "/entradas",
    viewerHidden: true,
    icon: (
      <svg
        className="w-10 h-10 text-[#006455]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    title: "SALIDA DE INSUMOS",
    description: "Registra el consumo de materiales",
    buttonLabel: "SALIDA DE INSUMOS",
    route: "/salidas",
    viewerHidden: true,
    icon: (
      <svg
        className="w-10 h-10 text-[#006455]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-3-3m3 3l3-3"
        />
      </svg>
    ),
  },
  {
    title: "GESTIÓN DE INVENTARIO",
    description: "Consulta inventario, historial y búsquedas",
    buttonLabel: "VISUALIZAR INVENTARIO Y HISTORIAL",
    route: "/inventario",
    icon: (
      <svg
        className="w-10 h-10 text-[#006455]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
  },
  {
    title: "CONFIGURACIÓN DE ALERTAS",
    description: "Configura el tiempo de las alertas",
    buttonLabel: "AJUSTAR ALERTAS",
    route: "/alertas",
    icon: (
      <svg
        className="w-10 h-10 text-[#006455]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
];

export default function MenuPrincipal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const visibleCards = cards.filter(
    (c) =>
      (!c.adminOnly || user?.rol === "admin") &&
      (!c.viewerHidden || user?.rol !== "viewer"),
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <ToastContainer />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-center text-[#006455] uppercase tracking-wide mb-8">
          Menú Principal de Inventario
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {visibleCards.map((card) => (
            <div
              key={card.route}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="p-3 bg-green-50 rounded-full">{card.icon}</div>
              <div>
                <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                  {card.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{card.description}</p>
              </div>
              <Button
                onClick={() => navigate(card.route)}
                size="sm"
                className="w-full uppercase tracking-wide text-xs"
              >
                {card.buttonLabel}
              </Button>
            </div>
          ))}
        </div>
      </main>

      <FooterIMSS />
    </div>
  );
}
