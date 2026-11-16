import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}) => {
  const titleId = useId();
  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Move initial focus inside the modal if focus is outside
    const cardEl = modalCardRef.current;
    if (cardEl && !cardEl.contains(document.activeElement)) {
      const focusables = cardEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables[0]) {
        focusables[0].focus();
      } else {
        cardEl.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab" && modalCardRef.current) {
        const focusableElements = Array.from(
          modalCardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (!firstElement || !lastElement) {
          event.preventDefault();
          return;
        }

        if (event.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !modalCardRef.current.contains(document.activeElement)
          ) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !modalCardRef.current.contains(document.activeElement)
          ) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === "function"
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

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

  const modalNode = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-space-2 sm:p-space-4 bg-black/60 backdrop-blur-sm transition-opacity duration-fast overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalCardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        data-impeccable-ignore="hard-offset-shadow"
        className={clsx(
          "bg-color-7 text-color-1 w-full rounded-3xl border-2 border-color-1 shadow-sm overflow-hidden flex flex-col max-h-[90vh] transition-transform duration-fast outline-none",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-space-2 px-space-3 py-space-3 sm:px-space-5 sm:py-space-4 border-b-2 border-color-1 bg-color-6">
          <h3 id={titleId} className="font-bold text-text-base sm:text-text-lg line-clamp-2 min-w-0 leading-snug">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="w-11 h-11 inline-flex items-center justify-center rounded-full text-color-1 hover:bg-color-7 hover:border-2 hover:border-color-1 transition-all duration-fast focus-visible:ring-2 focus-visible:ring-color-5 cursor-pointer shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-space-3 sm:p-space-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : modalNode;
};
