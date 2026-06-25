import { convertFileSrc } from "@tauri-apps/api/core";
import type { FileEntry } from "../../ipc/bindings";
import { useSettingsStore } from "../../stores/settingsStore";
import { readRemotePreview } from "./fileApi";
import { exceedsPreviewThreshold, imageMimeType, isGridImageFile, LOCAL_CONNECTION_ID, resolvePreviewReadMaxBytes } from "./utils";

/** 网格单元 48px，2x 屏足够 */
export const THUMB_MAX_PX = 96;
/** 远程预览上限：大图只读头部，失败则回退图标 */
export const THUMB_MAX_BYTES = 384 * 1024;
export const MAX_THUMB_CACHE = 160;
const MAX_CONCURRENT = 3;

const RASTER_EXT = new Set(["png", "jpg", "jpeg", "webp"]);

const thumbCache = new Map<string, string>();
const thumbFailed = new Set<string>();
const inflight = new Map<string, Promise<string | null>>();

let activeLoads = 0;
const waitQueue: Array<() => void> = [];

function thumbKey(connectionId: string, path: string): string {
  return `${connectionId}\0${path}`;
}

function runQueued<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeLoads += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          activeLoads -= 1;
          const next = waitQueue.shift();
          if (next) next();
        });
    };
    if (activeLoads < MAX_CONCURRENT) run();
    else waitQueue.push(run);
  });
}

function cacheThumbnail(key: string, url: string) {
  if (thumbCache.has(key)) {
    thumbCache.delete(key);
  }
  thumbCache.set(key, url);
  while (thumbCache.size > MAX_THUMB_CACHE) {
    const oldest = thumbCache.keys().next().value;
    if (!oldest) break;
    const oldUrl = thumbCache.get(oldest);
    if (oldUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(oldUrl);
    }
    thumbCache.delete(oldest);
  }
}

export function getCachedThumbnailUrl(connectionId: string, path: string): string | null {
  return thumbCache.get(thumbKey(connectionId, path)) ?? null;
}

function markThumbFailed(key: string) {
  thumbFailed.add(key);
  while (thumbFailed.size > MAX_THUMB_CACHE) {
    const oldest = thumbFailed.values().next().value;
    if (!oldest) break;
    thumbFailed.delete(oldest);
  }
}

function fileExceedsPreviewThreshold(entry: FileEntry): boolean {
  const threshold = useSettingsStore.getState().filePreviewThresholdBytes;
  return exceedsPreviewThreshold(entry.size, threshold);
}

function shouldDownscale(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return RASTER_EXT.has(ext);
}

export function downscaleImageUrl(src: string, maxPx = THUMB_MAX_PX): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const longest = Math.max(img.naturalWidth, img.naturalHeight, 1);
      const scale = Math.min(1, maxPx / longest);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(URL.createObjectURL(blob));
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function finalizeRasterUrl(sourceUrl: string, name: string, cacheKey: string): Promise<string | null> {
  if (!shouldDownscale(name)) {
    cacheThumbnail(cacheKey, sourceUrl);
    return sourceUrl;
  }
  const scaled = await downscaleImageUrl(sourceUrl);
  if (sourceUrl.startsWith("blob:")) {
    URL.revokeObjectURL(sourceUrl);
  }
  if (scaled) {
    cacheThumbnail(cacheKey, scaled);
    return scaled;
  }
  cacheThumbnail(cacheKey, sourceUrl);
  return sourceUrl;
}

async function loadThumbnailUrl(connectionId: string, entry: FileEntry): Promise<string | null> {
  if (entry.kind !== "file" || !isGridImageFile(entry.name)) {
    return null;
  }
  const key = thumbKey(connectionId, entry.path);
  if (thumbFailed.has(key)) return null;

  const cached = thumbCache.get(key);
  if (cached) return cached;

  try {
    if (fileExceedsPreviewThreshold(entry)) {
      markThumbFailed(key);
      return null;
    }

    if (connectionId === LOCAL_CONNECTION_ID) {
      const src = convertFileSrc(entry.path);
      if (!shouldDownscale(entry.name)) {
        cacheThumbnail(key, src);
        return src;
      }
      return await finalizeRasterUrl(src, entry.name, key);
    }

    const threshold = useSettingsStore.getState().filePreviewThresholdBytes;
    const readMaxBytes = resolvePreviewReadMaxBytes(entry.size, threshold);
    const bytes = await readRemotePreview(connectionId, entry.path, readMaxBytes);
    const blob = new Blob([new Uint8Array(bytes)], { type: imageMimeType(entry.name) });
    const objectUrl = URL.createObjectURL(blob);
    return await finalizeRasterUrl(objectUrl, entry.name, key);
  } catch {
    markThumbFailed(key);
    return null;
  }
}

export function resolveThumbnailUrl(
  connectionId: string,
  entry: FileEntry,
): Promise<string | null> {
  if (entry.kind !== "file" || !isGridImageFile(entry.name)) {
    return Promise.resolve(null);
  }
  const key = thumbKey(connectionId, entry.path);
  const cached = thumbCache.get(key);
  if (cached) return Promise.resolve(cached);

  let pending = inflight.get(key);
  if (!pending) {
    pending = runQueued(() => loadThumbnailUrl(connectionId, entry))
      .catch(() => null)
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, pending);
  }
  return pending;
}
