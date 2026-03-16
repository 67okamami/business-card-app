"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/storage";

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

export function AccountDialog({ open, onClose, userId, userEmail }: AccountDialogProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setConfirming(false);
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteAccount(userId, userEmail);
      router.replace("/auth/login");
    } catch (err: unknown) {
      // Firebase requires recent login for account deletion
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "auth/requires-recent-login"
      ) {
        setError("セキュリティのため、一度ログアウトして再ログイン後に削除してください");
      } else {
        setError("削除に失敗しました。もう一度お試しください");
      }
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      {!confirming ? (
        <>
          <h3 className="text-lg font-bold mb-1">アカウント設定</h3>
          <p className="text-sm text-muted-foreground mb-4 break-all">{userEmail}</p>
          <div className="border-t border-border pt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirming(true)}
            >
              アカウントを削除する
            </Button>
          </div>
          <div className="flex justify-end mt-3">
            <Button variant="outline" onClick={handleClose}>
              閉じる
            </Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold mb-2">アカウントを削除しますか？</h3>
          <p className="text-sm text-muted-foreground mb-4">
            登録中の名刺データがすべて削除されます。この操作は取り消せません。
          </p>
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setConfirming(false); setError(""); }} disabled={loading}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "削除中..." : "削除する"}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
