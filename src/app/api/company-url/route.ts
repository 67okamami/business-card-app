import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const company = request.nextUrl.searchParams.get("company");
  if (!company) {
    return NextResponse.json({ error: "company parameter is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId || apiKey === "your_google_cse_api_key_here") {
    return NextResponse.json({ url: "" });
  }

  try {
    const q = encodeURIComponent(`${company} 公式サイト`);
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${q}&num=1`
    );
    const data = await res.json();
    const url: string = data.items?.[0]?.link ?? "";
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: "" });
  }
}
