export type FactorScores = Record<string, number>;

export class BettingAI {
  // NFL Player Props weights (sum to 1)
  private nflWeights: FactorScores = {
    recentPerformance: 0.16,
    opponentDefense: 0.13,
    injuries: 0.13,
    weather: 0.11,
    usageRate: 0.09,
    gameScript: 0.07,
    homeAway: 0.05,
    history: 0.05,
    coaching: 0.04,
    rest: 0.03,
    advancedMetrics: 0.02,
    lineMovement: 0.02,
    pace: 0.02,
    redZone: 0.02,
    matchups: 0.02,
    motivation: 0.01,
    officials: 0.01,
    surface: 0.01,
    possession: 0.01,
    public: 0.01,
  };

  // CFB weights (sum to 1)
  private cfbWeights: FactorScores = {
    epa: 0.19,
    sos: 0.14,
    homeField: 0.11,
    weather: 0.10,
    injuries: 0.07,
    coaching: 0.06,
    motivation: 0.05,
    form: 0.05,
    pace: 0.04,
    turnovers: 0.03,
    specialTeams: 0.03,
    travel: 0.02,
    conference: 0.02,
    market: 0.02,
    other: 0.07,
  };

  scoreToGrade(prob: number, edge: number): string {
    // Professional grading thresholds (C+ minimum)
    if (prob >= 0.95 && edge >= 0.08) return 'A+';
    if (prob >= 0.90 && edge >= 0.06) return 'A';
    if (prob >= 0.85 && edge >= 0.05) return 'A-';
    if (prob >= 0.80 && edge >= 0.04) return 'B+';
    if (prob >= 0.75 && edge >= 0.03) return 'B';
    if (prob >= 0.70 && edge >= 0.025) return 'B-';
    if (prob >= 0.65 && edge >= 0.02) return 'C+';
    if (prob >= 0.60 && edge >= 0.015) return 'C';
    if (prob >= 0.55 && edge >= 0.01) return 'C-';
    if (prob >= 0.50 && edge >= 0.005) return 'D+';
    if (prob >= 0.45) return 'D';
    return 'F';
  }

  private weightedScore(factors: FactorScores, weights: FactorScores) {
    let total = 0;
    for (const [k, w] of Object.entries(weights)) {
      const f = Math.max(0, Math.min(100, factors[k] ?? 50));
      total += (f * w);
    }
    return total; // 0..100
  }

  analyzeNFLProp(factors: FactorScores, marketProb: number) {
    const score = this.weightedScore(factors, this.nflWeights);
    const prob = Math.max(0.05, Math.min(0.95, score / 100));
    const edge = prob - marketProb;
    const grade = this.scoreToGrade(prob, edge);
    return { score: Math.round(score), prob, edge, grade };
  }

  analyzeCFBGame(factors: FactorScores, marketProb: number) {
    const score = this.weightedScore(factors, this.cfbWeights);
    const prob = Math.max(0.05, Math.min(0.95, score / 100));
    const edge = prob - marketProb;
    const grade = this.scoreToGrade(prob, edge);
    return { score: Math.round(score), prob, edge, grade };
  }
}

export default new BettingAI();
