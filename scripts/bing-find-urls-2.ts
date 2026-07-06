import fs from 'node:fs';
import { parseBoardFile } from '../src/lib/parseBoard';
import { loadCache, saveCache } from '../src/lib/enrich/cache';

const board = parseBoardFile('boards/Summer 2026.md', fs);
const allShows = board.categories.flatMap(c => c.shows);
const cache = loadCache();

const MIN_DELAY = 1500;
let lastCall = 0;
async function throttle() {
  const elapsed = Date.now() - lastCall;
  if (elapsed < MIN_DELAY) await new Promise(r => setTimeout(r, MIN_DELAY - elapsed));
  lastCall = Date.now();
}

async function bingSearch(query: string): Promise<string> {
  await throttle();
  const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!r.ok) return '';
    return await r.text();
  } catch { return ''; }
}

function extractCrunchyrollSeriesUrl(rss: string): string | null {
  const m = rss.match(/crunchyroll\.com\/series\/[A-Z0-9]+\/[a-z0-9-]+/i);
  return m ? `https://www.${m[0]}` : null;
}

function extractHidiveUrl(rss: string): string | null {
  const m = rss.match(/hidive\.com\/tv\/[a-z0-9-]+/i);
  return m ? `https://www.${m[0]}` : null;
}

const TITLE_OVERRIDES: Record<string, string[]> = {
  'tomb-raider-king': ['Tomb Raider King anime', 'Dogul Wang anime'],
  'trapped-in-a-dating-sim-the-world-of-otome-games-is-tough-for-mobs-season-2': ['Trapped in a Dating Sim anime', 'Otome Games Tough for Mobs anime'],
  'from-old-country-bumpkin-to-master-swordsman-season-2': ['Old Country Bumpkin Master Swordsman anime', 'Katakuria'],
  'the-exiled-heavy-knight-knows-how-to-game-the-system': ['Exiled Heavy Knight anime', 'Tsuihou no Heavy Knight'],
  'the-frontier-lord-begins-with-zero-subjects': ['Frontier Lord Zero Subjects anime', 'Henkyou Ryuushi Muryou'],
  'the-oblivious-saint-can-t-contain-her-power-the-unaware-saint-keeps-spreading-he': ['Oblivious Saint anime', 'Unaware Saint Blessings'],
  'from-overshadowed-to-overpowered-second-reincarnation-of-a-talentless-sage': ['From Overshadowed to Overpowered anime', 'Talentless Sage Reincarnation'],
  'heroine-saint-no-i-m-an-all-works-maid-and-proud-of-it': ['All-Works Maid anime', 'Heroine Saint Maid'],
  'the-world-s-strongest-rearguard-labyrinth-country-s-novice-seeker': ['Strongest Rearguard anime', 'Labyrinth Novice Seeker'],
  'though-i-am-an-inept-villainess': ['Inept Villainess anime'],
  'ascendance-of-a-bookworm-adopted-daughter-of-an-archduke': ['Ascendance Bookworm anime', 'Honzuki'],
  'jaadugar-a-witch-in-mongolia': ['Jaadugar Witch Mongolia anime'],
  'the-insipid-prince-s-furtive-grab-for-the-throne': ['Insipid Prince Furtive Throne anime', 'Buaki na Kouzoku'],
  'the-fake-alchemist': ['Fake Alchemist anime', 'Itan no Renkinjutsushi'],
  'red-river': ['Red River anime Crunchyroll', 'Sora no Kanata'],
  'the-classroom-of-a-black-cat-and-a-witch': ['Black Cat Witch Classroom anime'],
  'goodbye-lara-sayonara-lara': ['Goodbye Lara anime', 'Sayonara Lara anime'],
  'the-ogre-s-bride-oni-no-hanayome': ['Ogres Bride anime', 'Oni no Hanayome anime'],
  'a-livid-lady-s-guide-to-getting-even-how-i-crushed-my-homeland-with-my-mighty-gr': ['Livid Lady Guide Getting Even anime'],
  'rich-girl-caretaker-i-m-secretly-the-caregiver-of-the-most-popular-girl-in-this-': ['Rich Girl Caretaker anime'],
  'i-want-to-love-you-till-your-dying-day': ['I Want to Love You Till Dying Day anime'],
  'love-unseen-beneath-the-clear-night-sky': ['Love Unseen Clear Night Sky anime'],
  'the-100-girlfriends-who-really-really-really-really-really-love-you-season-3': ['100 Girlfriends anime Crunchyroll', 'Kimi no Koto ga Daisuki'],
  'hanazakari-no-kimitachi-e-hana-kimi-season-2': ['Hana-Kimi anime Crunchyroll', 'Hanazakari no Kimitachi e'],
  'young-ladies-don-t-play-fighting-games': ['Young Ladies Fighting Games anime', 'Ojou-sama no Tame'],
  'bleach-thousand-year-blood-war-part-4-the-calamity': ['Bleach Thousand Year Blood War Crunchyroll', 'Bleach TYBW anime'],
  'the-ghost-in-the-shell-2026-tv-series': ['Ghost in the Shell 2026 anime Crunchyroll', 'Koukaku Kidoutai 2026'],
  'sekiro-no-defeat': ['Sekiro No Defeat anime', 'Sekiro anime'],
  'magical-girl-lyrical-nanoha-exceeds-gun-blaze-vengeance': ['Magical Girl Nanoha Exceeds anime', 'Nanoha Gun Blaze'],
  'grow-up-show-sunflower-circus': ['Grow Up Show Sunflower Circus anime', 'GRO-W UP SHOW'],
  'chainsmoker-cat-yani-neko': ['Chainsmoker Cat anime', 'Yani Neko anime'],
  'a-gentle-noble-s-vacation-recommendation': ['Gentle Noble Vacation anime', 'Ojisama Vacation'],
  'bang-dream-yume-mita': ['BanG Dream Yumemita anime', 'Bandori Yumemita'],
  'dodgeball-girl-danko-honoo-no-toukyuujo-dodge-danko': ['Dodge Danko anime', 'Honoo no Toukyuujo'],
  'detective-conan-case-closed': ['Detective Conan Crunchyroll', 'Case Closed anime Crunchyroll'],
  'dr-stone-science-future': ['Dr Stone Science Future Crunchyroll', 'Dr Stone anime'],
  'gals-can-t-be-kind-to-otaku': ['Gals Can\'t Be Kind to Otaku anime', 'Gal to Otaku'],
  'grand-blue-dreaming-season-3': ['Grand Blue Dreaming anime Crunchyroll', 'Grand Blue Season 3'],
  'star-detective-precure': ['Star Detective Precure anime', 'Pretty Cure detective'],
  'one-piece': ['One Piece anime Crunchyroll'],
};

