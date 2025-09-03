require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3020;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ODDS_API_BASE_URL = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
const ODDS_API_KEY = process.env.ODDS_API_KEY;

app.use(helmet());
app.use(compression());
app.use(express.json());
// Dev-friendly CORS: allow configured origin, any localhost, and no origin (CLI/tools)
app.use(cors({
	origin: (origin, cb) => {
		const allowList = (process.env.CORS_ORIGINS || FRONTEND_URL)
			.split(',')
			.map(s => s.trim())
			.filter(Boolean);
		const isLocalhost = !origin || /^http:\/\/localhost:\d+$/.test(origin);
		if (isLocalhost || allowList.includes(origin)) return cb(null, true);
		return cb(null, false);
	},
	credentials: false
}));
app.use(morgan('dev'));

// Rate limiting (protects third-party API)
const limiter = rateLimit({
	windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
	max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api/', limiter);

let lastOddsUsage = null;

app.get('/api/health', (req, res) => {
	const now = Date.now();
	const age = (t) => (t ? Math.round((now - t) / 1000) : null);
	res.json({
		status: 'ok',
		time: new Date(now).toISOString(),
		port: PORT,
		cache: {
			cfb: { hot: !!cache.cfb.data && (now - cache.cfb.at) < TTL_MS, ageSeconds: age(cache.cfb.at) },
			nflProps: { hot: !!cache.nflProps.data && (now - cache.nflProps.at) < TTL_MS, ageSeconds: age(cache.nflProps.at) },
			ttlMs: TTL_MS
		},
		oddsApi: lastOddsUsage || null
	});
});

app.get('/api/college-games', async (req, res) => {
	try {
		const url = `${ODDS_API_BASE_URL}/sports/americanfootball_ncaaf/odds`;
		const { data } = await axios.get(url, {
			params: {
				apiKey: ODDS_API_KEY,
				regions: 'us',
				markets: 'spreads,totals',
				oddsFormat: 'american'
			}
		});

		const games = (data || []).map(g => ({
			id: g.id,
			sport_key: g.sport_key,
			commence_time: g.commence_time,
			home_team: g.home_team,
			away_team: g.away_team,
			bookmakers: (g.bookmakers || []).length
		}));

		res.json({ count: games.length, games });
	} catch (err) {
		const status = err.response?.status || 500;
		res.status(status).json({ error: 'Failed to fetch college games', details: err.message });
	}
});

app.get('/api/nfl-player-props', async (req, res) => {
	res.json([]);
});

// Helpers
function impliedProbability(americanOdds) {
	const o = Number(americanOdds);
	if (!Number.isFinite(o) || o === 0) return null;
	return o > 0 ? 100 / (o + 100) : -o / (-o + 100);
}

function gradeFromProbability(pct) {
	if (pct >= 0.70) return 'A+';
	if (pct >= 0.62) return 'A';
	if (pct >= 0.58) return 'B+';
	if (pct >= 0.54) return 'B';
	if (pct >= 0.51) return 'C+';
	return 'C';
}

function parseTeamFromText(text, home, away) {
	if (!text) return null;
	try {
		const t = String(text).toLowerCase();
		const h = String(home || '').toLowerCase();
		const a = String(away || '').toLowerCase();
		if (h && t.includes(h)) return home;
		if (a && t.includes(a)) return away;
		const m = String(text).match(/\(([A-Z]{2,4})\)/);
		if (m) return m[1];
	} catch {}
	return null;
}

// Live CFB bets mapped for UI (basic version)
// Simple in-memory cache to avoid rate limits
const cache = {
	cfb: { data: null, at: 0 },
	nflProps: { data: null, at: 0 }
};
const TTL_MS = (() => {
	const ttlMs = Number(process.env.CACHE_TTL_MS);
	if (Number.isFinite(ttlMs) && ttlMs > 0) return ttlMs;
	const ttlSec = Number(process.env.CACHE_TTL_SECONDS);
	if (Number.isFinite(ttlSec) && ttlSec > 0) return ttlSec * 1000;
	return 60_000; // default 60s
})();
const CACHE_FILE = process.env.CACHE_FILE || path.join(__dirname, 'cache.json');
const HIDE_STARTED_BUFFER_MIN = Number(process.env.HIDE_STARTED_BUFFER_MINUTES || 0);
const HIDE_STARTED_BUFFER_MS = isFinite(HIDE_STARTED_BUFFER_MIN) ? HIDE_STARTED_BUFFER_MIN * 60_000 : 0;

function isFutureCommence(iso) {
	const t = new Date(iso).getTime();
	if (!Number.isFinite(t)) return false;
	return t > Date.now() + HIDE_STARTED_BUFFER_MS;
}

function loadCacheFromDisk() {
	try {
		if (!fs.existsSync(CACHE_FILE)) return;
		const raw = fs.readFileSync(CACHE_FILE, 'utf8');
		const fileCache = JSON.parse(raw);
		const now = Date.now();
		['cfb', 'nflProps'].forEach(key => {
			const entry = fileCache?.[key];
			if (entry && entry.data && typeof entry.at === 'number' && now - entry.at < TTL_MS) {
				cache[key] = entry;
			}
		});
		console.log('Cache warmed from disk:', {
			cfb: cache.cfb?.data ? 'hot' : 'cold',
			nflProps: cache.nflProps?.data ? 'hot' : 'cold'
		});
	} catch (e) {
		console.warn('Failed to load cache from disk:', e.message);
	}
}

function saveCacheToDisk() {
	try {
		const toSave = {
			cfb: cache.cfb?.data ? cache.cfb : { data: null, at: 0 },
			nflProps: cache.nflProps?.data ? cache.nflProps : { data: null, at: 0 }
		};
		fs.writeFileSync(CACHE_FILE, JSON.stringify(toSave));
	} catch (e) {
		console.warn('Failed to save cache to disk:', e.message);
	}
}

function logOddsHeaders(headers = {}) {
	try {
		const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [String(k).toLowerCase(), v]));
		const picked = {};
		for (const k of Object.keys(lower)) {
			if (k.includes('requests') || k.includes('ratelimit') || k.includes('usage')) {
				picked[k] = lower[k];
			}
		}
		if (Object.keys(picked).length) {
			lastOddsUsage = { observedAt: new Date().toISOString(), headers: picked };
			console.log('Odds API usage:', picked);
		}
	} catch {}
}

