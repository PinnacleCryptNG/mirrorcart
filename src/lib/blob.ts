import "server-only";
import { put, del, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/**
 * Stores selfies and copied YouCam results. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise writes to public/_local-blob (dev only; ignored by git).
 */
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), "public", "_local-blob");

export const blobBackend = useBlob ? "vercel-blob" : "local-fs";

export async function putImage(pathname: string, data: Buffer | ArrayBuffer, contentType = "image/jpeg"): Promise<string> {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (useBlob) {
    const r = await put(pathname, buf, { access: "public", contentType, addRandomSuffix: true });
    return r.url;
  }
  const safe = pathname.replace(/[^a-zA-Z0-9/_.-]/g, "_");
  const file = path.join(LOCAL_DIR, safe);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buf);
  return `/_local-blob/${safe}`;
}

export async function deleteImages(urls: string[]) {
  const remote = urls.filter((u) => /^https?:\/\//.test(u) && u.includes("blob.vercel-storage.com"));
  const local = urls.filter((u) => u.startsWith("/_local-blob/"));
  if (useBlob && remote.length) await del(remote);
  await Promise.all(local.map((u) => fs.rm(path.join(process.cwd(), "public", u), { force: true })));
}

/** Delete everything under a prefix (e.g. a selfie's folder). */
export async function deletePrefix(prefix: string) {
  if (useBlob) {
    let cursor: string | undefined;
    do {
      const r = await list({ prefix, cursor, limit: 1000 });
      if (r.blobs.length) await del(r.blobs.map((b) => b.url));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return;
  }
  await fs.rm(path.join(LOCAL_DIR, prefix), { recursive: true, force: true });
}

export async function readImage(url: string, origin?: string): Promise<Buffer> {
  if (url.startsWith("/")) {
    try { return await fs.readFile(path.join(process.cwd(), "public", url)); } catch { /* fall through to fetch */ }
    if (!origin) throw new Error(`Cannot read ${url}`);
    url = new URL(url, origin).toString();
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Retention helper: delete blobs under a prefix uploaded before `cutoff` (epoch ms). Returns count. */
export async function deleteOlderThan(prefix: string, cutoff: number): Promise<number> {
  let n = 0;
  if (useBlob) {
    let cursor: string | undefined;
    do {
      const r = await list({ prefix, cursor, limit: 1000 });
      const old = r.blobs.filter((b) => new Date(b.uploadedAt).getTime() < cutoff).map((b) => b.url);
      if (old.length) { await del(old); n += old.length; }
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return n;
  }
  const root = path.join(LOCAL_DIR, prefix);
  const walk = async (dir: string): Promise<void> => {
    let entries: import("fs").Dirent[] = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) await walk(f);
      else if ((await fs.stat(f)).mtimeMs < cutoff) { await fs.rm(f, { force: true }); n++; }
    }
  };
  await walk(root);
  return n;
}
