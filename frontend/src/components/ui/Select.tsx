import { forwardRef, type SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, className = '', children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 border rounded-lg text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-[#006455] focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);

Select.displayName = 'Select';
export default Select;