// warm cache from disk on boot
loadCacheFromDisk();

app.get('/api/cfb/bets', async (req, res) => {
	try {
		if (cache.cfb.data && Date.now() - cache.cfb.at < TTL_MS) {
			// Filter out games that have started from cached payload without mutating cache
			const filtered = {
				...cache.cfb.data,
				bets: (cache.cfb.data.bets || []).filter(b => isFutureCommence(b.gameTime))
			};
			filtered.count = filtered.bets.length;
			return res.json(filtered);
		}
	const url = `${ODDS_API_BASE_URL}/sports/americanfootball_ncaaf/odds`;
	const resp = await axios.get(url, {
			params: {
				apiKey: ODDS_API_KEY,
				regions: 'us',
				markets: 'spreads,totals',
				oddsFormat: 'american'
			}
		});
	logOddsHeaders(resp.headers);
	const data = resp.data;

			const bets = [];
			(data || []).forEach(g => {
			const gameTime = g.commence_time;
			const venue = 'TBD';
			const home = g.home_team;
			const away = g.away_team;
				if (!isFutureCommence(gameTime)) return; // skip started games
			const allMarkets = (g.bookmakers || []).flatMap(b => b.markets || []);

			// Consolidate spreads and totals across all bookmakers
			const spreads = allMarkets.filter(m => m.key === 'spreads');
			const totals = allMarkets.filter(m => m.key === 'totals');

			// Helper to consolidate outcomes by name keeping highest implied probability (shortest odds)
			const consolidate = (mkts) => {
				const best = new Map();
				mkts.forEach(m => (m.outcomes || []).forEach(o => {
					const name = o.name || '';
					const prob = impliedProbability(o.price);
					if (prob == null) return;
					const prev = best.get(name);
					if (!prev || prob > prev._prob) {
						best.set(name, { ...o, _prob: prob });
					}
				}));
				return Array.from(best.values());
			};

			const spreadOutcomes = consolidate(spreads);
			spreadOutcomes.forEach(out => {
				const prob = out._prob;
				const hitPct = Math.round(prob * 100);
				const grade = gradeFromProbability(prob);
				if (!['A+','A','B+','B','C+'].includes(grade)) return;
				const teamName = (out.name === home || out.name === away) ? out.name : (out.name || '');
				const lineStr = `${teamName} ${out.point > 0 ? `+${out.point}` : out.point}`;
				bets.push({
					id: `${g.id}-spread-${teamName}-${out.point}`,
					team1: away,
					team2: home,
					type: 'Spread',
					line: lineStr,
					odds: out.price,
					grade,
					hitProbability: hitPct,
					edge: Math.max(0, Math.round((hitPct - 50) * 10) / 10),
					gameTime,
					venue,
					keyFactors: [
						{ factor: 'Market Price', weight: 20, score: hitPct },
						{ factor: 'Home Field', weight: 11, score: teamName === home ? 70 : 50 },
						{ factor: 'Recent Form', weight: 5, score: 60 },
						{ factor: 'Weather', weight: 10, score: 80 }
					],
					analysis: 'Market-implied selection (aggregated across books)',
					motivation: 'Regular season',
					weather: 'Unknown',
					updated: 'just now',
					conference: 'NCAAF'
				});
			});

			const totalOutcomes = consolidate(totals);
			totalOutcomes.forEach(out => {
				const name = (out.name || '').toLowerCase();
				if (name !== 'over' && name !== 'under') return;
				const prob = out._prob;
				const hitPct = Math.round(prob * 100);
				const grade = gradeFromProbability(prob);
				if (!['A+','A','B+','B','C+'].includes(grade)) return;
				const lineStr = `${out.name} ${out.point}`;
				bets.push({
					id: `${g.id}-total-${name}-${out.point}`,
					team1: away,
					team2: home,
					type: 'Total',
					line: lineStr,
					odds: out.price,
					grade,
					hitProbability: hitPct,
					edge: Math.max(0, Math.round((hitPct - 50) * 10) / 10),
					gameTime,
					venue,
					keyFactors: [
						{ factor: 'Market Price', weight: 20, score: hitPct },
						{ factor: 'Pace/Tempo', weight: 4, score: 60 },
						{ factor: 'Weather', weight: 10, score: 80 },
						{ factor: 'Recent Form', weight: 5, score: 60 }
					],
					analysis: 'Market-implied selection (aggregated across books)',
					motivation: 'Regular season',
					weather: 'Unknown',
					updated: 'just now',
					conference: 'NCAAF'
				});
			});
		});

			const payload = { count: bets.length, bets };
			cache.cfb = { data: payload, at: Date.now() };
			saveCacheToDisk();
			res.json(payload);
	} catch (err) {
		const status = err.response?.status || 500;
		res.status(status).json({ error: 'Failed to fetch CFB bets', details: err.message });
	}
});

		// Live NFL player props via per-event odds endpoint
	app.get('/api/nfl/props', async (req, res) => {
		try {
				if (cache.nflProps.data && Date.now() - cache.nflProps.at < TTL_MS) {
					const filtered = {
						...cache.nflProps.data,
						bets: (cache.nflProps.data.bets || []).filter(b => isFutureCommence(b.gameTime))
					};
					filtered.count = filtered.bets.length;
					return res.json(filtered);
				}

				const marketList = [
					'player_pass_yds',
					'player_rec_yds',
					'player_rush_yds',
					'player_receptions',
					'player_rush_att',
					'player_pass_tds',
					'player_anytime_td'
				];
				const markets = marketList.join(',');

				// 1) Get upcoming events (games)
				const evUrl = `${ODDS_API_BASE_URL}/sports/americanfootball_nfl/events`;
				const evResp = await axios.get(evUrl, { params: { apiKey: ODDS_API_KEY } });
				logOddsHeaders(evResp.headers);
				const allEvents = (evResp.data || []).filter(e => isFutureCommence(e.commence_time));
				// safety cap to reduce API calls and stay within rate limits
				const maxEvents = Number(process.env.MAX_NFL_EVENTS || 12);
				const events = allEvents.slice(0, Math.max(1, maxEvents));

				// Small concurrency limiter
				async function mapWithConcurrency(items, limit, mapper) {
					const results = []; const executing = [];
					for (const item of items) {
						const p = Promise.resolve().then(() => mapper(item));
						results.push(p);
						if (limit <= 1) continue;
						executing.push(p);
						if (executing.length >= limit) {
							await Promise.race(executing);
							executing.splice(0, executing.length - (limit - 1));
						}
					}
					return Promise.all(results);
				}

				// 2) For each event, fetch per-event odds for player markets
				const conc = Number(process.env.NFL_PROPS_CONCURRENCY || 4);
				const perEvent = await mapWithConcurrency(events, conc, async (ev) => {
					const url = `${ODDS_API_BASE_URL}/sports/americanfootball_nfl/events/${ev.id}/odds`;
					try {
						const r = await axios.get(url, {
							params: {
								apiKey: ODDS_API_KEY,
								regions: 'us',
								markets,
								oddsFormat: 'american'
							}
						});
						logOddsHeaders(r.headers);
						return { ev, data: r.data };
					} catch (e) {
						// Return empty on plan/market restrictions or errors to continue others
						const status = e.response?.status;
						if (status === 403 || status === 422) return { ev, data: null, warning: 'Player props not available for this API plan or markets' };
						return { ev, data: null, error: e.message };
					}
				});

				const propMap = {
					player_pass_yds: 'Passing Yards',
					player_rec_yds: 'Receiving Yards',
					player_rush_yds: 'Rushing Yards',
					player_receptions: 'Receptions',
					player_rush_att: 'Rushing Attempts',
					player_pass_tds: 'Passing TDs',
					player_anytime_td: 'Anytime TD'
				};

				const bets = [];
				let warning = null;
				perEvent.forEach(({ ev, data, warning: w }) => {
					if (w && !warning) warning = w;
					if (!data) return;
					const gameTime = ev.commence_time;
					const home = ev.home_team;
					const away = ev.away_team;
					if (!isFutureCommence(gameTime)) return;
					const opponentBy = (team) => (team === home ? away : home);

					// Data shape mirrors odds endpoint: bookmakers -> markets -> outcomes
					const marketsArr = (data.bookmakers || []).flatMap(b => b.markets || []);
					marketsArr.forEach(mkt => {
						const key = mkt.key || '';
						(mkt.outcomes || []).forEach(out => {
							const player = out.description || out.participant || out.name || null;
							const overUnder = (out.name || '').toLowerCase();
							if (!player) return;
							const derivedTeam = parseTeamFromText(out.description || out.participant || player, home, away);
							const team = derivedTeam || home;
							const prop = propMap[key] || key;
							const type = overUnder.includes('over') ? 'Over' : overUnder.includes('under') ? 'Under' : 'Over';
							const line = out.point ?? null;
							const odds = out.price ?? null;
							if (odds == null || line == null) return;
							const prob = impliedProbability(odds) ?? 0.5;
							const hitProbability = Math.round(prob * 100);
							const grade = gradeFromProbability(prob);
							if (!['A+','A','B+','B','C+'].includes(grade)) return;
							bets.push({
								id: `${ev.id}-${key}-${player}-${type}`,
								player,
								team,
								opponent: `${team === home ? 'vs ' + away : team === away ? '@ ' + home : 'vs ' + opponentBy(team)}`,
								prop,
								line,
								type,
								odds,
								grade,
								hitProbability,
								edge: Math.max(0, Math.round((hitProbability - 50) * 10) / 10),
								gameTime,
								keyFactors: [
									{ factor: 'Market Price', weight: 16, score: hitProbability },
									{ factor: 'Opponent Defense', weight: 13, score: 60 },
									{ factor: 'Usage Rate', weight: 9, score: 65 },
									{ factor: 'Recent Performance', weight: 16, score: 62 }
								],
								recentForm: 'N/A',
								injury: 'N/A',
								weather: 'Unknown',
								updated: 'just now'
							});
						});
					});
				});

				const payload = { count: bets.length, bets, warning: warning || undefined };
				cache.nflProps = { data: payload, at: Date.now() };
				saveCacheToDisk();
				res.json(payload);
			} catch (err) {
				const status = err.response?.status || 500;
				if (status === 403 || status === 422) {
					// Graceful fallback for plans without player props access or invalid markets
					return res.json({ count: 0, bets: [], warning: 'Player props not available for this API plan or markets' });
				}
				res.status(status).json({ error: 'Failed to fetch NFL props', details: err.message });
			}
	});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

// Serve built frontend in production if present
try {
	const distDir = path.join(__dirname, 'Frontend', 'dist');
	if (fs.existsSync(distDir)) {
		app.use(express.static(distDir));
		// SPA fallback to index.html for non-API routes
		app.get(/^(?!\/api\/).*/, (req, res) => {
			res.sendFile(path.join(distDir, 'index.html'));
		});
		console.log('Static frontend enabled from', distDir);
	}
} catch (e) {
	console.warn('Static frontend setup skipped:', e.message);
}
