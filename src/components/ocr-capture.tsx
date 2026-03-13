"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { analyzeBusinessCard, OcrConfidence } from "@/lib/ocr";
import { compressImage } from "@/lib/image-compress";
import { BusinessCardFormData } from "@/types/business-card";

interface OcrCaptureProps {
  onComplete: (data: BusinessCardFormData, imageUrl: string, confidence: OcrConfidence) => void;
}

export function OcrCapture({ onComplete }: OcrCaptureProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target?.result as string;
      const compressed = await compressImage(raw);
      setImagePreview(compressed);
      setError(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setError(null);
    try {
      const { formData, confidence } = await analyzeBusinessCard(imagePreview);
      onComplete(formData, imagePreview, confidence);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました");
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!imagePreview ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border p-10">
          <Camera className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            名刺を撮影またはファイルから選択
          </p>
          <Button onClick={() => cameraRef.current?.click()}>
            <Camera className="mr-2 h-4 w-4" />
            名刺を撮影
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            ファイルから選択
          </Button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={imagePreview}
              alt="名刺プレビュー"
              className="w-full rounded-lg border border-border object-contain max-h-64"
            />
            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="mt-2 text-sm font-medium text-white">
                  AIが名刺を解析中...
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {!analyzing && (
            <>
              <Button onClick={handleAnalyze} className="w-full" size="lg">
                解析する
              </Button>
              <button
                type="button"
                onClick={handleReset}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                撮り直す
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
