import { downloadAndStoreCover } from '../src/lib/enrich/cover';
import fs from 'node:fs';

const MISSING = [
  { slug: 'magical-girl-lyrical-nanoha-exceeds-gun-blaze-vengeance', title: 'Magical Girl Lyrical Nanoha EXCEEDS', alt: ['Mahou Shoujo Lyrical Nanoha Exceeds', 'Nanoha Exceeds'] },
  { slug: 'dodgeball-girl-danko-honoo-no-toukyuujo-dodge-danko', title: 'Dodge Danko', alt: ['Honoo no Toukyuujo Dodge Danko', 'Dodgeball Girl Danko'] },
  { slug: 'thunder-3', title: 'Thunder 3', alt: ['Thunder3', 'Sandaa 3'] },
  { slug: 'the-ribbon-hero', title: 'The Ribbon Hero', alt: ['Ribbon no Kishi', 'Princess Knight anime'] },
  { slug: 'pok-mon-horizons', title: 'Pokemon Horizons', alt: ['Pocket Monsters 2023', 'Poketto Monsutaa 2023'] },
];

async function tryKitsu(title: string): Promise<string | null> {
  try {
    const r = await fetch(`https://kitsu.app/api/edge/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`);
    if (!r.ok) return null;
    const j = await r.json() as any;
    const a = j.data?.[0];
    return a?.attributes?.posterImage?.large ?? a?.attributes?.coverImage?.large ?? null;
  } catch { return null; }
}

async function tryTVMaze(title: string): Promise<string | null> {
  try {
    const r = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`);
    if (!r.ok) return null;
    const j = await r.json() as any[];
    return j?.[0]?.show?.image?.original ?? null;
  } catch { return null; }
}

async function main() {
  const cache = JSON.parse(fs.readFileSync('.cache/enrichment.json', 'utf8'));
  let added = 0;
  for (const show of MISSING) {
    console.log(`[${show.slug}]`);
    let coverUrl: string | null = null;
    for (const title of [show.title, ...show.alt]) {
      console.log(`  trying kitsu: ${title}`);
      coverUrl = await tryKitsu(title);
      if (coverUrl) { console.log(`  kitsu hit: ${coverUrl.slice(0,60)}`); break; }
      await new Promise(r => setTimeout(r, 300));
    }
    if (!coverUrl) {
      for (const title of [show.title, ...show.alt]) {
        console.log(`  trying tvmaze: ${title}`);
        coverUrl = await tryTVMaze(title);
        if (coverUrl) { console.log(`  tvmaze hit: ${coverUrl.slice(0,60)}`); break; }
        await new Promise(r => setTimeout(r, 300));
      }
    }
    if (coverUrl) {
      const cp = await downloadAndStoreCover(coverUrl, show.slug);
      if (cp) { cache[show.slug].coverPath = cp; added++; console.log(`  saved: ${cp}`); }
    } else { console.log(`  no cover found`); }
  }
  fs.writeFileSync('.cache/enrichment.json', JSON.stringify(cache, null, 2));
  console.log(`\nAdded ${added} covers.`);
}
main();