# Deploy to Render

This app can run as a single Render Web Service (Node). The backend serves the built frontend from `Frontend/dist` in production.

## Prereqs
- Render account
- GitHub repo containing this project

## Service settings
- Service type: Web Service
- Runtime: Node
- Region: US (to match Odds API)
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment: `ODDS_API_KEY` (required), optional: `CACHE_TTL_SECONDS`, `RATE_LIMIT_*`, `HIDE_STARTED_BUFFER_MINUTES`

Notes:
- Postinstall builds the frontend (`npm run build --prefix Frontend`); served statically by Express.
- Render provides `PORT`; the server reads it automatically.

## Environment variables
- `ODDS_API_KEY` = your The Odds API key
- `ODDS_API_BASE_URL` (optional) default `https://api.the-odds-api.com/v4`
- `CACHE_TTL_SECONDS` (optional) default `60`
- `HIDE_STARTED_BUFFER_MINUTES` (optional) default `0`
- `CORS_ORIGINS` (optional) comma-separated origins; production requests from the same host are allowed

## Health check
- Endpoint: `/api/health`

## Troubleshooting
- If frontend doesn’t load, confirm `Frontend/dist` exists in build logs.
- If API rate limit issues occur, check `/api/health` for header snapshots.
