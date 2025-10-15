import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceLine,
  ReferenceDot,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Clock } from 'lucide-react';

interface Trade {
  id: string;
  instrument: string;
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  result: number;
  notes: string;
  emotion: string;
  mindsetBefore: string;
  mindsetAfter: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  exitPrice?: number;
  status: 'open' | 'closed';
  openDate: Date;
  closeDate?: Date;
}

interface DashboardProps {
  trades: Trade[];
}

const COLORS = ['#1E90FF', '#28A745', '#DC3545', '#FFC107', '#6F42C1'];

export function Dashboard({ trades }: DashboardProps) {
  const stats = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalPnL = closedTrades.reduce((sum, trade) => sum + trade.result, 0);
    const winningTrades = closedTrades.filter(t => t.result > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.result, 0) / winningTrades.length 
      : 0;
    const avgLoss = Math.abs(closedTrades.filter(t => t.result < 0)
      .reduce((sum, t) => sum + t.result, 0) / Math.max(1, closedTrades.length - winningTrades.length));
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalPnL,
      winRate,
      riskReward,
      totalTrades: closedTrades.length
    };
  }, [trades]);

  const equityData = useMemo(() => {
    let runningTotal = 0;
    const data = trades
      .filter(t => t.status === 'closed')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((trade, index) => {
        runningTotal += trade.result;
        return {
          trade: index + 1,
          equity: runningTotal,
          positiveEquity: runningTotal >= 0 ? runningTotal : null,
          negativeEquity: runningTotal < 0 ? runningTotal : null,
          date: trade.timestamp.toLocaleDateString('en-US')
        };
      });

    // Find zero crossings (inflection points)
    const inflectionPoints: number[] = [];
    for (let i = 1; i < data.length; i++) {
      if ((data[i - 1].equity < 0 && data[i].equity >= 0) || 
          (data[i - 1].equity >= 0 && data[i].equity < 0)) {
        inflectionPoints.push(i);
      }
    }

    return { data, inflectionPoints };
  }, [trades]);

  const instrumentDistribution = useMemo(() => {
    const distribution = trades.reduce((acc, trade) => {
      acc[trade.instrument] = (acc[trade.instrument] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([instrument, count]) => ({
      name: instrument,
      value: count
    }));
  }, [trades]);

  const hourlyData = useMemo(() => {
    const hourCounts = trades.reduce((acc, trade) => {
      const hour = trade.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      trades: hourCounts[hour] || 0
    }));
  }, [trades]);

  // Custom tooltip for equity curve
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const equity = payload[0].value;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">Trade #{label}</p>
          <p className={`text-sm font-semibold ${equity >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
            ${equity?.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold">Trading Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Total Trades: {stats.totalTrades}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Total P&L</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className={`text-lg sm:text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
              ${stats.totalPnL.toFixed(2)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.totalPnL >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-[#28A745]" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-[#DC3545]" />
              )}
              <span className="hidden sm:inline">Overall performance</span>
              <span className="sm:hidden">Performance</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Win Rate</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Success ratio</span>
              <span className="sm:hidden">Success</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">R:R</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold">1:{stats.riskReward.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Average ratio</span>
              <span className="sm:hidden">Avg ratio</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Trades</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold text-[#1E90FF]">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Total trades</span>
              <span className="sm:hidden">Total</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {/* Enhanced Equity Curve */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Equity Curve</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart 
                data={equityData.data}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  {/* Green gradient for positive equity */}
                  <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28A745" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#28A745" stopOpacity={0.05}/>
                  </linearGradient>
                  {/* Red gradient for negative equity */}
                  <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC3545" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#DC3545" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                
                {/* Minimalist grid */}
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#E5E7EB" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="trade" 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                  label={{ 
                    value: 'Trade Number', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { fill: '#6B7280', fontSize: 12, fontWeight: 500 }
                  }}
                />
                
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                  tickFormatter={(value) => `$${value}`}
                  label={{ 
                    value: 'Cumulative P&L ($)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: '#6B7280', fontSize: 12, fontWeight: 500 }
                  }}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                {/* Zero line (break-even) */}
                <ReferenceLine 
                  y={0} 
                  stroke="#374151" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'Break Even', 
                    position: 'insideTopRight',
                    fill: '#374151',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                />
                
                {/* Positive equity area */}
                <Area
                  type="monotone"
                  dataKey="positiveEquity"
                  stroke="none"
                  fill="url(#colorPositive)"
                  fillOpacity={1}
                  isAnimationActive={true}
                  connectNulls={false}
                />
                
                {/* Negative equity area */}
                <Area
                  type="monotone"
                  dataKey="negativeEquity"
                  stroke="none"
                  fill="url(#colorNegative)"
                  fillOpacity={1}
                  isAnimationActive={true}
                  connectNulls={false}
                />
                
                {/* Main equity line */}
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#1E90FF"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={true}
                  strokeLinecap="round"
                />
                
                {/* Inflection points (zero crossings) */}
                {equityData.inflectionPoints.map((pointIndex) => {
                  const point = equityData.data[pointIndex];
                  return point ? (
                    <ReferenceDot
                      key={`inflection-${pointIndex}`}
                      x={point.trade}
                      y={point.equity}
                      r={6}
                      fill="#FFC107"
                      stroke="#FFFFFF"
                      strokeWidth={3}
                      isFront={true}
                    />
                  ) : null;
                })}
              </ComposedChart>
            </ResponsiveContainer>
            
            {/* Legend for inflection points */}
            {equityData.inflectionPoints.length > 0 && (
              <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFC107] border-2 border-white"></div>
                  <span>Zero Crossing Point</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Instrument Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={instrumentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {instrumentDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trading Hours Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip />
                  <Bar dataKey="trades" fill="#1E90FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
