import { BusinessCardFormData, emptyFormData } from "@/types/business-card";

// --- Pattern constants ---

const COMPANY_RE =
  /株式会社|有限会社|合同会社|一般社団法人|（株）|\(株\)|合資会社/;

const DEPARTMENT_RE =
  /(部|課|室|局|センター|事業部|本部|支社|支店|事務所|グループ)/;

const POSITION_RE =
  /社長|副社長|専務|常務|取締役|監査役|部長|次長|課長|係長|主任|主幹|マネージャー|マネジャー|リーダー|チーフ|ディレクター|エンジニア|コンサルタント|デザイナー|アナリスト|スペシャリスト|アドバイザー|プロデューサー|代表|CEO|CTO|CFO|COO/;

const KATAKANA_LINE_RE = /^[ァ-ヶー　\s]+$/;

const ADDRESS_RE = /都|道|府|県|市|区|町|村|丁目|番|号/;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_RE = /https?:\/\/[^\s]+/;
const POSTAL_RE = /〒?\s*(\d{3}[-−ー]\d{4})/;
const PHONE_RE = /0\d{1,4}[-−ー]?\d{1,4}[-−ー]?\d{3,4}/g;

// --- Line classification ---

type LineType =
  | "company"
  | "department_position"
  | "kanji_name"
  | "katakana_name"
  | "address"
  | "consumed"
  | "unknown";

function classifyLine(line: string, consumedValues: string[]): LineType {
  // Skip lines that contain already-extracted contact info
  if (consumedValues.some((v) => line.includes(v))) return "consumed";

  // Skip lines that are only numbers/symbols
  if (/^[0-9\s\-−ー〒:：]+$/.test(line)) return "consumed";
  if (line.length < 2) return "consumed";

  // Email / URL / Phone label lines
  if (EMAIL_RE.test(line)) return "consumed";
  if (URL_RE.test(line)) return "consumed";
  if (/^(TEL|FAX|Mobile|携帯|電話|Tel|Fax)/i.test(line)) return "consumed";

  // Postal + address combined line
  if (/〒/.test(line) || POSTAL_RE.test(line)) return "address";

  // Company
  if (COMPANY_RE.test(line)) return "company";

  // Department / Position
  if (DEPARTMENT_RE.test(line) || POSITION_RE.test(line))
    return "department_position";

  // Full katakana line → furigana name
  if (KATAKANA_LINE_RE.test(line)) return "katakana_name";

  // Address (contains geographic keywords and is reasonably long)
  if (ADDRESS_RE.test(line) && line.length >= 5) return "address";

  // Kanji name heuristic: short line with CJK, contains space, not matching other patterns
  const stripped = line.replace(/\s+/g, "");
  if (
    stripped.length >= 2 &&
    stripped.length <= 8 &&
    /[\u4e00-\u9fff]/.test(line) &&
    /\s/.test(line)
  ) {
    return "kanji_name";
  }

  return "unknown";
}

// --- Field splitting helpers ---

function splitDepartmentAndPosition(line: string): {
  department: string;
  position: string;
} {
  const match = line.match(POSITION_RE);
  if (!match || match.index === undefined) {
    return { department: line.trim(), position: "" };
  }

  const department = line.slice(0, match.index).trim();
  const position = match[0];
  return { department, position };
}

function splitName(line: string): { lastName: string; firstName: string } {
  const parts = line.trim().split(/[\s　]+/);
  if (parts.length >= 2) {
    return { lastName: parts[0], firstName: parts.slice(1).join(" ") };
  }
  return { lastName: parts[0] || "", firstName: "" };
}

function splitKanaName(line: string): {
  lastNameKana: string;
  firstNameKana: string;
} {
  const parts = line.trim().split(/[\s　]+/);
  if (parts.length >= 2) {
    return { lastNameKana: parts[0], firstNameKana: parts.slice(1).join(" ") };
  }
  return { lastNameKana: parts[0] || "", firstNameKana: "" };
}

// --- Main parser ---

