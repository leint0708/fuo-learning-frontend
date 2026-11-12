import React from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "accent" | "danger" | "ghost" | "choice";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isError?: boolean;
  selected?: boolean;
  correct?: boolean | null; // For choice buttons in instant feedback mode
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  isError = false,
  selected = false,
  correct = null,
  disabled = false,
  className,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-bold tracking-wide rounded-full border-2 transition-all duration-fast select-none cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:translate-y-0.5";

  const sizeStyles = {
    sm: "px-space-3 py-space-1 text-text-xs",
    md: "px-space-4 py-space-2 text-text-sm",
    lg: "px-space-5 py-space-3 text-text-base",
  };

  let variantStyles = "";

  if (variant === "choice") {
    // Question Choice button styles
    if (correct === true) {
      variantStyles = "bg-color-3 text-color-7 border-color-3 shadow-sm";
    } else if (correct === false) {
      variantStyles = "bg-color-4 text-color-7 border-color-4 shadow-sm";
    } else if (selected) {
      variantStyles = "bg-color-2 text-color-7 border-color-2 shadow-sm";
    } else {
      variantStyles =
        "bg-color-7 text-color-1 border-color-1 shadow-sm hover:bg-color-6 hover:border-color-2 active:bg-color-2 active:text-color-7";
    }
  } else {
    switch (variant) {
      case "primary":
        variantStyles =
          "bg-color-2 text-color-7 border-color-2 shadow-sm hover:bg-opacity-90 hover:border-opacity-90 active:bg-color-1 active:border-color-1";
        break;
      case "secondary":
        variantStyles =
          "bg-color-7 text-color-1 border-color-1 shadow-sm hover:bg-color-6 active:bg-color-6 active:border-color-2";
        break;
      case "accent":
        variantStyles =
          "bg-color-3 text-color-7 border-color-3 shadow-sm hover:bg-opacity-90 active:bg-color-1";
        break;
      case "danger":
        variantStyles =
          "bg-color-4 text-color-7 border-color-4 shadow-sm hover:bg-opacity-90 active:bg-color-1";
        break;
      case "ghost":
        variantStyles =
          "bg-transparent text-color-1 border-transparent hover:bg-color-6 hover:border-color-6 active:bg-color-6";
        break;
    }
  }

  const errorStyles = isError
    ? "border-color-4 text-color-4 ring-2 ring-color-4"
    : "";

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles,
        errorStyles,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-space-1">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
