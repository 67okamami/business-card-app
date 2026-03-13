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
            <InfoRow
              icon={Building2}
              label="会社名"
              value={card.company}
            />
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
