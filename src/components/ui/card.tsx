import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", interactive = false, onClick }: CardProps) {
  const baseStyles = "rounded-xl p-4";
  const glassStyles = "glass-card";
  const interactiveStyles = interactive
    ? "glass-card-interactive cursor-pointer"
    : "";
  const clickableStyles = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`${baseStyles} ${glassStyles} ${interactiveStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`font-display font-semibold text-ink-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-ink-secondary mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 pt-4 border-t border-white/5 flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}
