import axios from 'axios';

const ODDS_API_KEY = process.env.ODDS_API_KEY as string;
const BASE_URL = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

export class OddsAPIService {
  async getNFLGames(markets = 'h2h,spreads,totals') {
    const url = `${BASE_URL}/sports/americanfootball_nfl/odds?regions=us&markets=${markets}&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
    const { data } = await axios.get(url);
    return data;
  }

  async getCFBGames(markets = 'spreads,totals') {
    const url = `${BASE_URL}/sports/americanfootball_ncaaf/odds?regions=us&markets=${markets}&oddsFormat=american&apiKey=${ODDS_API_KEY}`;
    const { data } = await axios.get(url);
    return data;
  }
}

export default new OddsAPIService();
