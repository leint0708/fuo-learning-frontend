import React from "react";
import clsx from "clsx";

export type BadgeVariant = "default" | "primary" | "success" | "danger" | "warning" | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  children,
  className,
}) => {
  const variantStyles = {
    default: "bg-color-6 text-color-1 border-color-1",
    primary: "bg-color-2 text-color-7 border-color-2",
    success: "bg-color-3 text-color-7 border-color-3",
    danger: "bg-color-4 text-color-7 border-color-4",
    warning: "bg-color-5 text-color-1 border-color-1",
    neutral: "bg-color-7 text-color-1 border-color-1",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-space-2 py-0.5 rounded-full text-text-xs font-bold border shadow-xs tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
