import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { loginApi } from "../api/auth.api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import FooterIMSS from "../components/layout/FooterIMSS";
import { useState } from "react";

const schema = z.object({
  email: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      const response = await loginApi(data.email, data.password);
      login(response);
      navigate("/menu");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setServerError(msg || "Error al iniciar sesión");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo IMSS */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#006455] mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#006455] uppercase tracking-wide">
            Inventario de Insumos
          </h1>
          <p className="text-sm text-gray-500 mt-1">IMSS — Traumatología</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
            Iniciar Sesión
          </h2>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Input
              label="Usuario (correo)"
              type="email"
              placeholder="correo@imss.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="w-full mt-2 uppercase tracking-wider"
            >
              Ingresar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-[#006455] hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>

      <FooterIMSS />
    </div>
  );
}
