# AI Sports Gambling Platform

Express API + React (Vite) frontend driven by The Odds API. Grades bets and serves only C+ or better.

## Local development
- Install: `npm install` (root) and `npm install` in `Frontend/` if needed
- Backend: `npm run server`
- Frontend: `npm run dev --prefix Frontend`
- Both: `npm run dev`

Environment:
- .env: set `ODDS_API_KEY` and optionally `HIDE_STARTED_BUFFER_MINUTES`, `CACHE_TTL_SECONDS`.

## API Endpoints
- GET `/api/health`
- GET `/api/cfb/bets`
- GET `/api/nfl/props`

## Deploy to Render
See `RENDER.md` for full steps. Quick settings:
- Build Command: `npm install`
- Start Command: `node server.js`
- Env Var: `ODDS_API_KEY`

Health check path: `/api/health`
