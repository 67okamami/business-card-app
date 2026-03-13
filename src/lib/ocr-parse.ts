/**
 * Claude APIのレスポンステキストからJSONを抽出する
 */
export function extractJson(rawText: string): string {
  let jsonStr = rawText.trim();

  // ```json ... ``` で囲まれている場合
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // JSONオブジェクトを直接抽出
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return jsonStr;
}

/**
 * OCR解析結果のJSONを values と confidence に分離する
 * { field: { value, confidence } } 形式と、旧形式（文字列直接）の両方に対応
 */
export function parseOcrResponse(parsed: Record<string, unknown>): {
  values: Record<string, string>;
  confidence: Record<string, number>;
} {
  const values: Record<string, string> = {};
  const confidence: Record<string, number> = {};

  for (const [key, entry] of Object.entries(parsed)) {
    if (
      entry &&
      typeof entry === "object" &&
      "value" in entry &&
      "confidence" in entry
    ) {
      const e = entry as { value: string; confidence: number };
      values[key] = e.value ?? "";
      confidence[key] = typeof e.confidence === "number" ? e.confidence : 0;
    } else {
      // フォールバック: 旧形式（文字列直接）にも対応
      values[key] = typeof entry === "string" ? entry : "";
      confidence[key] = typeof entry === "string" && entry ? 80 : 0;
    }
  }

  return { values, confidence };
}
