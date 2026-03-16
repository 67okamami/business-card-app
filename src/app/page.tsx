"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { BusinessCardList } from "@/components/business-card-list";
import { RegistrationMethodDialog } from "@/components/registration-method-dialog";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import { signOutUser } from "@/lib/auth";

import { getCards, searchCards, getSharedCards, SharedCard } from "@/lib/storage";
import { BusinessCard } from "@/types/business-card";
import { Plus, CreditCard, Loader2, LogOut } from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [sharedCards, setSharedCards] = useState<SharedCard[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const [results, shared] = await Promise.all([
        query.trim() ? searchCards(user.uid, query) : getCards(user.uid),
        query.trim() ? Promise.resolve([]) : getSharedCards(user.uid),
      ]);
      setCards(results);
      setSharedCards(shared);
    } catch {
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [query, user]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleSelect = (method: "manual" | "ocr") => {
    setDialogOpen(false);
    router.push(`/cards/new?method=${method}`);
  };

  const handleSignOut = async () => {
    await signOutUser();
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">名刺管理</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.email && (
              <span className="hidden md:inline text-xs text-muted-foreground border border-border rounded px-2 py-1 max-w-[200px] truncate">
                {user.email}
              </span>
            )}
            {/* PC: new card button */}
            <Button
              onClick={() => setDialogOpen(true)}
              className="hidden md:inline-flex"
            >
              <Plus className="mr-1 h-4 w-4" />
              新規登録
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground"
              title={user?.email ?? ""}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1 hidden md:inline">ログアウト</span>
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <SearchBar value={query} onChange={setQuery} />
        </div>
      </header>

      {/* Card list */}
      <main className="p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setLoading(true);
                loadCards();
              }}
            >
              再読み込み
            </Button>
          </div>
        ) : (
          <>
            <BusinessCardList cards={cards} />

            {sharedCards.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                  共有された名刺
                </h2>
                <BusinessCardList
                  cards={sharedCards.map((s) => s.card)}
                  getHref={(card) => `/cards/${card.id}?owner=${sharedCards.find((s) => s.card.id === card.id)?.ownerId ?? ""}`}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile: FAB */}
      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 md:hidden"
        aria-label="新規登録"
      >
        <Plus className="h-6 w-6" />
      </button>

      <RegistrationMethodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
