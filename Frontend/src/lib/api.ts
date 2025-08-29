const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
export const API_BASE = isProd ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3020');

export type CfbBet = {
  id: string;
  team1: string;
  team2: string;
  type: 'Spread' | 'Total';
  line: string;
  odds: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C';
  hitProbability: number; // 0-100
  edge: number; // percentage
  gameTime: string;
  venue: string;
  keyFactors: { factor: string; weight: number; score: number }[];
  analysis: string;
  motivation: string;
  weather: string;
  updated: string;
  conference: string;
};

export async function fetchCfbBets(signal?: AbortSignal): Promise<CfbBet[]> {
  const res = await fetch(`${API_BASE}/api/cfb/bets`, { signal });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.bets ?? [];
}
