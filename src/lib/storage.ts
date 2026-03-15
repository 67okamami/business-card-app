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
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { BusinessCard, BusinessCardFormData } from "@/types/business-card";

function cardsCollection(userId: string) {
  return collection(db, "users", userId, "businessCards");
}

function cardDoc(userId: string, cardId: string) {
  return doc(db, "users", userId, "businessCards", cardId);
}

function toCard(id: string, data: Record<string, unknown>): BusinessCard {
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
    website: (data.website as string) || "",
    notes: (data.notes as string) || "",
    imageUrl: (data.imageUrl as string) || "",
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
  const docData = { ...data, createdAt: now, updatedAt: now };
  const docRef = await addDoc(cardsCollection(userId), docData);
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
  return toCard(id, { ...snap.data(), ...updateData });
}

export async function deleteCard(userId: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(cardDoc(userId, id));
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
