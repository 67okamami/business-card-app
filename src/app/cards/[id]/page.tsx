"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CardDetail } from "@/components/card-detail";
import { toast } from "@/components/ui/toast";
import { getCardById, deleteCard } from "@/lib/storage";
import { BusinessCard } from "@/types/business-card";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    getCardById(id).then((found) => {
      if (!found) {
        router.replace("/");
        return;
      }
      setCard(found);
    });
  }, [id, router]);

  const handleDelete = async () => {
    await deleteCard(id);
    toast("名刺を削除しました");
    router.push("/");
  };

  if (!card) return null;

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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] p-4">
        <CardDetail card={card} />
      </main>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <h3 className="text-lg font-bold mb-2">名刺を削除</h3>
        <p className="text-sm text-muted-foreground mb-4">
          「{card.lastName} {card.firstName}」の名刺を削除しますか？
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
    </div>
  );
}
