"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth";
import { CreditCard } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError("メールの送信に失敗しました。メールアドレスをご確認ください");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">名刺管理</h1>
        </div>

        <h2 className="text-lg font-semibold mb-2 text-center">パスワードをリセット</h2>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              パスワードリセット用のメールを送信しました。
              メールをご確認ください。
            </p>
            <Link href="/auth/login" className="text-primary underline underline-offset-2 text-sm">
              ログインページに戻る
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              登録済みのメールアドレスを入力してください。
              パスワードリセット用のリンクを送信します。
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">メールアドレス</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "送信中..." : "リセットメールを送信"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link href="/auth/login" className="text-primary underline underline-offset-2">
                ログインページに戻る
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
