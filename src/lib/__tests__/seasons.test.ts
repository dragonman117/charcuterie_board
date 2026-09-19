import { getSeasons, getCurrentSeason, type BoardFs, type Season } from '../seasons';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function makeFs(files: Record<string, string>): BoardFs {
  return {
    readdirSync(dir: string): string[] {
      return Object.keys(files);
    },
    readFileSync(p: string, _enc: string): string {
      const name = p.split('/').pop() ?? p;
      const content = files[name];
      if (content === undefined) throw new Error(`ENOENT: ${p}`);
      return content;
    },
  };
}

function boardMd(title: string, metadata = `*Last updated: Jan 1, 2026.*`): string {
  return `# ${title}\n\n${metadata}\n\n## ISEKAI\n\n- **Some Show**\n    - https://example.com\n    - blurb\n`;
}

function run() {
  const fs = makeFs({
    'Summer 2026.md': boardMd('Summer 2026 Anime Guide — The Only List That Matters™'),
    'Fall 2026.md': boardMd('Fall 2026 Anime Guide — The Only List That Matters™', '*Last updated: September 18, 2026. Sources: Crunchyroll.*'),
  });

  const seasons: Season[] = getSeasons('boards', fs);
  assert(seasons.length === 2, 'two seasons discovered');
  const [fall, summer] = seasons;
  assert(fall.slug === 'fall-2026', 'fall slug derived from H1: fall-2026');
  assert(summer.slug === 'summer-2026', 'summer slug: summer-2026');
  assert(fall.seasonTerm === 'FALL', 'fall season term');
  assert(summer.seasonTerm === 'SUMMER', 'summer season term');
  assert(fall.seasonYear === 2026, 'fall year');
  assert(fall.sortKey > summer.sortKey, 'fall sorts newer than summer (FALL > SUMMER within a year)');
  assert(fall.title.includes('Fall 2026'), 'fall title from H1');
  assert(fall.metadata.includes('September 18, 2026'), 'fall metadata captured');
  assert(fall.boardFileName === 'Fall 2026.md', 'board file name kept');
  assert(getCurrentSeason('boards', fs).slug === 'fall-2026', 'current season is newest');

  const crossYear = getSeasons('boards', makeFs({
    'Winter 2027.md': boardMd('Winter 2027 Anime Guide'),
    'Fall 2026.md': boardMd('Fall 2026 Anime Guide'),
  }));
  assert(crossYear[0].slug === 'winter-2027', 'next-year winter sorts newest');
  assert(crossYear[1].slug === 'fall-2026', 'prior-year fall second');

  const single = getSeasons('boards', makeFs({
    'Fall 2026.md': boardMd('Fall 2026 Anime Guide'),
  }));
  assert(single.length === 1 && single[0].slug === 'fall-2026', 'single-season case');
  assert(getCurrentSeason('boards', single.length ? makeFs({ 'Fall 2026.md': boardMd('Fall 2026 Anime Guide') }) : fs).slug === 'fall-2026', 'current with one season');

  let threw = false;
  try {
    getSeasons('boards', makeFs({ 'Guide.md': boardMd('Some Guide With No Season') }));
  } catch {
    threw = true;
  }
  assert(threw, 'board without season/year in H1 throws');

  const noBoards = getSeasons('boards', makeFs({}));
  assert(noBoards.length === 0, 'no boards -> empty list');

  console.log('seasons tests: PASS');
}

run();