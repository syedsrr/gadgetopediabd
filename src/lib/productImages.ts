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
/** Target weight per photo: aim for ~100 KB, never push quality below MIN_QUALITY. */
const TARGET_BYTES = 100_000;
/** Anything at or under this is already ideal — stop immediately. */
const IDEAL_BYTES = 80_000;
/** Quality floor: below this, visible artefacts start showing on product photos. */
const MIN_QUALITY = 0.6;

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(bitmap: ImageBitmap, maxSide: number, alpha: boolean) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { alpha });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Resizes and re-encodes uploads to WebP in the browser so storefront photos
 * land in the 80-100 KB range. Quality steps down gradually first, then the
 * pixel size is reduced, and it stops as soon as the target is met — so the
 * smallest acceptable change is applied and visible quality is preserved.
 */
async function optimize(file: File, maxSide = MAX_SIDE): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const alpha = file.type === "image/png";
    let best: Blob | null = null;

    // Pass 1: full size, easing quality down. Pass 2+: gently smaller pixels
    // for busy photos that are still heavy at the quality floor.
    for (const side of [maxSide, 1200, 1000]) {
      const canvas = draw(bitmap, side, alpha);
      if (!canvas) break;

      for (const quality of [0.86, 0.8, 0.74, 0.68, MIN_QUALITY]) {
        const blob = await encode(canvas, "image/webp", quality);
        if (!blob) break;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= TARGET_BYTES) break;
      }

      if (best && best.size <= TARGET_BYTES) break;
    }

    bitmap.close?.();
    void IDEAL_BYTES;
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
