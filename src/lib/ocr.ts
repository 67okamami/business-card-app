import Tesseract from "tesseract.js";

export interface OcrProgress {
  status: string;
  progress: number;
}

export async function recognizeImage(
  image: File | string,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  const result = await Tesseract.recognize(image, "jpn+eng", {
    logger: (m) => {
      if (m.status && onProgress) {
        onProgress({
          status: m.status,
          progress: typeof m.progress === "number" ? m.progress : 0,
        });
      }
    },
  });
  return result.data.text;
}
