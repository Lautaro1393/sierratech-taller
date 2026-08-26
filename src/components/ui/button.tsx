import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-accent text-surface-base font-semibold 
    hover:bg-accent-dim active:scale-[0.98] 
    shadow-[0_0_12px_rgba(46,220,27,0.4)]
    hover:shadow-[0_0_20px_rgba(46,220,27,0.6)]
  `,
  secondary: `
    bg-surface-elevated text-ink-primary border border-white/10
    hover:bg-surface-hover hover:border-white/20 active:scale-[0.98]
  `,
  ghost: `
    bg-transparent text-ink-secondary
    hover:bg-surface-hover hover:text-ink-primary
  `,
  danger: `
    bg-status-red/20 text-status-red border border-status-red/30
    hover:bg-status-red/30 active:scale-[0.98]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "", 
    variant = "primary", 
    size = "md", 
    loading = false, 
    disabled,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center
          rounded-md font-medium
          transition-all duration-200 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin h-4 w-4" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
