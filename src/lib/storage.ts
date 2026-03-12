import { BusinessCard, BusinessCardFormData } from "@/types/business-card";

const STORAGE_KEY = "business-cards";

function readAll(): BusinessCard[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BusinessCard[];
  } catch {
    return [];
  }
}

function writeAll(cards: BusinessCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function getCards(): BusinessCard[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getCardById(id: string): BusinessCard | undefined {
  return readAll().find((c) => c.id === id);
}

export function saveCard(data: BusinessCardFormData): BusinessCard {
  const now = new Date().toISOString();
  const card: BusinessCard = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const cards = readAll();
  cards.push(card);
  writeAll(cards);
  return card;
}

export function updateCard(
  id: string,
  data: BusinessCardFormData
): BusinessCard | undefined {
  const cards = readAll();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const updated: BusinessCard = {
    ...cards[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  cards[idx] = updated;
  writeAll(cards);
  return updated;
}

export function deleteCard(id: string): boolean {
  const cards = readAll();
  const filtered = cards.filter((c) => c.id !== id);
  if (filtered.length === cards.length) return false;
  writeAll(filtered);
  return true;
}

export function searchCards(query: string): BusinessCard[] {
  if (!query.trim()) return getCards();
  const q = query.toLowerCase();
  return getCards().filter((c) => {
    const searchable = [
      c.lastName,
      c.firstName,
      c.lastNameKana,
      c.firstNameKana,
      c.company,
      c.department,
      c.position,
      c.email,
      c.phone,
      c.mobile,
      c.address,
      c.notes,
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(q);
  });
}
