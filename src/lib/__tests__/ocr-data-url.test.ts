import { describe, it, expect } from "vitest";
import { parseDataUrl } from "@/lib/ocr";

describe("parseDataUrl", () => {
  it("JPEG data URL を正しくパースする", () => {
    const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJ==";
    const { base64, mediaType } = parseDataUrl(dataUrl);
    expect(mediaType).toBe("image/jpeg");
    expect(base64).toBe("/9j/4AAQSkZJ==");
  });

  it("PNG data URL を正しくパースする", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const { base64, mediaType } = parseDataUrl(dataUrl);
    expect(mediaType).toBe("image/png");
    expect(base64).toBe("iVBORw0KGgo=");
  });

  it("WebP data URL を正しくパースする", () => {
    const dataUrl = "data:image/webp;base64,UklGRlY=";
    const { base64, mediaType } = parseDataUrl(dataUrl);
    expect(mediaType).toBe("image/webp");
    expect(base64).toBe("UklGRlY=");
  });

  it("svg+xml のようなメディアタイプもパースできる", () => {
    const dataUrl = "data:image/svg+xml;base64,PHN2Zz4=";
    const { base64, mediaType } = parseDataUrl(dataUrl);
    expect(mediaType).toBe("image/svg+xml");
    expect(base64).toBe("PHN2Zz4=");
  });

  it("不正なフォーマットではエラーを投げる", () => {
    expect(() => parseDataUrl("invalid-data")).toThrow("Invalid data URL format");
  });

  it("base64部分がない場合はエラーを投げる", () => {
    expect(() => parseDataUrl("data:image/jpeg;base64,")).toThrow("Invalid data URL format");
  });

  it("image以外のスキームではエラーを投げる", () => {
    expect(() => parseDataUrl("data:text/plain;base64,aGVsbG8=")).toThrow(
      "Invalid data URL format"
    );
  });
});
