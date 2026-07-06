import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const COVERS_DIR = path.resolve(process.cwd(), 'public', 'covers');
const PUBLIC_COVER_PREFIX = '/covers/';

async function ensureCoversDir(): Promise<void> {
  if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });
}

export async function downloadAndStoreCover(
  coverUrl: string,
  slug: string,
): Promise<string | null> {
  try {
    await ensureCoversDir();
    const res = await fetch(coverUrl, { redirect: 'follow' });
    if (!res.ok) throw new Error(`cover HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const outPath = path.join(COVERS_DIR, `${slug}.webp`);
    await sharp(buf).webp({ quality: 80 }).toFile(outPath);
    return `${PUBLIC_COVER_PREFIX}${slug}.webp`;
  } catch (err) {
    console.warn(`[enrich.cover] failed for ${slug}: ${(err as Error).message}`);
    return null;
  }
}