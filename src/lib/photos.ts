import { useEffect, useState } from "react";
import { db, newId } from "@/lib/db";
import type { Photo } from "@/types/domain";

export const MAX_SIDE = 1280;
export const JPEG_QUALITY = 0.72;

/** Fit (w, h) inside a square of `max` px on its longest side. */
export function fitWithin(w: number, h: number, max = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  if ("createImageBitmap" in window) {
    // imageOrientation "from-image" applies the EXIF rotation before we drop the metadata.
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Decode → downscale to ≤ 1280 px → re-encode as JPEG 0.72. Re-encoding through a canvas drops
 * all EXIF metadata, including GPS location. The original file is never stored.
 */
export async function compressPhoto(file: Blob): Promise<Blob> {
  const img = await decode(file);
  const { width, height } = fitWithin(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img.source, 0, 0, width, height);
  img.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode photo"))), "image/jpeg", JPEG_QUALITY),
  );
}

export async function savePhoto(kind: Photo["kind"], file: Blob): Promise<string> {
  const blob = await compressPhoto(file);
  const id = newId();
  await db.photos.add({ id, kind, blob, createdAt: new Date().toISOString() });
  return id;
}

/** An object URL for a stored photo, revoked on unmount. */
export function usePhotoUrl(id: string | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!id) return setUrl(undefined);
    let u: string | undefined;
    let alive = true;
    db.photos.get(id).then((p) => {
      if (!alive || !p) return;
      u = URL.createObjectURL(p.blob);
      setUrl(u);
    });
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  return url;
}
