import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateUser, mockSignIn, mockSignOut, mockSendPasswordReset } =
  vi.hoisted(() => ({
    mockCreateUser: vi.fn(),
    mockSignIn: vi.fn(),
    mockSignOut: vi.fn(),
    mockSendPasswordReset: vi.fn(),
  }));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: mockCreateUser,
  signInWithEmailAndPassword: mockSignIn,
  signOut: mockSignOut,
  sendPasswordResetEmail: mockSendPasswordReset,
}));

vi.mock("@/lib/firebase", () => ({ auth: {} }));

import { signUp, signIn, signOutUser, resetPassword } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signUp", () => {
  it("createUserWithEmailAndPassword を正しい引数で呼ぶ", async () => {
    mockCreateUser.mockResolvedValue({ user: { uid: "uid-001" } });
    await signUp("test@example.com", "password123");
    expect(mockCreateUser).toHaveBeenCalledWith(
      {},
      "test@example.com",
      "password123"
    );
  });

  it("Firebase がエラーを返した場合は例外を投げる", async () => {
    mockCreateUser.mockRejectedValue({ code: "auth/email-already-in-use" });
    await expect(signUp("dup@example.com", "password123")).rejects.toMatchObject(
      { code: "auth/email-already-in-use" }
    );
  });
});

describe("signIn", () => {
  it("signInWithEmailAndPassword を正しい引数で呼ぶ", async () => {
    mockSignIn.mockResolvedValue({ user: { uid: "uid-001" } });
    await signIn("test@example.com", "password123");
    expect(mockSignIn).toHaveBeenCalledWith(
      {},
      "test@example.com",
      "password123"
    );
  });

  it("認証失敗時は例外を投げる", async () => {
    mockSignIn.mockRejectedValue({ code: "auth/wrong-password" });
    await expect(signIn("test@example.com", "wrong")).rejects.toMatchObject(
      { code: "auth/wrong-password" }
    );
  });
});

describe("signOutUser", () => {
  it("signOut を呼ぶ", async () => {
    mockSignOut.mockResolvedValue(undefined);
    await signOutUser();
    expect(mockSignOut).toHaveBeenCalledWith({});
  });
});

describe("resetPassword", () => {
  it("sendPasswordResetEmail を正しい引数で呼ぶ", async () => {
    mockSendPasswordReset.mockResolvedValue(undefined);
    await resetPassword("test@example.com");
    expect(mockSendPasswordReset).toHaveBeenCalledWith({}, "test@example.com");
  });

  it("存在しないメールアドレスでも Firebase にそのまま委譲する", async () => {
    mockSendPasswordReset.mockRejectedValue({ code: "auth/user-not-found" });
    await expect(resetPassword("notexist@example.com")).rejects.toMatchObject(
      { code: "auth/user-not-found" }
    );
  });
});
