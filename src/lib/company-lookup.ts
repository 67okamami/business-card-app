import db from "./data/listed-companies.json";

const companies = db as Record<string, string>;

/**
 * 会社名から「株式会社」等の法人格を除去して正規化したキー候補を返す
 */
function normalize(name: string): string[] {
  const trimmed = name.trim();
  const keys = new Set<string>();
  keys.add(trimmed);

  const patterns: RegExp[] = [
    /^株式会社(.+)$/,
    /^（株）(.+)$/,
    /^\(株\)(.+)$/,
    /^(.+)株式会社$/,
    /^(.+)（株）$/,
    /^(.+)\(株\)$/,
  ];

  for (const pattern of patterns) {
    const m = trimmed.match(pattern);
    if (m) keys.add(m[1].trim());
  }

  return [...keys];
}

/**
 * 会社名から証券コードを返す。見つからなければ空文字。
 */
export function lookupStockCode(companyName: string): string {
  if (!companyName) return "";
  for (const key of normalize(companyName)) {
    if (companies[key]) return companies[key];
  }
  return "";
}
