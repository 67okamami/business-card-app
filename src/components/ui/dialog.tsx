"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ open, onClose, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative z-50 w-full bg-background rounded-xl shadow-lg p-6",
          "max-w-[calc(100vw-2rem)] md:max-w-[400px]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
