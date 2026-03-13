import { describe, it, expect } from "vitest";
import { getConfidenceStyle } from "@/components/business-card-form";

describe("getConfidenceStyle", () => {
  it("値が空の場合、赤スタイル + 「読み取れませんでした」を返す", () => {
    const style = getConfidenceStyle(0, false);
    expect(style).not.toBeNull();
    expect(style!.inputClass).toContain("border-red");
    expect(style!.label).toBe("読み取れませんでした");
  });

  it("confidence が undefined の場合、null を返す", () => {
    expect(getConfidenceStyle(undefined, true)).toBeNull();
  });

  it("高確信度（91%以上）は緑スタイルを返す", () => {
    const style = getConfidenceStyle(91, true);
    expect(style).not.toBeNull();
    expect(style!.inputClass).toContain("green");
    expect(style!.dotClass).toContain("green");
  });

  it("100% は緑スタイルを返す", () => {
    const style = getConfidenceStyle(100, true);
    expect(style!.inputClass).toContain("green");
  });

  it("中確信度（51〜90%）は黄色スタイルを返す", () => {
    const style = getConfidenceStyle(51, true);
    expect(style).not.toBeNull();
    expect(style!.inputClass).toContain("yellow");
    expect(style!.dotClass).toContain("yellow");
  });

  it("90% は黄色スタイルを返す", () => {
    const style = getConfidenceStyle(90, true);
    expect(style!.inputClass).toContain("yellow");
  });

  it("低確信度（50%以下）は赤スタイルを返す", () => {
    const style = getConfidenceStyle(50, true);
    expect(style).not.toBeNull();
    expect(style!.inputClass).toContain("red");
    expect(style!.dotClass).toContain("red");
  });

  it("0% は赤スタイルを返す", () => {
    const style = getConfidenceStyle(0, true);
    expect(style!.inputClass).toContain("red");
  });

  it("境界値: 51% は黄色、50% は赤", () => {
    expect(getConfidenceStyle(51, true)!.dotClass).toContain("yellow");
    expect(getConfidenceStyle(50, true)!.dotClass).toContain("red");
  });

  it("境界値: 91% は緑、90% は黄色", () => {
    expect(getConfidenceStyle(91, true)!.dotClass).toContain("green");
    expect(getConfidenceStyle(90, true)!.dotClass).toContain("yellow");
  });
});
