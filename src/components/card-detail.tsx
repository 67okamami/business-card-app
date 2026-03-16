"use client";

import { BusinessCard } from "@/types/business-card";
import {
  Building2,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Globe,
  StickyNote,
  Briefcase,
} from "lucide-react";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v: string) {
  return /^[\d\-+()\s]+$/.test(v);
}
function isValidUrl(v: string) {
  return /^https?:\/\/.+/.test(v);
}

interface CardDetailProps {
  card: BusinessCard;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  if (!value) return null;
  const content = href ? (
    <a href={href} className="text-primary hover:underline break-words">
      {value}
    </a>
  ) : (
    <span className="break-words">{value}</span>
  );

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{content}</p>
      </div>
    </div>
  );
}

export function CardDetail({ card }: CardDetailProps) {
  const fullName = `${card.lastName} ${card.firstName}`.trim();
  const fullNameKana =
    `${card.lastNameKana} ${card.firstNameKana}`.trim();

  return (
    <div className="md:flex md:gap-6">
      {card.imageUrl && (
        <div className="mb-4 md:mb-0 md:w-2/5 shrink-0">
          <img
            src={card.imageUrl}
            alt="名刺画像"
            className="w-full rounded-lg border border-border object-contain"
          />
        </div>
      )}
      <div className="flex-1 space-y-1">
        {fullNameKana && (
          <p className="text-xs text-muted-foreground">{fullNameKana}</p>
        )}
        <h2 className="text-2xl font-bold">{fullName || "名前未設定"}</h2>

        <div className="border-t border-border my-3" />

        {(card.company || card.department || card.position) && (
          <>
            <div className="flex items-start gap-3 py-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">会社名</p>
                <p className="text-sm flex items-center gap-2 flex-wrap">
                  {isValidUrl(card.companyUrl) ? (
                    <a href={card.companyUrl} className="text-primary hover:underline break-words">
                      {card.company}
                    </a>
                  ) : (
                    <span className="break-words">{card.company}</span>
                  )}
                  {card.stockCode && (
                    <a
                      href={`https://finance.yahoo.co.jp/quote/${card.stockCode}.T`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground hover:bg-muted/70 hover:text-primary transition-colors"
                    >
                      {card.stockCode}
                    </a>
                  )}
                </p>
              </div>
            </div>
            <InfoRow
              icon={Briefcase}
              label="部署 / 役職"
              value={[card.department, card.position]
                .filter(Boolean)
                .join(" / ")}
            />
            <div className="border-t border-border my-3" />
          </>
        )}

        <InfoRow
          icon={Mail}
          label="メール"
          value={card.email}
          href={isValidEmail(card.email) ? `mailto:${card.email}` : undefined}
        />
        <InfoRow
          icon={Phone}
          label="電話番号"
          value={card.phone}
          href={isValidPhone(card.phone) ? `tel:${card.phone}` : undefined}
        />
        <InfoRow
          icon={Smartphone}
          label="携帯番号"
          value={card.mobile}
          href={isValidPhone(card.mobile) ? `tel:${card.mobile}` : undefined}
        />

        {(card.email || card.phone || card.mobile) && (
          <div className="border-t border-border my-3" />
        )}

        <InfoRow
          icon={MapPin}
          label="住所"
          value={
            [card.postalCode && `〒${card.postalCode}`, card.address]
              .filter(Boolean)
              .join(" ") || ""
          }
        />
        <InfoRow
          icon={Globe}
          label="関連サイト"
          value={card.website}
          href={isValidUrl(card.website) ? card.website : undefined}
        />

        {card.notes && (
          <>
            <div className="border-t border-border my-3" />
            <InfoRow icon={StickyNote} label="メモ" value={card.notes} />
          </>
        )}
      </div>
    </div>
  );
}
