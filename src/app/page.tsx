"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { BusinessCardList } from "@/components/business-card-list";
import { RegistrationMethodDialog } from "@/components/registration-method-dialog";

import { getCards, searchCards } from "@/lib/storage";
import { BusinessCard } from "@/types/business-card";
import { Plus, CreditCard, Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    try {
      setError(null);
      const results = query.trim() ? await searchCards(query) : await getCards();
      setCards(results);
    } catch {
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleSelect = (method: "manual" | "ocr") => {
    setDialogOpen(false);
    router.push(`/cards/new?method=${method}`);
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
          {/* PC: header button */}
          <Button
            onClick={() => setDialogOpen(true)}
            className="hidden md:inline-flex"
          >
            <Plus className="mr-1 h-4 w-4" />
            新規登録
          </Button>
        </div>
        <div className="mt-3">
          <SearchBar value={query} onChange={setQuery} />
        </div>
      </header>

      {/* Card list */}
      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setLoading(true); loadCards(); }}>
              再読み込み
            </Button>
          </div>
        ) : (
          <BusinessCardList cards={cards} />
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
