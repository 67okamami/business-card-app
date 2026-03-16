import { BusinessCardFormData, emptyFormData } from "@/types/business-card";

export type OcrConfidence = Record<string, number>;

export interface OcrResult {
  formData: BusinessCardFormData;
  confidence: OcrConfidence;
}

/**
 * 画像のdata URLからBase64データとメディアタイプを抽出する
 */
export function parseDataUrl(dataUrl: string): { base64: string; mediaType: string } {
  const match = dataUrl.match(/^data:(image\/[\w+.\-]+);base64,([\s\S]+)$/);
  if (!match) {
    throw new Error("Invalid data URL format");
  }
  return { mediaType: match[1], base64: match[2] };
}

/**
 * 名刺画像をClaude Vision APIで解析し、フィールドを抽出する
 */
export async function analyzeBusinessCard(
  imageDataUrl: string
): Promise<OcrResult> {
  const { base64, mediaType } = parseDataUrl(imageDataUrl);

  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mediaType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "名刺の解析に失敗しました");
  }

  const parsed = await res.json();
  const formData: BusinessCardFormData = { ...emptyFormData, ...parsed.values };

  // companyUrl が空で company がある場合、Google CSE で会社HP を自動取得
  if (!formData.companyUrl && formData.company) {
    try {
      const cseRes = await fetch(
        `/api/company-url?company=${encodeURIComponent(formData.company)}`
      );
      if (cseRes.ok) {
        const cseData = await cseRes.json();
        if (cseData.url) {
          formData.companyUrl = cseData.url;
        }
      }
    } catch {
      // 取得失敗は無視して続行
    }
  }

  return {
    formData,
    confidence: parsed.confidence ?? {},
  };
}
