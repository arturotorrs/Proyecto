import { forwardRef, type SelectHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInsumosApi } from "../../api/insumos.api";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  showStock?: boolean;
}

const InsumoSelect = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, showStock = false, className = "", ...props }, ref) => {
    const { data: insumos = [], isLoading } = useQuery({
      queryKey: ["insumos"],
      queryFn: () => getInsumosApi(),
    });

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <select
          ref={ref}
          disabled={isLoading || props.disabled}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent
            ${error ? "border-red-400 bg-red-50" : "border-gray-300"}
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          <option value="">- Seleccionar insumo -</option>
          {insumos.map((insumo) => (
            <option key={insumo.id} value={insumo.id}>
              {insumo.nombre}
              {showStock ? ` (Stock: ${insumo.cantidad})` : ""}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

InsumoSelect.displayName = "InsumoSelect";
export default InsumoSelect;
