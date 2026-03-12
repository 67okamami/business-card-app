"use client";

import { Dialog } from "@/components/ui/dialog";
import { PenLine, Camera, X } from "lucide-react";

interface RegistrationMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (method: "manual" | "ocr") => void;
}

export function RegistrationMethodDialog({
  open,
  onClose,
  onSelect,
}: RegistrationMethodDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">新規登録</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-3">
        <button
          onClick={() => onSelect("manual")}
          className="flex w-full items-start gap-4 rounded-xl border border-border p-4 text-left transition hover:bg-muted"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PenLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">手入力で作成</p>
            <p className="text-sm text-muted-foreground">
              フォームに直接入力して名刺を登録します
            </p>
          </div>
        </button>
        <button
          onClick={() => onSelect("ocr")}
          className="flex w-full items-start gap-4 rounded-xl border border-border p-4 text-left transition hover:bg-muted"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">写真から作成</p>
            <p className="text-sm text-muted-foreground">
              名刺を撮影またはアップロードしてOCRで自動入力します
            </p>
          </div>
        </button>
      </div>
    </Dialog>
  );
}
