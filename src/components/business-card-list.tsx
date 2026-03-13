"use client";

import Link from "next/link";
import { BusinessCard } from "@/types/business-card";
import { Building2, Mail, Phone } from "lucide-react";

interface BusinessCardListProps {
  cards: BusinessCard[];
}

export function BusinessCardList({ cards }: BusinessCardListProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Building2 className="mb-3 h-12 w-12" />
        <p className="text-lg font-medium">名刺がありません</p>
        <p className="text-sm">「新規登録」ボタンから名刺を追加してください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/cards/${card.id}`}
          className="block overflow-hidden rounded-xl border border-border bg-background p-4 shadow-sm transition hover:shadow-md"
        >
          <p className="truncate text-lg font-bold text-foreground">
            {`${card.lastName} ${card.firstName}`.trim() || "名前未設定"}
          </p>
          {(card.company || card.department) && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{[card.company, card.department].filter(Boolean).join(" / ")}</span>
            </p>
          )}
          {card.email && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{card.email}</span>
            </p>
          )}
          {(card.phone || card.mobile) && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{card.phone || card.mobile}</span>
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
