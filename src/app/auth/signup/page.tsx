"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreditCard } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }
    setLoading(true);
    try {
      const credential = await signUp(email, password);
      const uid = credential.user.uid;
      // Save user profile for sharing feature
      await setDoc(doc(db, "userIndex", email), { uid });
      await setDoc(doc(db, "users", uid), { email });
      router.replace("/");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "auth/email-already-in-use"
      ) {
        setError("このメールアドレスは既に使用されています");
      } else {
        setError("登録に失敗しました。もう一度お試しください");
      }
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

        <h2 className="text-lg font-semibold mb-4 text-center">新規登録</h2>

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
          <div>
            <label className="block text-sm font-medium mb-1">パスワード（6文字以上）</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">パスワード（確認）</label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登録中..." : "アカウント作成"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          既にアカウントをお持ちの方は{" "}
          <Link href="/auth/login" className="text-primary underline underline-offset-2">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
