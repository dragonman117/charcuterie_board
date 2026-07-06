export interface ParsedShow {
  title: string;
  rawUrl: string;
  blurb: string;
  markers: string[];
  unresolved: boolean;
  slug: string;
}

export interface ParsedCategory {
  name: string;
  slug: string;
  shows: ParsedShow[];
}

export interface ParsedBoard {
  seasonTitle: string;
  metadata: string;
  categories: ParsedCategory[];
  quickStatsRaw?: string;
}

const PLACEHOLDER_PATTERNS = [
  /GDKHZEJPQ/i,
  /netflix\.com\/title\/THUNDER3/i,
  /netflix\.com\/title\/THE_RIBBON_HERO/i,
  /netflix\.com\/title\/POKEMON_HORIZONS/i,
  /netflix\.com\/title\/[a-z-]+$/i,
  /amazon\.com\/dp\/[a-z0-9-]+$/i,
];

export function isPlaceholderUrl(url: string): boolean {
  if (!url) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(url));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const MARKER_RE = /\*\(([^)]+)\)\*/g;

function extractMarkers(titleRaw: string): { title: string; markers: string[] } {
  const markers: string[] = [];
  let title = titleRaw;
  let m: RegExpExecArray | null;
  while ((m = MARKER_RE.exec(titleRaw)) !== null) {
    markers.push(m[1].trim().toLowerCase());
  }
  title = title.replace(MARKER_RE, '').trim();
  return { title, markers };
}

export function parseBoard(md: string): ParsedBoard {
  const lines = md.split('\n');

  let seasonTitle = '';
  let metadata = '';
  const categories: ParsedCategory[] = [];
  let current: ParsedCategory | null = null;
  let pendingShow: ParsedShow | null = null;
  let inQuickStats = false;
  let quickStatsBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      seasonTitle = trimmed.replace(/^#\s+/, '').trim();
      continue;
    }

    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**') && metadata === '') {
      metadata = trimmed.replace(/^\*|\*$/g, '').trim();
      continue;
    }

    if (trimmed === '---') {
      if (pendingShow && current) current.shows.push(pendingShow);
      pendingShow = null;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      if (pendingShow && current) current.shows.push(pendingShow);
      pendingShow = null;
      const name = trimmed.replace(/^##\s+/, '').trim();
      if (name.toLowerCase() === 'quick stats') {
        inQuickStats = true;
        quickStatsBuffer = [];
        current = null;
      } else {
        inQuickStats = false;
        current = { name, slug: slugify(name), shows: [] };
        categories.push(current);
      }
      continue;
    }

    if (inQuickStats) {
      if (trimmed.length > 0) quickStatsBuffer.push(trimmed);
      continue;
    }

    const bulletMatch = trimmed.match(/^-\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (bulletMatch && current) {
      if (pendingShow) current.shows.push(pendingShow);
      const titleRaw = (bulletMatch[1] + ' ' + bulletMatch[2]).trim();
      const { title, markers } = extractMarkers(titleRaw);
      pendingShow = {
        title,
        rawUrl: '',
        blurb: '',
        markers,
        unresolved: true,
        slug: slugify(title),
      };
      continue;
    }

    if (pendingShow && current) {
      const urlCandidate = trimmed.replace(/^-\s+/, '');
      if (urlCandidate.startsWith('http://') || urlCandidate.startsWith('https://')) {
        const url = urlCandidate.split(/\s/)[0];
        pendingShow.rawUrl = url;
        pendingShow.unresolved = isPlaceholderUrl(url);
        const annotationMatch = urlCandidate.match(/\*(.+)\*\s*$/);
        if (annotationMatch) {
          pendingShow.blurb = pendingShow.blurb
            ? pendingShow.blurb + ' ' + annotationMatch[1]
            : annotationMatch[1];
        }
      } else if (trimmed.length > 0) {
        const blurbText = trimmed.replace(/^-\s+/, '');
        pendingShow.blurb = pendingShow.blurb
          ? pendingShow.blurb + ' ' + blurbText
          : blurbText;
      }
    }
  }

  if (pendingShow && current) current.shows.push(pendingShow);

  return {
    seasonTitle,
    metadata,
    categories,
    quickStatsRaw: quickStatsBuffer.length > 0 ? quickStatsBuffer.join('\n') : undefined,
  };
}

export function parseBoardFile(path: string, fs: { readFileSync(path: string, enc: string): string }): ParsedBoard {
  const md = fs.readFileSync(path, 'utf8');
  return parseBoard(md);
}