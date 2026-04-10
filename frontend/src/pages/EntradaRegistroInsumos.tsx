import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createMovimientoApi } from "../api/movimientos.api";
import { createInsumoApi } from "../api/insumos.api";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import InsumoSelect from "../components/ui/InsumoSelect";
import Navbar from "../components/layout/Navbar";
import FooterIMSS from "../components/layout/FooterIMSS";
import ToastContainer from "../components/ui/Toast";

// ── Schemas ────────────────────────────────────────────────────────────────
const entradaSchema = z.object({
  insumo_id: z.string().min(1, "Selecciona un insumo"),
  cantidad: z.coerce
    .number()
    .int("Debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es requerida"),
  nota: z.string().optional(),
  fecha_caducidad: z.string().optional(),
});

const today = new Date().toISOString().split("T")[0];

const registroSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  cantidad: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
  ubicacion: z.string().min(1, "La ubicación es requerida"),
  fecha_registro: z.string().min(1, "La fecha de registro es requerida"),
  codigo: z.string().min(1, "El código es requerido"),
});

type EntradaData = z.infer<typeof entradaSchema>;
type RegistroData = z.infer<typeof registroSchema>;

function nowLocal() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

// ── Formulario Entrada ─────────────────────────────────────────────────────
function FormEntrada() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EntradaData>({
    resolver: zodResolver(entradaSchema) as Resolver<EntradaData>,
    defaultValues: { fecha: nowLocal() },
  });

  const fechaValue = watch("fecha") || nowLocal();
  const [fechaParte, horaParte] = fechaValue.split("T") as [string, string];

  const mutation = useMutation({
    mutationFn: (data: EntradaData) =>
      createMovimientoApi({
        tipo: "entrada",
        insumo_id: Number(data.insumo_id),
        cantidad: data.cantidad,
        nota: data.nota,
        fecha: data.fecha,
        fecha_caducidad: data.fecha_caducidad || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      addToast({
        type: "success",
        title: "Entrada registrada",
        message: "El stock ha sido actualizado correctamente",
      });
      reset({ fecha: nowLocal() });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      addToast({
        type: "error",
        title: "Error",
        message: msg || "No se pudo registrar la entrada",
      });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="flex flex-col gap-4"
    >
      <InsumoSelect
        label="Insumo"
        error={errors.insumo_id?.message}
        {...register("insumo_id")}
      />

      <Input
        label="Cantidad"
        type="number"
        min={1}
        placeholder="Ej: 50"
        error={errors.cantidad?.message}
        {...register("cantidad")}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Fecha y hora</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={fechaParte}
            onChange={(e) => setValue("fecha", e.target.value + "T" + (horaParte || "00:00"), { shouldValidate: true })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent"
          />
          <input
            type="time"
            value={horaParte || ""}
            onChange={(e) => setValue("fecha", (fechaParte || "") + "T" + e.target.value, { shouldValidate: true })}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent"
          />
        </div>
        {errors.fecha && <p className="text-xs text-red-600">{errors.fecha.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Nota (opcional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent resize-none"
          rows={3}
          placeholder="Observaciones sobre la entrada..."
          {...register("nota")}
        />
      </div>

      <Input
        label="Fecha de Caducidad (opcional)"
        type="date"
        min={today}
        error={errors.fecha_caducidad?.message}
        {...register("fecha_caducidad")}
      />

      <Button
        type="submit"
        loading={mutation.isPending}
        size="lg"
        className="w-full uppercase tracking-wider mt-2"
      >
        Registrar Entrada
      </Button>
    </form>
  );
}

// ── Formulario Registro ────────────────────────────────────────────────────
function FormRegistro() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistroData>({
    resolver: zodResolver(registroSchema) as Resolver<RegistroData>,
    defaultValues: { fecha_registro: today, cantidad: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: RegistroData) =>
      createInsumoApi(data as Parameters<typeof createInsumoApi>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insumos"] });
      addToast({
        type: "success",
        title: "Insumo registrado",
        message: "El insumo fue agregado al inventario",
      });
      reset({ fecha_registro: today, cantidad: 0 });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      addToast({
        type: "error",
        title: "Error",
        message: msg || "No se pudo guardar el insumo",
      });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre *"
          placeholder="Ej: Vendajes Elásticos"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Input
          label="Código *"
          placeholder="Ej: VE-001"
          error={errors.codigo?.message}
          {...register("codigo")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent resize-none"
          rows={2}
          placeholder="Descripción del insumo (opcional)"
          {...register("descripcion")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Cantidad *"
          type="number"
          min={0}
          error={errors.cantidad?.message}
          {...register("cantidad")}
        />
        <Input
          label="Ubicación *"
          placeholder="Ej: Almacén A - Estante 1"
          error={errors.ubicacion?.message}
          {...register("ubicacion")}
        />
      </div>

      <Input
        label="Fecha de Registro *"
        type="date"
        error={errors.fecha_registro?.message}
        {...register("fecha_registro")}
      />

      <Button
        type="submit"
        loading={mutation.isPending}
        size="lg"
        className="w-full uppercase tracking-wider mt-2"
      >
        Guardar Registro
      </Button>
    </form>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
type Tab = "entrada" | "registro";

export default function EntradaRegistroInsumos() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("entrada");

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
            <h1 className="text-xl font-bold text-[#006455] uppercase tracking-wide">
              Entrada de Insumos
            </h1>
          </div>

          <div className="flex border-b-2 border-[#006455] mb-6">
            <button
              onClick={() => setTab("entrada")}
              className={`flex-1 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                tab === "entrada"
                  ? "border-b-2 border-[#006455] text-[#006455]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Captura de entradas
            </button>
            {isAdmin && (
              <button
                onClick={() => setTab("registro")}
                className={`flex-1 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  tab === "registro"
                    ? "border-b-2 border-[#006455] text-[#006455]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Registrar Nuevo Insumo
              </button>
            )}
          </div>

          {tab === "entrada" && <FormEntrada />}
          {tab === "registro" && isAdmin && <FormRegistro />}
        </div>
      </main>

      <FooterIMSS />
    </div>
  );
}
