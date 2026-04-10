import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { createMovimientoApi } from "../api/movimientos.api";
import { getInsumosApi, deleteInsumoApi } from "../api/insumos.api";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Navbar from "../components/layout/Navbar";
import FooterIMSS from "../components/layout/FooterIMSS";
import ToastContainer from "../components/ui/Toast";

const schema = z.object({
  insumo_id: z.string().min(1, "Selecciona un insumo"),
  cantidad: z.coerce
    .number()
    .int("Debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es requerida"),
  nota: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Tab = "salida" | "eliminar";

function nowLocal() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

// ── Formulario Salida ──────────────────────────────────────────────────────
function FormSalida() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [selectedId, setSelectedId] = useState("");

  const { data: insumos = [] } = useQuery({
    queryKey: ["insumos"],
    queryFn: () => getInsumosApi(),
  });

  const selectedInsumo = insumos.find((i) => String(i.id) === selectedId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { fecha: nowLocal() },
  });

  const fechaValue = watch("fecha") || nowLocal();
  const [fechaParte, horaParte] = fechaValue.split("T") as [string, string];

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createMovimientoApi({
        tipo: "salida",
        insumo_id: Number(data.insumo_id),
        cantidad: data.cantidad,
        nota: data.nota,
        fecha: data.fecha,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      addToast({
        type: "success",
        title: "Salida registrada",
        message: "El stock ha sido actualizado correctamente",
      });
      reset({ fecha: nowLocal() });
      setSelectedId("");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      if (msg?.includes("Stock insuficiente")) {
        setError("cantidad", { message: msg });
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: msg || "No se pudo registrar la salida",
        });
      }
    },
  });

  function onSubmit(data: FormData) {
    if (selectedInsumo && data.cantidad > selectedInsumo.cantidad) {
      setError("cantidad", {
        message: `Stock insuficiente. Disponible: ${selectedInsumo.cantidad}`,
      });
      return;
    }
    mutation.mutate(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Insumo</label>
        <select
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent ${errors.insumo_id ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          {...register("insumo_id", {
            onChange: (e) => setSelectedId(e.target.value),
          })}
        >
          <option value="">- Seleccionar insumo -</option>
          {insumos.map((insumo) => (
            <option key={insumo.id} value={insumo.id}>
              {insumo.nombre} (Stock: {insumo.cantidad})
            </option>
          ))}
        </select>
        {errors.insumo_id && (
          <p className="text-xs text-red-600">{errors.insumo_id.message}</p>
        )}
      </div>

      {selectedInsumo && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          Stock disponible: <strong>{selectedInsumo.cantidad}</strong> unidades
        </div>
      )}

      <Input
        label="Cantidad"
        type="number"
        min={1}
        max={selectedInsumo?.cantidad}
        placeholder="Ej: 10"
        error={errors.cantidad?.message}
        {...register("cantidad")}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Motivo (opcional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
          rows={3}
          placeholder="Motivo de la salida (ej: uso en quirófano)"
          {...register("nota")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Fecha y hora
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={fechaParte}
            onChange={(e) =>
              setValue("fecha", e.target.value + "T" + (horaParte || "00:00"), {
                shouldValidate: true,
              })
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
          <input
            type="time"
            value={horaParte || ""}
            onChange={(e) =>
              setValue("fecha", (fechaParte || "") + "T" + e.target.value, {
                shouldValidate: true,
              })
            }
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
        </div>
        {errors.fecha && (
          <p className="text-xs text-red-600">{errors.fecha.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="danger"
        loading={mutation.isPending}
        size="lg"
        className="w-full uppercase tracking-wider mt-2"
      >
        Registrar Salida
      </Button>
    </form>
  );
}

// ── Sección Eliminar Insumo (solo admin) ───────────────────────────────────
function SeccionEliminar() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [selectedId, setSelectedId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: insumos = [] } = useQuery({
    queryKey: ["insumos"],
    queryFn: () => getInsumosApi(),
  });

  const selectedInsumo = insumos.find((i) => String(i.id) === selectedId);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteInsumoApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos"] });
      addToast({
        type: "success",
        title: "Insumo eliminado",
        message: "El insumo fue eliminado del sistema",
      });
      setSelectedId("");
      setConfirmOpen(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      addToast({
        type: "error",
        title: "Error al eliminar",
        message: msg || "No se pudo eliminar el insumo",
      });
      setConfirmOpen(false);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <strong>Advertencia:</strong> Esta acción elimina permanentemente el
        insumo y no se puede deshacer.
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Seleccionar insumo a eliminar
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">- Seleccionar insumo -</option>
          {insumos.map((insumo) => (
            <option key={insumo.id} value={insumo.id}>
              {insumo.nombre} — {insumo.codigo}
            </option>
          ))}
        </select>
      </div>

      {selectedInsumo && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 flex flex-col gap-1">
          <p>
            <span className="font-medium">Nombre:</span> {selectedInsumo.nombre}
          </p>
          <p>
            <span className="font-medium">Código:</span> {selectedInsumo.codigo}
          </p>
          <p>
            <span className="font-medium">Stock actual:</span>{" "}
            {selectedInsumo.cantidad} unidades
          </p>
          <p>
            <span className="font-medium">Ubicación:</span>{" "}
            {selectedInsumo.ubicacion || "—"}
          </p>
        </div>
      )}

      <Button
        variant="danger"
        size="lg"
        className="w-full uppercase tracking-wider mt-2"
        disabled={!selectedInsumo}
        onClick={() => setConfirmOpen(true)}
      >
        Eliminar Insumo
      </Button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-gray-700 mb-1">¿Eliminar el siguiente insumo?</p>
          <p className="font-semibold text-gray-900 mb-6">
            {selectedInsumo?.nombre} ({selectedInsumo?.codigo})
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() =>
                selectedInsumo && deleteMutation.mutate(selectedInsumo.id)
              }
            >
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function SalidaInsumos() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("salida");

  const isAdmin = user?.rol === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <ToastContainer />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="relative flex items-center justify-center mb-6">
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
            <h1 className="text-xl font-bold text-red-700 uppercase tracking-wide">
              Salida de Insumos
            </h1>
          </div>

          <div className="flex border-b-2 border-red-600 mb-6">
            <button
              onClick={() => setTab("salida")}
              className={`flex-1 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                tab === "salida"
                  ? "border-b-2 border-red-600 text-red-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Captura de Salida
            </button>
            {isAdmin && (
              <button
                onClick={() => setTab("eliminar")}
                className={`flex-1 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  tab === "eliminar"
                    ? "border-b-2 border-red-500 text-red-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Eliminar Insumo
              </button>
            )}
          </div>

          {tab === "salida" && <FormSalida />}
          {tab === "eliminar" && isAdmin && <SeccionEliminar />}
        </div>
      </main>

      <FooterIMSS />
    </div>
  );
}
