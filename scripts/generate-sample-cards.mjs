import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "samples");
mkdirSync(outDir, { recursive: true });

const cards = [
  {
    company: "株式会社テクノフューチャー",
    department: "開発本部 第一開発部",
    position: "シニアエンジニア",
    name: "田中 太郎",
    nameKana: "タナカ タロウ",
    postal: "〒100-0005",
    address: "東京都千代田区丸の内1-9-2",
    phone: "03-1234-5678",
    mobile: "090-1111-2222",
    email: "tanaka@technofuture.co.jp",
    website: "https://www.technofuture.co.jp",
  },
  {
    company: "グローバルメディア株式会社",
    department: "マーケティング部",
    position: "部長",
    name: "鈴木 美咲",
    nameKana: "スズキ ミサキ",
    postal: "〒150-0002",
    address: "東京都渋谷区渋谷2-15-1",
    phone: "03-9876-5432",
    mobile: "080-3333-4444",
    email: "m.suzuki@globalmedia.jp",
    website: "https://globalmedia.jp",
  },
  {
    company: "山田建設工業株式会社",
    department: "総務部 経理課",
    position: "課長",
    name: "高橋 健一",
    nameKana: "タカハシ ケンイチ",
    postal: "〒530-0001",
    address: "大阪府大阪市北区梅田3-3-10",
    phone: "06-6543-2100",
    mobile: "070-5555-6666",
    email: "takahashi@yamada-kensetsu.co.jp",
    website: "https://yamada-kensetsu.co.jp",
  },
  {
    company: "株式会社サンライズコンサルティング",
    department: "経営戦略室",
    position: "コンサルタント",
    name: "佐藤 花子",
    nameKana: "サトウ ハナコ",
    postal: "〒460-0008",
    address: "愛知県名古屋市中区栄4-1-8",
    phone: "052-123-4567",
    mobile: "090-7777-8888",
    email: "hanako.sato@sunrise-consul.com",
    website: "https://sunrise-consul.com",
  },
  {
    company: "北海道フーズ株式会社",
    department: "営業部 海外事業課",
    position: "主任",
    name: "渡辺 翔太",
    nameKana: "ワタナベ ショウタ",
    postal: "〒060-0042",
    address: "北海道札幌市中央区大通西5-8",
    phone: "011-222-3344",
    mobile: "080-9999-0000",
    email: "s.watanabe@hokkaido-foods.co.jp",
    website: "https://hokkaido-foods.co.jp",
  },
];

function drawCard(card, index) {
  const w = 910;
  const h = 550;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Subtle border
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // Accent line at top
  const accentColors = ["#1a56db", "#0d9488", "#b45309", "#7c3aed", "#dc2626"];
  ctx.fillStyle = accentColors[index];
  ctx.fillRect(0, 0, w, 6);

  // Company name
  ctx.fillStyle = "#333333";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(card.company, 50, 65);

  // Department & Position
  ctx.fillStyle = "#666666";
  ctx.font = "18px sans-serif";
  ctx.fillText(`${card.department}  ${card.position}`, 50, 105);

  // Name kana
  ctx.fillStyle = "#999999";
  ctx.font = "16px sans-serif";
  ctx.fillText(card.nameKana, 50, 165);

  // Name (large)
  ctx.fillStyle = "#111111";
  ctx.font = "bold 42px sans-serif";
  ctx.fillText(card.name, 50, 220);

  // Separator line
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 250);
  ctx.lineTo(w - 50, 250);
  ctx.stroke();

  // Contact info
  ctx.fillStyle = "#444444";
  ctx.font = "18px sans-serif";
  let y = 290;
  const lineH = 36;

  ctx.fillText(`${card.postal}  ${card.address}`, 50, y);
  y += lineH;
  ctx.fillText(`TEL: ${card.phone}    Mobile: ${card.mobile}`, 50, y);
  y += lineH;
  ctx.fillText(`E-mail: ${card.email}`, 50, y);
  y += lineH;
  ctx.fillText(`URL: ${card.website}`, 50, y);

  // Logo placeholder (company initial circle)
  const cx = w - 100;
  const cy = 80;
  ctx.beginPath();
  ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  ctx.fillStyle = accentColors[index];
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px sans-serif";
  const initial = card.company.replace(/株式会社/, "").charAt(0);
  const tw = ctx.measureText(initial).width;
  ctx.fillText(initial, cx - tw / 2, cy + 10);

  return canvas.toBuffer("image/png");
}

cards.forEach((card, i) => {
  const buf = drawCard(card, i);
  const filename = `sample_card_${i + 1}.png`;
  writeFileSync(join(outDir, filename), buf);
  console.log(`Generated: ${filename} - ${card.name} (${card.company})`);
});

console.log(`\nDone! ${cards.length} sample cards saved to public/samples/`);
