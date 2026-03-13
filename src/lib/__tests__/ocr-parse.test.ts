import { describe, it, expect } from "vitest";
import { extractJson, parseOcrResponse } from "../ocr-parse";

describe("extractJson", () => {
  it("コードブロック ```json ... ``` からJSONを抽出する", () => {
    const raw = '```json\n{"name": "test"}\n```';
    expect(extractJson(raw)).toBe('{"name": "test"}');
  });

  it("コードブロック ``` ... ``` (json指定なし) からJSONを抽出する", () => {
    const raw = '```\n{"name": "test"}\n```';
    expect(extractJson(raw)).toBe('{"name": "test"}');
  });

  it("コードブロックなしの直接JSONを抽出する", () => {
    const raw = 'ここにJSONがあります: {"name": "test"} 以上です';
    expect(extractJson(raw)).toBe('{"name": "test"}');
  });

  it("前後の空白をトリムする", () => {
    const raw = '  \n{"name": "test"}\n  ';
    expect(extractJson(raw)).toBe('{"name": "test"}');
  });

  it("ネストされたJSONも抽出できる", () => {
    const raw = '```json\n{"a": {"value": "v", "confidence": 90}}\n```';
    const result = extractJson(raw);
    expect(JSON.parse(result)).toEqual({ a: { value: "v", confidence: 90 } });
  });
});

describe("parseOcrResponse", () => {
  it("{ value, confidence } 形式を正しく分離する", () => {
    const parsed = {
      lastName: { value: "佐藤", confidence: 95 },
      firstName: { value: "健太", confidence: 85 },
      company: { value: "", confidence: 0 },
    };
    const { values, confidence } = parseOcrResponse(parsed);

    expect(values.lastName).toBe("佐藤");
    expect(values.firstName).toBe("健太");
    expect(values.company).toBe("");
    expect(confidence.lastName).toBe(95);
    expect(confidence.firstName).toBe(85);
    expect(confidence.company).toBe(0);
  });

  it("旧形式（文字列直接）にフォールバックする", () => {
    const parsed = {
      lastName: "佐藤",
      firstName: "健太",
      company: "",
    };
    const { values, confidence } = parseOcrResponse(parsed);

    expect(values.lastName).toBe("佐藤");
    expect(values.firstName).toBe("健太");
    expect(values.company).toBe("");
    // 旧形式: 値ありは80、空文字は0
    expect(confidence.lastName).toBe(80);
    expect(confidence.firstName).toBe(80);
    expect(confidence.company).toBe(0);
  });

  it("value が null の場合は空文字にフォールバックする", () => {
    const parsed = {
      lastName: { value: null, confidence: 50 },
    };
    const { values, confidence } = parseOcrResponse(
      parsed as unknown as Record<string, unknown>
    );

    expect(values.lastName).toBe("");
    expect(confidence.lastName).toBe(50);
  });

  it("confidence が文字列の場合は0にフォールバックする", () => {
    const parsed = {
      lastName: { value: "佐藤", confidence: "high" },
    };
    const { values, confidence } = parseOcrResponse(
      parsed as unknown as Record<string, unknown>
    );

    expect(values.lastName).toBe("佐藤");
    expect(confidence.lastName).toBe(0);
  });
});
