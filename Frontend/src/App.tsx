import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { NFLPlayerProps } from './components/NFLPlayerProps';
import { CollegeFootball } from './components/CollegeFootball';
import { AnalysisModal } from './components/AnalysisModal';
import { TrendingUp, Activity, Clock, Filter } from 'lucide-react';

export default function App() {
  const [selectedBet, setSelectedBet] = useState(null);
  const [sortBy, setSortBy] = useState('grade');
  const [filterGrade, setFilterGrade] = useState('all');

  const stats = {
    totalBets: 47,
    avgGrade: 'B+',
    winRate: '68.3%'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black dark">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-white">Human Robot Football Locks</h1>
                  <p className="text-xs sm:text-sm text-gray-400">by Shmealington Industries</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-gray-300">Win Rate:</span>
                  <span className="font-medium text-green-400">{stats.winRate}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 hidden sm:inline">Last updated:</span>
                <span className="text-gray-300">2 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Active Bets (C+ Grade)</CardDescription>
              <CardTitle className="text-xl md:text-3xl">{stats.totalBets}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Average Grade</CardDescription>
              <CardTitle className="text-xl md:text-3xl">{stats.avgGrade}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Win Rate</CardDescription>
              <CardTitle className="text-xl md:text-3xl text-green-600">{stats.winRate}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Filters:</span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grade">Grade</SelectItem>
                <SelectItem value="edge">Edge %</SelectItem>
                <SelectItem value="time">Game Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-32 sm:w-40">
                <SelectValue placeholder="Grade filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A+">A+ Only</SelectItem>
                <SelectItem value="A">A and above</SelectItem>
                <SelectItem value="B">B and above</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="text-xs self-start sm:self-auto">
            Only showing C+ grade and higher bets
          </Badge>
        </div>

        {/* Betting Sections */}
        <Tabs defaultValue="nfl" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="nfl">NFL Player Props</TabsTrigger>
            <TabsTrigger value="college">College Football</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nfl" className="space-y-6">
            <NFLPlayerProps 
              sortBy={sortBy} 
              filterGrade={filterGrade} 
              onSelectBet={setSelectedBet}
            />
          </TabsContent>
          
          <TabsContent value="college" className="space-y-6">
            <CollegeFootball 
              sortBy={sortBy} 
              filterGrade={filterGrade} 
              onSelectBet={setSelectedBet}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Analysis Modal */}
      {selectedBet && (
        <AnalysisModal 
          bet={selectedBet} 
          isOpen={!!selectedBet} 
          onClose={() => setSelectedBet(null)} 
        />
      )}
    </div>
  );
}