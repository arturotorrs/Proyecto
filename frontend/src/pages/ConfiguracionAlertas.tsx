import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getInsumosApi } from "../api/insumos.api";
import { getAlertasApi, saveAlertasBulkApi } from "../api/alertas.api";
import { useToastStore } from "../store/toastStore";
import type { AlertaConfig } from "../types";
import Button from "../components/ui/Button";
import Navbar from "../components/layout/Navbar";
import FooterIMSS from "../components/layout/FooterIMSS";
import ToastContainer from "../components/ui/Toast";

interface RowState {
  insumo_id: number;
  insumo_nombre: string;
  activo: boolean; // true = el usuario quiere recibir alerta de este insumo
  limite_stock: number;
  frecuencia_valor: number;
  frecuencia_unidad: "minutos" | "horas" | "dias";
  dias_caducidad: number;
}

const FRECUENCIAS = [
  { label: "Cada 1 Día", valor: 1, unidad: "dias" as const },
  { label: "Cada 3 Días", valor: 3, unidad: "dias" as const },
  { label: "Cada 7 Días", valor: 7, unidad: "dias" as const },
  { label: "Cada 15 Días", valor: 15, unidad: "dias" as const },
  { label: "Cada 30 Días", valor: 30, unidad: "dias" as const },
];

