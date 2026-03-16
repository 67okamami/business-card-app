import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db, auth } from "./firebase";
import { BusinessCard, BusinessCardFormData } from "@/types/business-card";

function cardsCollection(userId: string) {
  return collection(db, "users", userId, "businessCards");
}

function cardDoc(userId: string, cardId: string) {
  return doc(db, "users", userId, "businessCards", cardId);
}

function receivedCardsCollection(userId: string) {
  return collection(db, "users", userId, "receivedCards");
}

export function toCard(id: string, data: Record<string, unknown>): BusinessCard {
  return {
    id,
    lastName: (data.lastName as string) || "",
    firstName: (data.firstName as string) || "",
    lastNameKana: (data.lastNameKana as string) || "",
    firstNameKana: (data.firstNameKana as string) || "",
    company: (data.company as string) || "",
    department: (data.department as string) || "",
    position: (data.position as string) || "",
    email: (data.email as string) || "",
    phone: (data.phone as string) || "",
    mobile: (data.mobile as string) || "",
    postalCode: (data.postalCode as string) || "",
    address: (data.address as string) || "",
    companyUrl: (data.companyUrl as string) || "",
    website: (data.website as string) || "",
    notes: (data.notes as string) || "",
    imageUrl: (data.imageUrl as string) || "",
    sharedWith: Array.isArray(data.sharedWith) ? (data.sharedWith as string[]) : [],
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : (data.createdAt as string) || "",
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : (data.updatedAt as string) || "",
  };
}

async function writeCardIndex(
  ownerId: string,
  cardId: string,
  card: BusinessCardFormData,
  ownerEmail: string
) {
  if (!card.email && !card.lastName && !card.company) return;
  await setDoc(doc(db, "cardIndex", `${ownerId}_${cardId}`), {
    email: card.email || "",
    lastName: card.lastName || "",
    firstName: card.firstName || "",
    company: card.company || "",
    ownerId,
    cardId,
    ownerEmail,
  });
}

async function deleteCardIndex(ownerId: string, cardId: string) {
  try {
    await deleteDoc(doc(db, "cardIndex", `${ownerId}_${cardId}`));
  } catch {
    // ignore
  }
}

export async function getCards(userId: string): Promise<BusinessCard[]> {
  const q = query(cardsCollection(userId), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toCard(d.id, d.data()));
}

export async function getCardById(
  userId: string,
  id: string
): Promise<BusinessCard | undefined> {
  const snap = await getDoc(cardDoc(userId, id));
  if (!snap.exists()) return undefined;
  return toCard(snap.id, snap.data());
}

export async function saveCard(
  userId: string,
  data: BusinessCardFormData
): Promise<BusinessCard> {
  const now = Timestamp.now();
  const docData = { ...data, createdAt: now, updatedAt: now, sharedWith: [] };
  const docRef = await addDoc(cardsCollection(userId), docData);
  const ownerEmail = auth.currentUser?.email ?? "";
  await writeCardIndex(userId, docRef.id, data, ownerEmail);
  return toCard(docRef.id, docData);
}

export async function updateCard(
  userId: string,
  id: string,
  data: BusinessCardFormData
): Promise<BusinessCard | undefined> {
  const ref = cardDoc(userId, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return undefined;
  const updateData = { ...data, updatedAt: Timestamp.now() };
  await updateDoc(ref, updateData);
  const ownerEmail = auth.currentUser?.email ?? "";
  await writeCardIndex(userId, id, data, ownerEmail);
  return toCard(id, { ...snap.data(), ...updateData });
}

export async function deleteCard(userId: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(cardDoc(userId, id));
    await deleteCardIndex(userId, id);
    return true;
  } catch {
    return false;
  }
}

export async function searchCards(
  userId: string,
  queryStr: string
): Promise<BusinessCard[]> {
  const cards = await getCards(userId);
  if (!queryStr.trim()) return cards;
  const q = queryStr.toLowerCase();
  return cards.filter((c) => {
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

// ── 共有機能 ──────────────────────────────────────────

export async function shareCard(
  userId: string,
  cardId: string,
  targetEmail: string
): Promise<{ success: boolean; error?: string }> {
  // Look up target UID from userIndex
  const indexSnap = await getDoc(doc(db, "userIndex", targetEmail));
  if (!indexSnap.exists()) {
    return { success: false, error: "このメールアドレスのユーザーが見つかりません" };
  }
  const targetUid = indexSnap.data().uid as string;
  if (targetUid === userId) {
    return { success: false, error: "自分自身には共有できません" };
  }

  const ref = cardDoc(userId, cardId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { success: false, error: "名刺が見つかりません" };
  }

  const currentSharedWith: string[] = Array.isArray(snap.data().sharedWith)
    ? (snap.data().sharedWith as string[])
    : [];
  if (currentSharedWith.includes(targetUid)) {
    return { success: false, error: "既に共有済みです" };
  }

  await updateDoc(ref, { sharedWith: [...currentSharedWith, targetUid] });

  // Add to target's receivedCards
  await addDoc(receivedCardsCollection(targetUid), {
    ownerId: userId,
    cardId,
    sharedAt: Timestamp.now(),
  });

  return { success: true };
}

export interface SharedCard {
  card: BusinessCard;
  ownerId: string;
}

export async function getSharedCards(userId: string): Promise<SharedCard[]> {
  const snapshot = await getDocs(receivedCardsCollection(userId));
  const results: SharedCard[] = [];

  for (const d of snapshot.docs) {
    const { ownerId, cardId } = d.data() as { ownerId: string; cardId: string };
    try {
      const cardSnap = await getDoc(cardDoc(ownerId, cardId));
      if (cardSnap.exists()) {
        results.push({ card: toCard(cardSnap.id, cardSnap.data()), ownerId });
      }
    } catch {
      // Card may have been deleted; skip
    }
  }

  return results;
}

export async function findDuplicateOwners(
  userId: string,
  cardEmail: string
): Promise<Array<{ ownerEmail: string; ownerUid: string }>> {
  if (!cardEmail) return [];
  const q = query(
    collection(db, "cardIndex"),
    where("email", "==", cardEmail)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .filter((d) => (d.data().ownerId as string) !== userId)
    .map((d) => ({
      ownerEmail: d.data().ownerEmail as string,
      ownerUid: d.data().ownerId as string,
    }));
}

// ── アカウント削除 ──────────────────────────────────────

export async function deleteAccount(userId: string, userEmail: string): Promise<void> {
  // Delete all business cards and their cardIndex entries
  const cardsSnap = await getDocs(cardsCollection(userId));
  for (const d of cardsSnap.docs) {
    await deleteCardIndex(userId, d.id);
    await deleteDoc(d.ref);
  }

  // Delete receivedCards
  const receivedSnap = await getDocs(receivedCardsCollection(userId));
  for (const d of receivedSnap.docs) {
    await deleteDoc(d.ref);
  }

  // Delete user profile docs
  await deleteDoc(doc(db, "users", userId));
  await deleteDoc(doc(db, "userIndex", userEmail));

  // Delete Firebase Auth user
  const currentUser = auth.currentUser;
  if (currentUser) {
    await deleteUser(currentUser);
  }
}
