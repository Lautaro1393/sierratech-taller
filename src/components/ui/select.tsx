import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label 
            htmlFor={selectId}
            className="text-sm font-medium text-ink-secondary"
          >
            {label}
            {props.required && <span className="text-status-red ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-3 py-2 rounded-lg
            bg-surface-base border border-white/10
            text-ink-primary
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
            ${error ? "border-status-red focus:border-status-red focus:ring-status-red/30" : ""}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-status-red">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-ink-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
