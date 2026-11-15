import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/components/ui/Modal";

describe("Modal Primitive Backdrop", () => {
  it("renders with dark blur background classes when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.className).toContain("bg-black/60");
    expect(dialog.className).toContain("backdrop-blur-sm");
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll when open and restores on unmount", () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("calls onClose when clicking outside on backdrop", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Inner Content</div>
      </Modal>
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the dialog card", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <button>Click Inside</button>
      </Modal>
    );

    fireEvent.click(screen.getByText("Click Inside"));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("links dialog aria-labelledby to the modal heading and traps Tab focus", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Keyboard Trap Modal">
        <button>First Action</button>
        <button>Last Action</button>
      </Modal>
    );

    const dialog = screen.getByRole("dialog", { name: "Keyboard Trap Modal" });
    expect(dialog).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /đóng cửa sổ/i });
    const lastActionBtn = screen.getByRole("button", { name: "Last Action" });

    // Initial focus goes to the first focusable element inside the modal (Close button)
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from first element wraps to last element
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastActionBtn);

    // Tab from last element wraps back to first element
    fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);
  });
});
