"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CardDetail } from "@/components/card-detail";
import { ShareDialog } from "@/components/share-dialog";
import { toast } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import { getCardById, deleteCard, findDuplicateOwners } from "@/lib/storage";
import { BusinessCard } from "@/types/business-card";
import { ArrowLeft, Pencil, Trash2, Loader2, Share2, Users } from "lucide-react";

function CardDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  const ownerParam = searchParams.get("owner"); // set when viewing a shared card
  const isShared = !!ownerParam;
  const fetchOwnerId = ownerParam ?? user?.uid ?? "";

  const [card, setCard] = useState<BusinessCard | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ ownerEmail: string; ownerUid: string }>>([]);

  useEffect(() => {
    if (!user || !fetchOwnerId) return;
    getCardById(fetchOwnerId, id).then((found) => {
      if (!found) {
        router.replace("/");
        return;
      }
      setCard(found);
      // Find other users who have the same card (only for own cards with email)
      if (!isShared && found.email) {
        findDuplicateOwners(user.uid, found.email).then(setDuplicates);
      }
    });
  }, [id, router, user, fetchOwnerId, isShared]);

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteCard(user.uid, id);
      toast("名刺を削除しました");
      router.push("/");
    } catch {
      toast("削除に失敗しました");
      setDeleteOpen(false);
    }
  };

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName = `${card.lastName} ${card.firstName}`.trim() || "（名前なし）";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">一覧に戻る</span>
          </Link>
          <div className="flex gap-2">
            {isShared ? (
              <span className="text-xs text-muted-foreground self-center border border-border rounded px-2 py-1">
                共有された名刺
              </span>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="mr-1 h-3.5 w-3.5" />
                  共有
                </Button>
                <Link href={`/cards/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    編集
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  削除
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] p-4 space-y-4">
        <CardDetail card={card} />

        {duplicates.length > 0 && (
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              この名刺を持っているユーザー
            </div>
            <ul className="space-y-1">
              {duplicates.map((d) => (
                <li key={d.ownerUid} className="text-sm text-foreground">
                  {d.ownerEmail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {!isShared && (
        <>
          <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
            <h3 className="text-lg font-bold mb-2">名刺を削除</h3>
            <p className="text-sm text-muted-foreground mb-4">
              「{displayName}」の名刺を削除しますか？
              この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                削除する
              </Button>
            </div>
          </Dialog>

          {user && (
            <ShareDialog
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              userId={user.uid}
              cardId={id}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function CardDetailPage() {
  return (
    <AuthGuard>
      <CardDetailContent />
    </AuthGuard>
  );
}
