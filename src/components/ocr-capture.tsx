"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { recognizeImage, OcrProgress } from "@/lib/ocr";
import { parseOcrText, mergeOcrResult } from "@/lib/ocr-parser";
import { compressImage } from "@/lib/image-compress";
import { BusinessCardFormData } from "@/types/business-card";

interface OcrCaptureProps {
  onComplete: (data: BusinessCardFormData, imageUrl: string) => void;
}

export function OcrCapture({ onComplete }: OcrCaptureProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target?.result as string;
      const compressed = await compressImage(raw);
      setImagePreview(compressed);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setProgress(null);
    try {
      const text = await recognizeImage(file, setProgress);
      const parsed = parseOcrText(text);
      const formData = mergeOcrResult(parsed);
      onComplete(formData, imagePreview!);
    } catch {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setFile(null);
    setProgress(null);
  };

  const progressPercent = progress
    ? Math.round(progress.progress * 100)
    : 0;

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
                  名刺を解析中... {progressPercent}%
                </p>
              </div>
            )}
          </div>

          {analyzing && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
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