export function parseOcrText(text: string): Partial<BusinessCardFormData> {
  const result: Partial<BusinessCardFormData> = {};
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Phase 1: Extract structured data from full text (regex-based)

  const emailMatch = text.match(EMAIL_RE);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatches = text.match(PHONE_RE);
  if (phoneMatches) {
    const mobileIdx = phoneMatches.findIndex((p) =>
      /^0[789]0/.test(p.replace(/[-−ー]/g, ""))
    );
    if (mobileIdx >= 0) {
      result.mobile = phoneMatches[mobileIdx];
      const landline = phoneMatches.find((_, i) => i !== mobileIdx);
      if (landline) result.phone = landline;
    } else {
      result.phone = phoneMatches[0];
      if (phoneMatches[1]) result.mobile = phoneMatches[1];
    }
  }

  const urlMatch = text.match(URL_RE);
  if (urlMatch) result.website = urlMatch[0];

  const postalMatch = text.match(POSTAL_RE);
  if (postalMatch) result.postalCode = postalMatch[1];

  // Phase 2: Classify each line
  const consumedValues = Object.values(result).filter(Boolean).map(String);

  const classified = lines.map((line) => ({
    type: classifyLine(line, consumedValues),
    raw: line,
  }));

  // Phase 3: Assign fields from classifications

  // Company
  const companyLine = classified.find((c) => c.type === "company");
  if (companyLine) result.company = companyLine.raw;

  // Department + Position
  const deptLines = classified.filter(
    (c) => c.type === "department_position"
  );
  if (deptLines.length > 0) {
    const combined = deptLines.map((d) => d.raw).join(" ");
    const { department, position } = splitDepartmentAndPosition(combined);
    result.department = department;
    if (position) result.position = position;
  }

  // Kanji name
  const kanjiNameLine = classified.find((c) => c.type === "kanji_name");
  if (kanjiNameLine) {
    const { lastName, firstName } = splitName(kanjiNameLine.raw);
    result.lastName = lastName;
    result.firstName = firstName;
  }

  // Katakana name (furigana)
  const kataNameLine = classified.find((c) => c.type === "katakana_name");
  if (kataNameLine) {
    const { lastNameKana, firstNameKana } = splitKanaName(kataNameLine.raw);
    result.lastNameKana = lastNameKana;
    result.firstNameKana = firstNameKana;
  }

  // Address: extract from postal/address lines, removing postal code prefix
  const addressLines = classified.filter((c) => c.type === "address");
  if (addressLines.length > 0) {
    const fullAddress = addressLines
      .map((a) => a.raw.replace(/〒?\s*\d{3}[-−ー]\d{4}\s*/, "").trim())
      .filter(Boolean)
      .join(" ");
    if (fullAddress) result.address = fullAddress;
  }

  // Phase 4: Fallback — try unknown lines for missing fields
  const unknowns = classified.filter((c) => c.type === "unknown");

  if (!result.lastName && unknowns.length > 0) {
    // Pick shortest unknown line as potential name
    const sorted = [...unknowns].sort((a, b) => a.raw.length - b.raw.length);
    const candidate = sorted[0];
    if (candidate.raw.length <= 10 && /[\u4e00-\u9fff]/.test(candidate.raw)) {
      const { lastName, firstName } = splitName(candidate.raw);
      result.lastName = lastName;
      result.firstName = firstName;
    }
  }

  if (!result.company && unknowns.length > 0) {
    // Pick longest remaining unknown as potential company
    const remaining = unknowns.filter(
      (u) => u.raw !== result.lastName && u.raw !== result.firstName
    );
    if (remaining.length > 0) {
      const sorted = [...remaining].sort(
        (a, b) => b.raw.length - a.raw.length
      );
      result.company = sorted[0].raw;
    }
  }

  return result;
}

export function mergeOcrResult(
  ocrData: Partial<BusinessCardFormData>
): BusinessCardFormData {
  return { ...emptyFormData, ...ocrData };
}
