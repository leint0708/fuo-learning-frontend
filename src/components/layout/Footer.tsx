import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t-2 border-color-1 bg-color-7 py-space-4">
      <div className="max-w-7xl mx-auto px-space-4 sm:px-space-5 flex flex-col sm:flex-row items-center justify-between gap-space-2 text-text-xs font-medium text-color-1">
        <div>
          <span>© 2026 FUO Learning. Hệ thống luyện thi trắc nghiệm học thuật.</span>
        </div>
        <div className="flex items-center gap-space-4">
          <span className="text-color-2 font-bold">Coding Inspiration</span>
          <span>Tuân thủ thiết kế DESIGN.md</span>
        </div>
      </div>
    </footer>
  );
};
