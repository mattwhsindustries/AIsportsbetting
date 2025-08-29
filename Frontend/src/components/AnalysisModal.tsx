import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, MapPin, Thermometer } from 'lucide-react';

const getGradeColor = (grade) => {
  switch (grade) {
    case 'A+': return 'bg-green-600 text-white';
    case 'A': return 'bg-green-500 text-white';
    case 'B+': return 'bg-blue-500 text-white';
    case 'B': return 'bg-blue-400 text-white';
    case 'C+': return 'bg-orange-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getFactorColor = (score) => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

const generateDetailedFactors = (bet) => {
  if (bet.player) {
    // NFL Player Props factors
    return [
      { factor: 'Recent Performance (16%)', score: 92, description: 'Allen has thrown for 280+ yards in 4 of last 5 games. Averaging 295.4 passing yards over last 6 games.' },
      { factor: 'Opponent Defense Ranking (13%)', score: 88, description: 'Miami ranks 18th in pass defense DVOA. Allowing 248.3 passing yards per game to QBs.' },
      { factor: 'Injury Status (13%)', score: 95, description: 'No injury concerns for Allen. Full participation in practice all week.' },
      { factor: 'Weather Conditions (11%)', score: 95, description: 'Dome environment - perfect passing conditions with no wind or precipitation factors.' },
      { factor: 'Usage Rate/Target Share (9%)', score: 85, description: 'Allen attempts 34.2 passes per game. High volume passer in Buffalo\'s offensive system.' },
      { factor: 'Game Script/Expected Flow (7%)', score: 82, description: 'Game total 47.5 suggests high-scoring affair. Buffalo likely to throw frequently.' },
      { factor: 'Home/Away Performance (5%)', score: 88, description: 'Allen averages 18 more passing yards at home vs away games this season.' },
      { factor: 'Player vs Opponent History (5%)', score: 90, description: 'Allen has thrown for 275+ yards in 3 of last 4 games vs Miami.' },
      { factor: 'Coaching Scheme Changes (4%)', score: 78, description: 'No significant scheme changes. Consistent offensive coordinator approach.' },
      { factor: 'Rest Days/Schedule (3%)', score: 85, description: 'Standard rest - played last Sunday. No short week concerns.' }
    ];
  } else {
    // College Football factors
    return [
      { factor: 'EPA Efficiency (19%)', score: 94, description: 'Georgia ranks #2 in offensive EPA/play (0.31) while Alabama ranks #8 in defensive EPA allowed.' },
      { factor: 'Strength of Schedule (14%)', score: 88, description: 'Both teams have faced top-15 SOS. Georgia has performed better against elite competition.' },
      { factor: 'Home Field Advantage (11%)', score: 70, description: 'Neutral site game at Mercedes-Benz Stadium reduces typical home field edge.' },
      { factor: 'Weather Conditions (10%)', score: 95, description: 'Dome environment eliminates weather as a factor. Perfect conditions for both teams.' },
      { factor: 'Key Player Injuries (7%)', score: 85, description: 'Georgia\'s starting QB healthy. Alabama missing key defensive back.' },
      { factor: 'Coaching Matchup (6%)', score: 88, description: 'Kirby Smart has covered spread in 3 of last 4 meetings vs Saban.' },
      { factor: 'Team Motivation (5%)', score: 95, description: 'SEC Championship with playoff implications. Both teams highly motivated.' },
      { factor: 'Recent Form/Momentum (5%)', score: 87, description: 'Georgia won last 4 games by 14+ points. Alabama struggled vs Auburn.' },
      { factor: 'Pace of Play/Tempo (4%)', score: 82, description: 'Georgia runs 72 plays/game vs Alabama\'s 68. Slight pace advantage to UGA.' },
      { factor: 'Turnover Margins (3%)', score: 79, description: 'Georgia +8 turnover margin vs Alabama +3. Georgia more ball-secure.' }
    ];
  }
};

const generateMarketAnalysis = (bet) => ({
  lineMovement: bet.player ? 'Line opened at 265.5, moved to 267.5 on sharp action' : 'Line opened at -2.5, moved to -3.5 on Georgia money',
  sharpMoney: bet.player ? '68% of money on Over despite 52% of bets on Under' : '71% of money on Georgia despite even bet split',
  publicSentiment: bet.player ? 'Public backing Allen Over in primetime spot' : 'Public split but sharps heavily on Georgia',
  injuries: bet.player ? 'Monitor Stefon Diggs (questionable) for target share impact' : 'Alabama DB John Doe ruled out, impacts secondary',
  keyNumbers: bet.player ? 'Allen has hit exactly 268 yards twice this season' : 'Georgia 4-1 ATS as road favorite this season'
});

export function AnalysisModal({ bet, isOpen, onClose }) {
  if (!bet) return null;

  const detailedFactors = generateDetailedFactors(bet);
  const marketAnalysis = generateMarketAnalysis(bet);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {bet.player ? (
              <>
                <span>{bet.player} - {bet.prop}</span>
                <Badge className={getGradeColor(bet.grade)}>{bet.grade}</Badge>
              </>
            ) : (
              <>
                <span>{bet.team1} vs {bet.team2} - {bet.type}</span>
                <Badge className={getGradeColor(bet.grade)}>{bet.grade}</Badge>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {bet.player ? 
              `${bet.type} ${bet.line} (${bet.odds > 0 ? '+' : ''}${bet.odds}) • ${bet.gameTime}` :
              `${bet.line} (${bet.odds > 0 ? '+' : ''}${bet.odds}) • ${bet.gameTime}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Hit Probability</CardTitle>
                <div className="text-2xl font-semibold text-green-600">{bet.hitProbability}%</div>
                <Progress value={bet.hitProbability} className="h-2" />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Model Edge</CardTitle>
                <div className="text-2xl font-semibold text-blue-600">+{bet.edge}%</div>
                <Progress value={bet.edge * 8} className="h-2" />
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
                <div className="text-2xl font-semibold text-purple-600">8.7/10</div>
                <Progress value={87} className="h-2" />
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="factors" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="factors">AI Factor Analysis</TabsTrigger>
              <TabsTrigger value="market">Market Intelligence</TabsTrigger>
              <TabsTrigger value="historical">Historical Data</TabsTrigger>
            </TabsList>

            <TabsContent value="factors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Weighted Factor Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailedFactors.map((factor, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{factor.factor}</span>
                          {factor.score >= 85 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : factor.score >= 60 ? (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <span className={`font-semibold ${getFactorColor(factor.score)}`}>
                          {factor.score}%
                        </span>
                      </div>
                      <Progress value={factor.score} className="h-2" />
                      <p className="text-xs text-slate-600 pl-2 border-l-2 border-slate-200">
                        {factor.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="market" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Line Movement Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-700">Movement:</span>
                      <p className="text-sm text-slate-600 mt-1">{marketAnalysis.lineMovement}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Sharp Money:</span>
                      <p className="text-sm text-green-600 mt-1">{marketAnalysis.sharpMoney}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Betting Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-700">Public Sentiment:</span>
                      <p className="text-sm text-slate-600 mt-1">{marketAnalysis.publicSentiment}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Key Numbers:</span>
                      <p className="text-sm text-blue-600 mt-1">{marketAnalysis.keyNumbers}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Factors & Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span>Injury Concerns:</span>
                      </span>
                      <p className="text-sm text-slate-600 mt-1">{marketAnalysis.injuries}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>Monitor Until:</span>
                      </span>
                      <p className="text-sm text-slate-600 mt-1">30 minutes before kickoff</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historical" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {bet.player ? 'Player Historical Performance' : 'Head-to-Head History'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {bet.player ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Last 5 games vs line:</span>
                          <span className="text-sm font-medium">4-1 Over</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Home vs away difference:</span>
                          <span className="text-sm font-medium">+18.3 yards</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">vs Miami career:</span>
                          <span className="text-sm font-medium">289.7 avg yards</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Last 5 meetings:</span>
                          <span className="text-sm font-medium">Georgia 3-2 ATS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Neutral site record:</span>
                          <span className="text-sm font-medium">Georgia 2-1 ATS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Average margin:</span>
                          <span className="text-sm font-medium">6.8 points</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Situational Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {bet.player ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Primetime games:</span>
                          <span className="text-sm font-medium">6-2 Over</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Division games:</span>
                          <span className="text-sm font-medium">294.1 avg yards</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">December record:</span>
                          <span className="text-sm font-medium">4-1 Over</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Conference championships:</span>
                          <span className="text-sm font-medium">Georgia 3-1 ATS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">As road favorite:</span>
                          <span className="text-sm font-medium">4-1 ATS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">High stakes games:</span>
                          <span className="text-sm font-medium">6-2 ATS</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Model Performance on Similar Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-semibold text-green-600">73%</div>
                      <div className="text-xs text-slate-600">A+ Grade Win Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-blue-600">+15.2%</div>
                      <div className="text-xs text-slate-600">ROI This Season</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-purple-600">156</div>
                      <div className="text-xs text-slate-600">Similar Bets Tracked</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Summary & Recommendation */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base text-green-800 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>AI Recommendation Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                {bet.player ? 
                  `Strong recommendation on ${bet.player} ${bet.prop} ${bet.type} ${bet.line}. Model shows ${bet.hitProbability}% hit probability with ${bet.edge}% edge over market odds. Key factors strongly favor the Over with minimal risk factors identified.` :
                  `High confidence play on ${bet.line}. Model projects ${bet.hitProbability}% hit probability with significant ${bet.edge}% edge. All major factors align positively with strong historical backing in similar situations.`
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}