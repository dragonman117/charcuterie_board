import fs from 'node:fs';
import path from 'node:path';
import { parseBoardFile, type ParsedBoard } from './parseBoard';

export type SeasonTerm = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

const TERM_ORDER: Record<SeasonTerm, number> = {
  WINTER: 0,
  SPRING: 1,
  SUMMER: 2,
  FALL: 3,
};

export interface Season {
  slug: string;
  title: string;
  boardPath: string;
  boardFileName: string;
  seasonTerm: SeasonTerm;
  seasonYear: number;
  metadata: string;
  sortKey: number;
}

export interface BoardFs {
  readdirSync(dir: string): string[];
  readFileSync(path: string, enc: string): string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function deriveSeasonFromTitle(title: string): { seasonTerm: SeasonTerm; seasonYear: number } | null {
  const m = title.match(/\b(winter|spring|summer|fall)\s+(\d{4})\b/i);
  if (!m) return null;
  return {
    seasonTerm: m[1].toUpperCase() as SeasonTerm,
    seasonYear: parseInt(m[2], 10),
  };
}

function sortKeyFor(seasonTerm: SeasonTerm, year: number): number {
  return year * 10 + TERM_ORDER[seasonTerm];
}

function buildSeason(boardsDir: string, fileName: string, fsLike: BoardFs): Season {
  const boardPath = path.join(boardsDir, fileName);
  const board: ParsedBoard = parseBoardFile(boardPath, fsLike);
  const derived = deriveSeasonFromTitle(board.seasonTitle);
  if (!derived) {
    throw new Error(
      `Cannot derive season from board "${fileName}": H1 "${board.seasonTitle}" must contain a season name (Winter|Spring|Summer|Fall) and a 4-digit year`,
    );
  }
  const slug = slugify(`${derived.seasonTerm} ${derived.seasonYear}`);
  return {
    slug,
    title: board.seasonTitle,
    boardPath,
    boardFileName: fileName,
    seasonTerm: derived.seasonTerm,
    seasonYear: derived.seasonYear,
    metadata: board.metadata,
    sortKey: sortKeyFor(derived.seasonTerm, derived.seasonYear),
  };
}

export function getSeasons(boardsDir = 'boards', fsLike?: BoardFs): Season[] {
  const fsApi: BoardFs = fsLike ?? (fs as unknown as BoardFs);
  const files = fsApi
    .readdirSync(boardsDir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort();
  const seasons = files.map((f) => buildSeason(boardsDir, f, fsApi));
  seasons.sort((a, b) => b.sortKey - a.sortKey);
  return seasons;
}

export function getCurrentSeason(boardsDir = 'boards', fsLike?: BoardFs): Season {
  const seasons = getSeasons(boardsDir, fsLike);
  if (seasons.length === 0) throw new Error(`No board files found in ${boardsDir}`);
  return seasons[0];
}