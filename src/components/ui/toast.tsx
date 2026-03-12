"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";

interface ToastState {
  message: string;
  type: "success" | "error";
}

let showToastFn: ((message: string, type?: "success" | "error") => void) | null =
  null;

export function toast(message: string, type: "success" | "error" = "success") {
  showToastFn?.(message, type);
}

export function Toaster() {
  const [toastState, setToastState] = useState<ToastState | null>(null);

  const show = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToastState({ message, type });
    },
    []
  );

  useEffect(() => {
    showToastFn = show;
    return () => {
      showToastFn = null;
    };
  }, [show]);

  useEffect(() => {
    if (!toastState) return;
    const timer = setTimeout(() => setToastState(null), 3000);
    return () => clearTimeout(timer);
  }, [toastState]);

  if (!toastState) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2">
      <div
        className={cn(
          "rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg",
          toastState.type === "success" ? "bg-green-600" : "bg-destructive"
        )}
      >
        {toastState.message}
      </div>
    </div>
  );
}
