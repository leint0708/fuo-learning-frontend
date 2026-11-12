import React, { useEffect } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-space-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-fast overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          "bg-color-7 text-color-1 w-full rounded-3xl border-2 border-color-1 shadow-sm overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-fast",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-space-5 py-space-4 border-b-2 border-color-1 bg-color-6">
          <h3 className="font-bold text-text-lg truncate">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1 rounded-full text-color-1 hover:bg-color-7 hover:border-2 hover:border-color-1 transition-all duration-fast focus-visible:ring-2 focus-visible:ring-color-5 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-space-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
