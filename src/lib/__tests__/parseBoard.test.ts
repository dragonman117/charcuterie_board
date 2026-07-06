import { parseBoard } from '../parseBoard';

const WELL_FORMED = `# Summer 2026 Anime Guide

*Last updated: June 18, 2026. Sources: Crunchyroll.*

---

## ISEKAI

- **Mushoku Tensei: Jobless Reincarnation Season 3**
    - https://www.crunchyroll.com/series/G24H1N3MP/mushoku-tensei-jobless-reincarnation
    - Rudeus returns.

- **Re:ZERO Season 4** *(continuing)*
    - https://www.crunchyroll.com/series/GDKHZEJPQ/rezero
    - Subaru dies again.

---

## QUICK STATS
- **Total shows tracked:** 2
`;

const MISSING_URL = `# Test

## CAT

- **Show With No URL**
    - Just a blurb.
`;

const MISSING_BLURB = `# Test

## CAT

- **Show With No Blurb**
    - https://www.crunchyroll.com/series/G24H1N3MP/foo
`;

const EXTRA_BLANK = `# Test



## CAT

- **Show**

    - https://example.com

stray text here

- **Show Two**
    - https://example.com/two
    - blurb two
`;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function run() {
  const wf = parseBoard(WELL_FORMED);
  assert(wf.seasonTitle === 'Summer 2026 Anime Guide', 'season title');
  assert(wf.metadata.includes('Last updated'), 'metadata');
  assert(wf.categories.length === 1, 'one category');
  assert(wf.categories[0].name === 'ISEKAI', 'category name');
  assert(wf.categories[0].shows.length === 2, 'two shows');
  assert(wf.categories[0].shows[0].title === 'Mushoku Tensei: Jobless Reincarnation Season 3', 'show 0 title');
  assert(wf.categories[0].shows[0].rawUrl.includes('G24H1N3MP'), 'show 0 url');
  assert(wf.categories[0].shows[0].blurb === 'Rudeus returns.', 'show 0 blurb');
  assert(wf.categories[0].shows[0].unresolved === false, 'show 0 not unresolved');
  assert(wf.categories[0].shows[1].markers.includes('continuing'), 'show 1 continuing marker');
  assert(wf.categories[0].shows[1].unresolved === true, 'show 1 placeholder unresolved');
  assert(wf.quickStatsRaw && wf.quickStatsRaw.includes('Total shows'), 'quick stats raw');

  const mu = parseBoard(MISSING_URL);
  assert(mu.categories[0].shows[0].rawUrl === '', 'missing url empty');
  assert(mu.categories[0].shows[0].blurb === 'Just a blurb.', 'missing url blurb kept');

  const mb = parseBoard(MISSING_BLURB);
  assert(mb.categories[0].shows[0].blurb === '', 'missing blurb empty');
  assert(mb.categories[0].shows[0].rawUrl.includes('G24H1N3MP'), 'missing blurb url kept');

  const eb = parseBoard(EXTRA_BLANK);
  assert(eb.categories[0].shows.length === 2, 'extra blank: two shows');
  assert(eb.categories[0].shows[1].blurb === 'blurb two', 'extra blank: blurb two');

  const renamed = parseBoard(`# T\n\n## ISEKAI STUFF\n\n- **X**\n    - https://x.com\n`);
  assert(renamed.categories[0].name === 'ISEKAI STUFF', 'renamed category accepted');

  console.log('parseBoard tests: PASS');
}

run();