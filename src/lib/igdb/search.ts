import type { IgdbResult } from '../../types/models';

export type IgdbSearchResponse = { results: IgdbResult[] };
export type Rail = 'popular' | 'upcoming' | 'top';

export async function searchIgdb(
  api: <T>(path: string, init?: RequestInit) => Promise<T>,
  query: string,
): Promise<IgdbResult[]> {
  if (!query.trim()) return [];
  const r = await api<IgdbSearchResponse>(`/api/igdb-search?q=${encodeURIComponent(query)}`);
  return r.results;
}

export async function fetchRail(
  api: <T>(path: string, init?: RequestInit) => Promise<T>,
  rail: Rail,
): Promise<IgdbResult[]> {
  const r = await api<IgdbSearchResponse>(`/api/igdb-search?rail=${rail}`);
  return r.results;
}
