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

const COLLECTION = "businessCards";

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
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt as string) || "",
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : (data.updatedAt as string) || "",
  };
}

export async function getCards(): Promise<BusinessCard[]> {
  const q = query(collection(db, COLLECTION), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toCard(d.id, d.data()));
}

export async function getCardById(id: string): Promise<BusinessCard | undefined> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return undefined;
  return toCard(snap.id, snap.data());
}

export async function saveCard(data: BusinessCardFormData): Promise<BusinessCard> {
  const now = Timestamp.now();
  const docData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, COLLECTION), docData);
  return toCard(docRef.id, docData);
}

export async function updateCard(
  id: string,
  data: BusinessCardFormData
): Promise<BusinessCard | undefined> {
  const docRef = doc(db, COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return undefined;

  const updateData = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(docRef, updateData);
  return toCard(id, { ...snap.data(), ...updateData });
}

export async function deleteCard(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return true;
  } catch {
    return false;
  }
}

export async function searchCards(queryStr: string): Promise<BusinessCard[]> {
  const cards = await getCards();
  if (!queryStr.trim()) return cards;
  const q = queryStr.toLowerCase();
  return cards.filter((c) => {
    const searchable = [
      c.lastName, c.firstName, c.lastNameKana, c.firstNameKana,
      c.company, c.department, c.position, c.email,
      c.phone, c.mobile, c.address, c.notes,
    ].join(" ").toLowerCase();
    return searchable.includes(q);
  });
}
