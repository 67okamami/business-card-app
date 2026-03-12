"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BusinessCardForm } from "@/components/business-card-form";
import { OcrCapture } from "@/components/ocr-capture";

import { BusinessCardFormData } from "@/types/business-card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function NewCardContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get("method") ?? "manual";
  const [ocrData, setOcrData] = useState<BusinessCardFormData | null>(null);
  const [ocrImage, setOcrImage] = useState<string>("");

  const isOcr = method === "ocr";
  const showForm = !isOcr || ocrData !== null;

  const handleOcrComplete = (data: BusinessCardFormData, imageUrl: string) => {
    setOcrData(data);
    setOcrImage(imageUrl);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full p-1 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">
            {isOcr ? "写真から作成" : "名刺登録"}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[700px] p-4">
        {isOcr && !ocrData && <OcrCapture onComplete={handleOcrComplete} />}

        {showForm && (
          <BusinessCardForm
            initialData={ocrData ?? undefined}
            imageUrl={ocrImage || undefined}
          />
        )}
      </main>
    </div>
  );
}

export default function NewCardPage() {
  return (
    <Suspense>
      <NewCardContent />
    </Suspense>
  );
}
