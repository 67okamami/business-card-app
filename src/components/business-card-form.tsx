"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BusinessCardFormData, emptyFormData } from "@/types/business-card";
import { saveCard, updateCard } from "@/lib/storage";
import { toast } from "@/components/ui/toast";
import { OcrConfidence } from "@/lib/ocr";

interface BusinessCardFormProps {
  initialData?: BusinessCardFormData;
  editId?: string;
  imageUrl?: string;
  ocrConfidence?: OcrConfidence;
}

interface FieldDef {
  key: keyof BusinessCardFormData;
  label: string;
  type?: string;
  placeholder?: string;
  half?: boolean;
  multiline?: boolean;
  shortWidth?: boolean;
}

const fields: FieldDef[] = [
  { key: "lastName", label: "姓", placeholder: "佐藤", half: true },
  { key: "firstName", label: "名", placeholder: "健太", half: true },
  { key: "lastNameKana", label: "姓（カナ）", placeholder: "サトウ", half: true },
  { key: "firstNameKana", label: "名（カナ）", placeholder: "ケンタ", half: true },
  { key: "company", label: "会社名", placeholder: "ABC株式会社" },
  { key: "department", label: "部署", placeholder: "営業部", half: true },
  { key: "position", label: "役職", placeholder: "部長", half: true },
  { key: "email", label: "メールアドレス", type: "email", placeholder: "sato@example.com" },
  { key: "phone", label: "電話番号", type: "tel", placeholder: "03-1234-5678", half: true },
  { key: "mobile", label: "携帯番号", type: "tel", placeholder: "090-1234-5678", half: true },
  { key: "postalCode", label: "郵便番号", placeholder: "100-0001", shortWidth: true },
  { key: "address", label: "住所", placeholder: "東京都千代田区..." },
  { key: "website", label: "関連サイト", placeholder: "https://example.com" },
  { key: "notes", label: "メモ", placeholder: "商談メモなど", multiline: true },
];

/**
 * 確信度に応じたスタイル情報を返す
 * - 高確信度（80%以上）: 緑
 * - 中確信度（50-79%）: 黄
 * - 低確信度（50%未満）: 赤
 * - 空欄: アンバー（読み取れなかった警告）
 */
function getConfidenceStyle(confidence: number | undefined, hasValue: boolean) {
  if (!hasValue) {
    return {
      inputClass: "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
      label: "読み取れませんでした",
      labelClass: "text-amber-600 dark:text-amber-400",
      dotClass: "",
    };
  }
  if (confidence === undefined) return null;

  if (confidence >= 80) {
    return {
      inputClass: "border-green-400 bg-green-50 dark:bg-green-950/20",
      label: `${confidence}%`,
      labelClass: "text-green-600 dark:text-green-400",
      dotClass: "bg-green-500",
    };
  }
  if (confidence >= 50) {
    return {
      inputClass: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20",
      label: `${confidence}%`,
      labelClass: "text-yellow-600 dark:text-yellow-500",
      dotClass: "bg-yellow-500",
    };
  }
  return {
    inputClass: "border-red-400 bg-red-50 dark:bg-red-950/20",
    label: `${confidence}%`,
    labelClass: "text-red-600 dark:text-red-400",
    dotClass: "bg-red-500",
  };
}

export function BusinessCardForm({
  initialData,
  editId,
  imageUrl,
  ocrConfidence,
}: BusinessCardFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BusinessCardFormData>(
    initialData ?? emptyFormData
  );
  const isOcrMode = !!initialData && !editId;

  const handleChange = (
    key: keyof BusinessCardFormData,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lastName.trim() && !form.firstName.trim()) {
      toast("姓または名を入力してください");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, imageUrl: imageUrl ?? form.imageUrl };

      if (editId) {
        await updateCard(editId, data);
        toast("名刺を更新しました");
        router.push(`/cards/${editId}`);
      } else {
        const card = await saveCard(data);
        toast("名刺を登録しました");
        router.push(`/cards/${card.id}`);
      }
    } catch {
      toast("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {imageUrl && (
        <div className="mb-4">
          <img
            src={imageUrl}
            alt="名刺画像"
            className="w-full max-h-48 object-contain rounded-lg border border-border"
          />
        </div>
      )}

      {isOcrMode && ocrConfidence && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
          <span className="font-medium">読み取り確信度:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            高（80%〜）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
            中（50〜79%）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            低（〜49%）
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => {
          const gridClass =
            f.half || f.shortWidth ? "" : "md:col-span-2";

          const hasValue = !!form[f.key].trim();
          const confidenceVal = ocrConfidence?.[f.key];
          const style =
            isOcrMode
              ? getConfidenceStyle(confidenceVal, hasValue)
              : null;

          return (
            <div key={f.key} className={gridClass}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {f.label}
                {style && (
                  <span className={`ml-2 text-xs font-normal ${style.labelClass}`}>
                    {style.dotClass && (
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dotClass} mr-1 align-middle`} />
                    )}
                    {style.label}
                  </span>
                )}
              </label>
              {f.multiline ? (
                <Textarea
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  maxLength={500}
                  className="md:col-span-2"
                />
              ) : (
                <Input
                  type={f.type ?? "text"}
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  maxLength={100}
                  className={style?.inputClass ?? ""}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
