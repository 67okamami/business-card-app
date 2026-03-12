"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BusinessCardFormData, emptyFormData } from "@/types/business-card";
import { saveCard, updateCard } from "@/lib/storage";
import { toast } from "@/components/ui/toast";

interface BusinessCardFormProps {
  initialData?: BusinessCardFormData;
  editId?: string;
  imageUrl?: string;
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
  { key: "website", label: "Webサイト", type: "url", placeholder: "https://example.com" },
  { key: "notes", label: "メモ", placeholder: "商談メモなど", multiline: true },
];

export function BusinessCardForm({
  initialData,
  editId,
  imageUrl,
}: BusinessCardFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BusinessCardFormData>(
    initialData ?? emptyFormData
  );

  const handleChange = (
    key: keyof BusinessCardFormData,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, imageUrl: imageUrl ?? form.imageUrl };

    if (editId) {
      updateCard(editId, data);
      toast("名刺を更新しました");
      router.push(`/cards/${editId}`);
    } else {
      const card = saveCard(data);
      toast("名刺を登録しました");
      router.push(`/cards/${card.id}`);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => {
          const gridClass =
            f.half || f.shortWidth ? "" : "md:col-span-2";

          return (
            <div key={f.key} className={gridClass}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {f.label}
              </label>
              {f.multiline ? (
                <Textarea
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className="md:col-span-2"
                />
              ) : (
                <Input
                  type={f.type ?? "text"}
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
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
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