function calcProximaAlerta(
  valor: number,
  unidad: "minutos" | "horas" | "dias",
): string {
  const ms = { minutos: 60_000, horas: 3_600_000, dias: 86_400_000 }[unidad];
  const fecha = new Date(Date.now() + valor * ms);
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ConfiguracionAlertas() {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<RowState[]>([]);
  const [frecuenciaGlobal, setFrecuenciaGlobal] = useState<{
    valor: number;
    unidad: "minutos" | "horas" | "dias";
  }>({ valor: 1, unidad: "dias" });

  const userHasEdited = useRef(false);

  const { data: insumos = [], isSuccess: insumosReady } = useQuery({
    queryKey: ["insumos"],
    queryFn: () => getInsumosApi(),
  });

  const { data: alertas = [], isSuccess: alertasReady } = useQuery({
    queryKey: ["alertas"],
    queryFn: getAlertasApi,
  });

  useEffect(() => {
    if (!insumosReady || !alertasReady) return;
    if (userHasEdited.current) return;

    const alertaMap = new Map<number, AlertaConfig>(
      alertas.map((a) => [a.insumo_id, a]),
    );

    setRows(
      insumos.map((insumo) => {
        const cfg = alertaMap.get(insumo.id);
        return {
          insumo_id: insumo.id,
          insumo_nombre: insumo.nombre,
          // activo solo si existe una configuración guardada en BD para este usuario
          activo: !!cfg,
          limite_stock: cfg?.limite_stock ?? 10,
          frecuencia_valor: cfg?.frecuencia_valor ?? 1,
          frecuencia_unidad: cfg?.frecuencia_unidad ?? "dias",
          dias_caducidad: cfg?.dias_caducidad ?? 30,
        };
      }),
    );

    if (alertas.length > 0) {
      setFrecuenciaGlobal({
        valor: alertas[0].frecuencia_valor,
        unidad: alertas[0].frecuencia_unidad,
      });
    }
  }, [insumosReady, alertasReady, insumos, alertas]);

  const mutation = useMutation({
    mutationFn: () => {
      const activar = rows
        .filter((r) => r.activo)
        .map((r) => ({
          insumo_id: r.insumo_id,
          limite_stock: r.limite_stock,
          frecuencia_valor: frecuenciaGlobal.valor,
          frecuencia_unidad: frecuenciaGlobal.unidad,
          dias_caducidad: r.dias_caducidad,
        }));
      const desactivar = rows.filter((r) => !r.activo).map((r) => r.insumo_id);
      return saveAlertasBulkApi(activar, desactivar);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
      addToast({
        type: "success",
        title: "Alertas guardadas",
        message: "La configuración fue actualizada correctamente",
      });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      addToast({
        type: "error",
        title: "Error",
        message: msg || "No se pudo guardar la configuración",
      });
    },
  });

  function toggleActivo(insumo_id: number) {
    userHasEdited.current = true;
    setRows((prev) =>
      prev.map((r) =>
        r.insumo_id === insumo_id ? { ...r, activo: !r.activo } : r,
      ),
    );
  }

  function updateRow(
    insumo_id: number,
    key: keyof RowState,
    value: number | string,
  ) {
    userHasEdited.current = true;
    setRows((prev) =>
      prev.map((r) => (r.insumo_id === insumo_id ? { ...r, [key]: value } : r)),
    );
  }

  const selectedFrecuencia = FRECUENCIAS.find(
    (f) =>
      f.valor === frecuenciaGlobal.valor &&
      f.unidad === frecuenciaGlobal.unidad,
  );

  const activosCount = rows.filter((r) => r.activo).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <ToastContainer />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="relative flex items-center justify-center mb-2">
            <Link
              to="/menu"
              className="absolute left-0 p-1.5 text-[#006455] hover:bg-green-50 rounded-lg transition-colors"
              title="Volver al Menú Principal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[#006455] uppercase tracking-wide">
              Alertas
            </h1>
          </div>
          <div className="border-b-2 border-[#006455] mb-6" />

          <p className="text-xs text-gray-500 text-center mb-6">
            Activa solo los insumos que quieres monitorear.
          </p>

          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Cargando insumos...
            </p>
          ) : (
            <>
              {/* Tabla de insumos */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Activo
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Insumo
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Alerta de unidades
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Alerta de caducidad (días)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row) => (
                      <tr
                        key={row.insumo_id}
                        className={`transition-colors ${row.activo ? "bg-white" : "bg-gray-50 opacity-60"}`}
                      >
                        {/* Toggle */}
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => toggleActivo(row.insumo_id)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#006455] focus:ring-offset-1 ${
                              row.activo ? "bg-[#006455]" : "bg-gray-200"
                            }`}
                            role="switch"
                            aria-checked={row.activo}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                row.activo ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>

                        {/* Nombre */}
                        <td className="px-3 py-3 font-medium text-gray-800">
                          {row.insumo_nombre}
                        </td>

                        {/* Límite stock */}
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min={1}
                            disabled={!row.activo}
                            value={row.limite_stock}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1)
                                updateRow(row.insumo_id, "limite_stock", val);
                            }}
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* Días caducidad */}
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min={0}
                            disabled={!row.activo}
                            value={row.dias_caducidad}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 0)
                                updateRow(row.insumo_id, "dias_caducidad", val);
                            }}
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Frecuencia global */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                  Recordatorio de Actualización de Inventario
                </h3>
                <div className="flex flex-col gap-2">
                  <select
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006455]"
                    value={`${frecuenciaGlobal.valor}-${frecuenciaGlobal.unidad}`}
                    onChange={(e) => {
                      const [v, u] = e.target.value.split("-");
                      if (v && u) {
                        userHasEdited.current = true;
                        setFrecuenciaGlobal({
                          valor: Number(v),
                          unidad: u as "minutos" | "horas" | "dias",
                        });
                      }
                    }}
                  >
                    <option value="">- seleccionar -</option>
                    {FRECUENCIAS.map((f) => (
                      <option key={f.label} value={`${f.valor}-${f.unidad}`}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  {selectedFrecuencia && (
                    <p className="text-xs text-gray-500">
                      Próxima alerta:{" "}
                      {calcProximaAlerta(
                        frecuenciaGlobal.valor,
                        frecuenciaGlobal.unidad,
                      )}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => mutation.mutate()}
                loading={mutation.isPending}
                size="lg"
                className="w-full uppercase tracking-wider"
              >
                Guardar Configuración
                {activosCount > 0 && (
                  <span className="ml-2 text-xs font-normal opacity-80">
                    ({activosCount} insumo{activosCount !== 1 ? "s" : ""} activo
                    {activosCount !== 1 ? "s" : ""})
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      </main>

      <FooterIMSS />
    </div>
  );
}
