import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { extractJson, parseOcrResponse } from "@/lib/ocr-parse";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは名刺画像から情報を正確に読み取る専門家です。
名刺画像を受け取り、以下の形式でJSONを返してください。

## 重要なルール
- 画像が回転・逆さまの場合でも、文字の向きを正しく判断して読み取ってください。
- 会社名は、ロゴやブランド名（英語表記等）ではなく、名刺に印刷されている正式な日本語の法人名（例:「株式会社ネオジャパン」）を優先してください。ロゴのみで日本語表記がない場合はロゴのテキストを使用してください。
- 読み取れないフィールドはvalueを空文字にしてください。
- websiteフィールドはhttps://を含む完全なURL形式で返してください。
- JSONのみを返し、それ以外のテキストは含めないでください。

## 出力形式
各フィールドを {"value": "読み取った値", "confidence": 読み取り確信度(0-100の整数)} の形式で返してください。

{
  "lastName": {"value": "姓", "confidence": 0},
  "firstName": {"value": "名", "confidence": 0},
  "lastNameKana": {"value": "姓のフリガナ（カタカナ）", "confidence": 0},
  "firstNameKana": {"value": "名のフリガナ（カタカナ）", "confidence": 0},
  "company": {"value": "会社名（正式な日本語法人名を優先）", "confidence": 0},
  "department": {"value": "部署", "confidence": 0},
  "position": {"value": "役職", "confidence": 0},
  "email": {"value": "メールアドレス", "confidence": 0},
  "phone": {"value": "電話番号（固定電話）", "confidence": 0},
  "mobile": {"value": "携帯番号", "confidence": 0},
  "postalCode": {"value": "郵便番号", "confidence": 0},
  "address": {"value": "住所", "confidence": 0},
  "website": {"value": "名刺に記載されているURL（会社サイト・製品サイト問わず）", "confidence": 0}
}`;

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "画像データがありません" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "この名刺画像から情報を読み取ってJSONで返してください。",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "解析結果が取得できませんでした" }, { status: 500 });
    }

    const jsonStr = extractJson(textBlock.text);

    try {
      const parsed = JSON.parse(jsonStr);
      const { values, confidence } = parseOcrResponse(parsed);
      return NextResponse.json({ values, confidence });
    } catch (parseError) {
      console.error("JSON parse error. Raw response:", jsonStr.substring(0, 200));
      return NextResponse.json(
        { error: "名刺の解析結果を読み取れませんでした" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("OCR API error:", error);
    const message = error instanceof Error ? error.message : "名刺の解析に失敗しました";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
