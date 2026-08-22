/** Formats whole seconds as "m:ss" (or "h:mm:ss" past an hour), the format
 *  used across voice notes and call timers. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export class MediaTooLargeError extends Error {
  constructor(limitMb: number) {
    super(`File is larger than ${limitMb}MB.`);
  }
}

/** Downscales + re-encodes an image client-side before it's base64'd into
 *  the chat payload, since Stage 1 has no object storage — see
 *  backend/prisma/schema.prisma Message.mediaUrl. Keeps the "Great photos
 *  straight from your camera roll" case from blowing past the 12mb body
 *  limit in main.ts. */
export async function compressImageToDataUrl(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {},
): Promise<{ dataUrl: string; mimeType: string }> {
  const { maxDimension = 1600, quality = 0.82 } = opts;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const mimeType = "image/jpeg";
  const dataUrl = canvas.toDataURL(mimeType, quality);
  return { dataUrl, mimeType };
}

export function assertUnderLimit(sizeBytes: number, limitMb: number) {
  if (sizeBytes > limitMb * 1024 * 1024) throw new MediaTooLargeError(limitMb);
}

/** Decodes an audio blob into ~40 normalized amplitude bars for a static
 *  waveform, so a voice note bubble shows the real shape of the recording
 *  instead of a generic looping animation. Falls back to a deterministic
 *  pseudo-random shape (seeded by byte length) if decoding fails — some
 *  browsers can't decode the exact codec a MediaRecorder produced. */
export async function computeWaveformPeaks(blob: Blob, bars = 40): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const channel = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channel.length / bars));
    const peaks: number[] = [];
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) sum += Math.abs(channel[start + j] ?? 0);
      peaks.push(sum / blockSize);
    }
    ctx.close();
    const max = Math.max(...peaks, 0.001);
    return peaks.map((p) => Math.max(0.08, p / max));
  } catch {
    return seededPeaks(blob.size, bars);
  }
}

function seededPeaks(seed: number, bars: number): number[] {
  let s = seed || 1;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: bars }, () => 0.15 + rand() * 0.85);
}
