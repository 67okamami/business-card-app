/**
 * JPX上場銘柄一覧ExcelからJSON（会社名→証券コード）を生成するスクリプト
 * 出力: src/lib/data/listed-companies.json
 */

import { createRequire } from "module";
import { createWriteStream, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT_FILE = resolve(__dirname, "data_j.xls");
const OUTPUT_FILE = resolve(__dirname, "../src/lib/data/listed-companies.json");

function normalizeKeys(name) {
  if (!name) return [];
  const keys = new Set();
  keys.add(name.trim());
  const patterns = [
    /^株式会社(.+)$/, /^（株）(.+)$/, /^\(株\)(.+)$/,
    /^(.+)株式会社$/, /^(.+)（株）$/, /^(.+)\(株\)$/,
  ];
  for (const pattern of patterns) {
    const m = name.match(pattern);
    if (m) keys.add(m[1].trim());
  }
  return [...keys];
}

try {
  const workbook = XLSX.readFile(INPUT_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let codeCol = -1, nameCol = -1, headerRow = -1;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] ?? "").trim();
      if (cell === "コード") { codeCol = j; headerRow = i; }
      if (cell === "銘柄名") nameCol = j;
    }
    if (codeCol !== -1 && nameCol !== -1) break;
  }

  if (codeCol === -1 || nameCol === -1) {
    console.error("「コード」または「銘柄名」列が見つかりませんでした。");
    process.exit(1);
  }

  const result = {};
  let count = 0;
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const code = String(row[codeCol] ?? "").trim();
    const name = String(row[nameCol] ?? "").trim();
    if (!code || !name || code === "コード") continue;
    for (const key of normalizeKeys(name)) {
      if (key) result[key] = code;
    }
    count++;
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  const stream = createWriteStream(OUTPUT_FILE);
  stream.write(JSON.stringify(result, null, 2));
  stream.end();
  console.log(`✅ ${count}社の証券コードを書き出しました → ${OUTPUT_FILE}`);
} catch (err) {
  if (err.code === "ENOENT") {
    console.error(`❌ ファイルが見つかりません: ${INPUT_FILE}`);
  } else {
    console.error("❌ エラー:", err.message);
  }
  process.exit(1);
}
