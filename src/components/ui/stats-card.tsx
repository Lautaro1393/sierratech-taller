import Link from "next/link";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  href?: string;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "border-white/5",
  success: "border-status-green/30 bg-status-green/5",
  warning: "border-status-yellow/30 bg-status-yellow/5",
  danger: "border-status-red/30 bg-status-red/5",
};

export function StatsCard({ title, value, icon, href, trend, variant = "default" }: StatsCardProps) {
  const inner = (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm text-ink-secondary">{title}</p>
        <p className="text-3xl font-display font-bold text-ink-primary">{value}</p>
        {trend && (
          <p className={`text-xs ${trend.value >= 0 ? "text-status-green" : "text-status-red"}`}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </p>
        )}
      </div>
      <div className="p-3 rounded-xl bg-surface-hover">
        {icon}
      </div>
    </div>
  );

  const classes = `block glass-card p-5 ${variantStyles[variant]} transition-colors ${
    href ? "hover:border-white/20 hover:bg-surface-hover/40" : ""
  }`;

  return href ? (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  );
}