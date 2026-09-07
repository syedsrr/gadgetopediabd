import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "product-images";
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
/** Signed links are long-lived so storefront <img> tags keep working. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

export type UploadedImage = { url: string; path: string };

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: only JPG, PNG, WebP or AVIF images are allowed.`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name}: image must be smaller than 8 MB.`;
  }
  return null;
}

/** Longest side kept for product photos — plenty for the zoomed detail view. */
const MAX_SIDE = 1400;
/** Target weight per photo; quality is only lowered until this is met. */
const TARGET_BYTES = 170_000;

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Resizes and re-encodes uploads to WebP in the browser so storefront photos
 * stay light. Quality steps down gradually and stops as soon as the image is
 * small enough, so visible quality is preserved.
 */
async function optimize(file: File, maxSide = MAX_SIDE): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d", { alpha: file.type === "image/png" });
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    let best: Blob | null = null;
    for (const quality of [0.88, 0.82, 0.76, 0.7]) {
      const blob = await encode(canvas, "image/webp", quality);
      if (!blob) break;
      best = blob;
      if (blob.size <= TARGET_BYTES) break;
    }

    return best && best.size < file.size ? best : file;
  } catch {
    return file;
  }
}

export async function uploadProductImage(file: File): Promise<UploadedImage> {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);

  const blob = await optimize(file);
  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data?.signedUrl) throw new Error("Could not create the image link");

  return { url: data.signedUrl, path };
}

export async function removeStoredImage(url: string) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export function storagePathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length).split("?")[0] ?? null;
}
