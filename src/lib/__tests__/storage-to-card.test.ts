import { describe, it, expect, vi } from "vitest";

// firebase/firestore を先にモック（toCard の import より前に宣言）
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: class Timestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

import { toCard } from "@/lib/storage";
import { Timestamp } from "firebase/firestore";

const makeTimestamp = (isoStr: string) =>
  new Timestamp(Math.floor(new Date(isoStr).getTime() / 1000), 0);

describe("toCard", () => {
  it("全フィールドが正しくマッピングされる", () => {
    const data = {
      lastName: "佐藤",
      firstName: "健太",
      lastNameKana: "サトウ",
      firstNameKana: "ケンタ",
      company: "ABC株式会社",
      department: "営業部",
      position: "部長",
      email: "sato@example.com",
      phone: "03-1234-5678",
      mobile: "090-1234-5678",
      postalCode: "100-0001",
      address: "東京都千代田区",
      website: "https://example.com",
      notes: "メモ",
      imageUrl: "data:image/jpeg;base64,abc",
      createdAt: makeTimestamp("2026-03-16T00:00:00.000Z"),
      updatedAt: makeTimestamp("2026-03-16T01:00:00.000Z"),
    };

    const card = toCard("card-001", data as never);

    expect(card.id).toBe("card-001");
    expect(card.lastName).toBe("佐藤");
    expect(card.firstName).toBe("健太");
    expect(card.company).toBe("ABC株式会社");
    expect(card.email).toBe("sato@example.com");
    expect(card.createdAt).toBe("2026-03-16T00:00:00.000Z");
    expect(card.updatedAt).toBe("2026-03-16T01:00:00.000Z");
  });

  it("undefinedフィールドは空文字になる", () => {
    const card = toCard("card-002", {});

    expect(card.lastName).toBe("");
    expect(card.firstName).toBe("");
    expect(card.company).toBe("");
    expect(card.email).toBe("");
    expect(card.phone).toBe("");
    expect(card.notes).toBe("");
    expect(card.imageUrl).toBe("");
    expect(card.createdAt).toBe("");
    expect(card.updatedAt).toBe("");
  });

  it("createdAt が文字列形式でもそのまま返す", () => {
    const data = {
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };
    const card = toCard("card-003", data);

    expect(card.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(card.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("Timestamp 形式の日時を ISO 文字列に変換する", () => {
    const data = {
      createdAt: makeTimestamp("2026-03-15T09:00:00.000Z"),
      updatedAt: makeTimestamp("2026-03-15T10:30:00.000Z"),
    };
    const card = toCard("card-004", data as never);

    expect(card.createdAt).toBe("2026-03-15T09:00:00.000Z");
    expect(card.updatedAt).toBe("2026-03-15T10:30:00.000Z");
  });

  it("id が正しく設定される", () => {
    const card = toCard("unique-id-xyz", {});
    expect(card.id).toBe("unique-id-xyz");
  });
});
