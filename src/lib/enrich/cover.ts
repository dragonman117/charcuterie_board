import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const COVERS_DIR = path.resolve(process.cwd(), 'public', 'covers');
const PUBLIC_COVER_PREFIX = '/covers/';

async function ensureCoversDir(seasonSlug: string): Promise<string> {
  const dir = path.join(COVERS_DIR, seasonSlug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function committedCoverPath(seasonSlug: string, showSlug: string): string | null {
  const filePath = path.join(COVERS_DIR, seasonSlug, `${showSlug}.webp`);
  if (!fs.existsSync(filePath)) return null;
  return `${PUBLIC_COVER_PREFIX}${seasonSlug}/${showSlug}.webp`;
}

export async function downloadAndStoreCover(
  coverUrl: string,
  seasonSlug: string,
  showSlug: string,
): Promise<string | null> {
  try {
    const dir = await ensureCoversDir(seasonSlug);
    const res = await fetch(coverUrl, { redirect: 'follow' });
    if (!res.ok) throw new Error(`cover HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const outPath = path.join(dir, `${showSlug}.webp`);
    await sharp(buf).webp({ quality: 80 }).toFile(outPath);
    return `${PUBLIC_COVER_PREFIX}${seasonSlug}/${showSlug}.webp`;
  } catch (err) {
    console.warn(`[enrich.cover] failed for ${seasonSlug}/${showSlug}: ${(err as Error).message}`);
    return null;
  }
}