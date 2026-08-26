import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-ink-secondary"
          >
            {label}
            {props.required && <span className="text-status-red ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-lg
            bg-surface-base border border-white/10
            text-ink-primary placeholder:text-ink-muted
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-status-red focus:border-status-red focus:ring-status-red/30" : ""}
            ${className}
          `}
          {...props}
        />
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

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label 
            htmlFor={textareaId}
            className="text-sm font-medium text-ink-secondary"
          >
            {label}
            {props.required && <span className="text-status-red ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-3 py-2 rounded-lg
            bg-surface-base border border-white/10
            text-ink-primary placeholder:text-ink-muted
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-all duration-200
            resize-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-status-red focus:border-status-red focus:ring-status-red/30" : ""}
            ${className}
          `}
          {...props}
        />
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

Textarea.displayName = "Textarea";
