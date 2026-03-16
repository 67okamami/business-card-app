"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shareCard } from "@/lib/storage";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  cardId: string;
}

export function ShareDialog({ open, onClose, userId, cardId }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await shareCard(userId, cardId, email.trim());
      if (result.success) {
        setMessage({ text: "共有しました", isError: false });
        setEmail("");
      } else {
        setMessage({ text: result.error ?? "共有に失敗しました", isError: true });
      }
    } catch {
      setMessage({ text: "共有に失敗しました", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <h3 className="text-lg font-bold mb-2">名刺を共有</h3>
      <p className="text-sm text-muted-foreground mb-4">
        共有相手のメールアドレスを入力してください。
      </p>
      <form onSubmit={handleShare} className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@mail.com"
          required
        />
        {message && (
          <p className={`text-sm ${message.isError ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
            {message.text}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            閉じる
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "共有中..." : "共有する"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
