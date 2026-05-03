import type { IgdbResult } from '../../types/models';

export type IgdbSearchResponse = { results: IgdbResult[] };

export async function searchIgdb(
  api: <T>(path: string, init?: RequestInit) => Promise<T>,
  query: string,
): Promise<IgdbResult[]> {
  if (!query.trim()) return [];
  const r = await api<IgdbSearchResponse>(`/api/igdb-search?q=${encodeURIComponent(query)}`);
  return r.results;
}
