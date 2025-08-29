import React, { useEffect, useMemo, useState } from 'react';
import { fetchCfbBets, type CfbBet } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { TrendingUp, Clock, Eye, MapPin, Thermometer } from 'lucide-react';

// No sample data: we only render live data from the backend

const getGradeColor = (grade) => {
  switch (grade) {
    case 'A+': return 'bg-green-500 text-white';
    case 'A': return 'bg-green-400 text-black';
    case 'B+': return 'bg-green-600 text-white';
    case 'B': return 'bg-green-700 text-white';
    case 'C+': return 'bg-yellow-500 text-black';
    default: return 'bg-gray-600 text-white';
  }
};

const getEdgeColor = (edge) => {
  if (edge >= 8) return 'text-green-400';
  if (edge >= 5) return 'text-green-300';
  if (edge >= 3) return 'text-yellow-400';
  return 'text-gray-400';
};

const getBetTypeColor = (type) => {
  return type === 'Spread' ? 'bg-purple-700 text-purple-200' : 'bg-indigo-700 text-indigo-200';
};

export function CollegeFootball({ sortBy, filterGrade, onSelectBet }) {
  const [bets, setBets] = useState(null as any);
  const [error, setError] = useState(null as any);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCfbBets(ctrl.signal)
      .then(setBets)
      .catch((e) => setError(e.message || 'Failed to load bets'));
    return () => ctrl.abort();
  }, []);
  const list = Array.isArray(bets) ? bets : [];

  const filteredBets = list.filter(bet => {
    if (filterGrade === 'all') return true;
    if (filterGrade === 'A+') return bet.grade === 'A+';
    if (filterGrade === 'A') return ['A+', 'A'].includes(bet.grade);
    if (filterGrade === 'B') return ['A+', 'A', 'B+', 'B'].includes(bet.grade);
    return true;
  });

  const sortedBets = [...filteredBets].sort((a, b) => {
    if (sortBy === 'grade') {
      const gradeOrder = { 'A+': 5, 'A': 4, 'B+': 3, 'B': 2, 'C+': 1, 'C': 0 };
      return gradeOrder[b.grade] - gradeOrder[a.grade];
    }
    if (sortBy === 'edge') return b.edge - a.edge;
    if (sortBy === 'time') return a.gameTime.localeCompare(b.gameTime);
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">College Football Spreads & Totals</h2>
        <Badge variant="secondary" className="bg-gray-700 text-gray-200">{sortedBets.length} active bets</Badge>
      </div>
      {bets === null && !error && (
        <div className="text-sm text-gray-400">Loading live college bets…</div>
      )}
      {error && (
        <div className="flex items-center gap-3 text-sm text-red-400">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => {
            setError(null);
            setBets(null);
            const ctrl = new AbortController();
            fetchCfbBets(ctrl.signal)
              .then(setBets)
              .catch((e) => setError(e.message || 'Failed to load bets'));
          }}>Retry</Button>
        </div>
      )}
      {!error && Array.isArray(bets) && bets.length === 0 && (
        <div className="text-sm text-gray-400">No live college bets qualify (C+ or better) right now.</div>
      )}
      {!error && (Array.isArray(bets) && bets.length === 0) && (
        <div className="text-sm text-gray-400">No live college bets qualify (C+ or better) right now. Check back later.</div>
      )}
      
      <div className="grid gap-4">
  {sortedBets.map((bet) => (
          <Card key={bet.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-green-400 bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg text-white">{bet.team1} vs {bet.team2}</h3>
                    <Badge className={getBetTypeColor(bet.type)}>{bet.type}</Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">{bet.conference}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="font-medium">{bet.line}</span>
                    <span>({bet.odds > 0 ? '+' : ''}{bet.odds})</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{bet.gameTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{bet.venue}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <Badge className={getGradeColor(bet.grade)}>{bet.grade}</Badge>
                    <p className="text-xs text-gray-400 mt-1">Updated {bet.updated}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Hit Probability */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Hit Probability</span>
                    <span className="font-semibold text-white">{bet.hitProbability}%</span>
                  </div>
                  <Progress value={bet.hitProbability} className="h-2" />
                </div>
                
                {/* Edge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Edge</span>
                    <span className={`font-semibold ${getEdgeColor(bet.edge)}`}>+{bet.edge}%</span>
                  </div>
                  <Progress value={bet.edge * 8} className="h-2" />
                </div>
                
                {/* Top Factor */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-300">Top Factor</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{bet.keyFactors[0].factor}</span>
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">{bet.keyFactors[0].score}%</Badge>
                  </div>
                </div>
              </div>
              
              {/* Analysis Insights */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-slate-700">Key Analysis:</span>
                    <p className="text-slate-600 mt-1">{bet.analysis}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Motivation Factor:</span>
                    <p className="text-slate-600 mt-1">{bet.motivation}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Weather:</span>
                    <div className="flex items-center space-x-1 mt-1">
                      <Thermometer className="h-3 w-3 text-slate-500" />
                      <span className="text-slate-600">{bet.weather}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Factor Breakdown Preview */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Key Factors Preview</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSelectBet(bet)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Full Analysis</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {bet.keyFactors.slice(0, 4).map((factor, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-slate-600 mb-1">{factor.factor}</div>
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-xs font-medium">{factor.weight}%</span>
                        <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${factor.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Action Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-4 text-xs text-slate-600">
                  <span>Model Confidence: High</span>
                  <span>•</span>
                  <span>Sharp Money: Aligned</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-slate-600">Strong fundamentals</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}