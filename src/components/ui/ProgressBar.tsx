import React from "react";
import clsx from "clsx";

export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
  showPercentage = true,
  className,
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className={clsx("w-full flex flex-col gap-space-1", className)}>
      <div className="flex justify-between items-center text-text-xs font-bold text-color-1">
        <span>{label || "Tiến độ làm bài"}</span>
        {showPercentage && <span>{percentage}% ({current}/{total})</span>}
      </div>
      <div className="w-full h-4 bg-color-7 border-2 border-color-1 rounded-full overflow-hidden p-0.5 shadow-xs">
        <div
          className="h-full bg-color-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
};
