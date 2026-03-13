import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたは名刺画像から情報を正確に読み取る専門家です。
名刺画像を受け取り、以下のフィールドをJSON形式で返してください。
読み取れないフィールドは空文字にしてください。
websiteフィールドはhttps://を含む完全なURL形式で返してください（例: https://www.example.com）。
JSONのみを返し、それ以外のテキストは含めないでください。

{
  "lastName": "姓",
  "firstName": "名",
  "lastNameKana": "姓のフリガナ（カタカナ）",
  "firstNameKana": "名のフリガナ（カタカナ）",
  "company": "会社名",
  "department": "部署",
  "position": "役職",
  "email": "メールアドレス",
  "phone": "電話番号（固定電話）",
  "mobile": "携帯番号",
  "postalCode": "郵便番号",
  "address": "住所",
  "website": "WebサイトURL"
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

    // JSON部分を抽出（```json ... ``` で囲まれている場合にも対応）
    let jsonStr = textBlock.text.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "名刺の解析に失敗しました" },
      { status: 500 }
    );
  }
}
