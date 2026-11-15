import React from "react";
import { Keyboard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "practice" | "exam";
  hasVisualMedia?: boolean;
}

/**
 * Shared accessible keyboard shortcuts modal triggered via `?` or CockpitHeader button.
 * Only lists shortcuts active in the current session mode and media state.
 */
export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({
  isOpen,
  onClose,
  mode = "practice",
  hasVisualMedia = true,
}) => {
  const shortcutItems: Array<{ keys: string[]; description: string }> = [
    { keys: ["1 – 8", "A – H"], description: "Chọn đáp án tương ứng" },
    { keys: ["Ctrl+Enter", "Enter"], description: "Kiểm tra câu nhiều đáp án" },
    ...(mode === "practice"
      ? [{ keys: ["Space", "→"], description: "Tiếp tục sang thẻ kế tiếp" }]
      : [{ keys: ["←", "→"], description: "Chuyển câu trước / câu tiếp theo" }]),
    ...(hasVisualMedia
      ? [{ keys: ["+", "-", "0"], description: "Phóng to / Thu nhỏ / Kích thước gốc sơ đồ" }]
      : []),
    { keys: ["?"], description: "Mở hoặc đóng bảng phím tắt" },
    { keys: ["Esc"], description: "Đóng hộp thoại đang mở" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Phím tắt bàn phím" size="md">
      <div className="flex flex-col gap-space-4">
        <div className="flex items-center gap-space-2 text-text-xs font-bold text-color-1">
          <Keyboard className="w-4 h-4 text-color-2 shrink-0" aria-hidden="true" />
          <span>Dùng bàn phím để thao tác nhanh trong không gian học & thi</span>
        </div>

        <ul className="flex flex-col gap-space-2">
          {shortcutItems.map((item) => (
            <li
              key={item.description}
              className="p-space-3 rounded-2xl bg-color-6 border-2 border-color-1 flex flex-wrap items-center justify-between gap-space-2"
            >
              <span className="text-text-xs sm:text-text-sm font-bold text-color-1">
                {item.description}
              </span>
              <div className="flex flex-wrap items-center gap-space-1 shrink-0">
                {item.keys.map((keyLabel) => (
                  <kbd
                    key={keyLabel}
                    className="px-space-2 py-space-1 rounded-lg bg-color-7 text-color-1 border-2 border-color-1 text-text-xs font-bold tabular-nums shadow-2xs"
                  >
                    {keyLabel}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-space-2">
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="min-h-11 px-space-5"
          >
            Đã hiểu
          </Button>
        </div>
      </div>
    </Modal>
  );
};
