"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BusinessCardForm } from "@/components/business-card-form";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import { getCardById } from "@/lib/storage";
import { BusinessCardFormData } from "@/types/business-card";
import { ArrowLeft, Loader2 } from "lucide-react";

function EditCardContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<BusinessCardFormData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    getCardById(user.uid, id).then((card) => {
      if (!card) {
        router.replace("/");
        return;
      }
      const { id: _, createdAt: __, updatedAt: ___, ...formData } = card;
      setInitialData(formData);
      setImageUrl(card.imageUrl);
    });
  }, [id, router, user]);

  if (!initialData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/cards/${id}`}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">名刺を編集</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[700px] p-4">
        <BusinessCardForm
          initialData={initialData}
          editId={id}
          imageUrl={imageUrl || undefined}
        />
      </main>
    </div>
  );
}

export default function EditCardPage() {
  return (
    <AuthGuard>
      <EditCardContent />
    </AuthGuard>
  );
}