async function main() {
  const needsLookup = allShows.filter(s => {
    const e = cache[s.slug];
    if (!e) return false;
    if (e.resolvedUrl.includes('crunchyroll.com/') && !e.resolvedUrl.includes('/series/')) return true;
    if (e.resolvedUrl.includes('hidive.com/tv/')) return true;
    return false;
  });

  console.log(`Pass 2: Looking up ${needsLookup.length} shows with broader queries...`);
  let found = 0;
  let failed = 0;

  for (const show of needsLookup) {
    const overrides = TITLE_OVERRIDES[show.slug] ?? [];
    const queries = overrides.length > 0 ? overrides : [show.title.replace(/\s+Season\s+\d+.*$/i, '').replace(/\s+\(.*$/i, '').trim()];
    let realUrl: string | null = null;

    for (const q of queries) {
      const searchQ = `crunchyroll.com/series ${q}`;
      console.log(`[${show.slug}] ${searchQ}`);
      const rss = await bingSearch(searchQ);
      realUrl = extractCrunchyrollSeriesUrl(rss) ?? extractHidiveUrl(rss);
      if (realUrl) break;
    }

    if (realUrl) {
      cache[show.slug].resolvedUrl = realUrl;
      cache[show.slug].source = 'jikan';
      found++;
      console.log(`  -> ${realUrl}`);
    } else {
      console.log(`  NOT FOUND`);
      failed++;
    }
    saveCache(cache);
  }

  console.log(`\nFound: ${found}, Failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });