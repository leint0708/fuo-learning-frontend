import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  padded?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  bordered = true,
  padded = true,
  interactive = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "bg-color-7 rounded-2xl transition-all duration-fast shadow-sm",
        bordered && "border-2 border-color-1",
        padded && "p-space-4",
        interactive &&
          "cursor-pointer hover:border-color-2 hover:-translate-y-1 hover:shadow-[rgb(0,0,0)_6px_6px_0px_0px] active:translate-y-0 active:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
