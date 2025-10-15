import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ComposedChart,
  Line,
  Cell,
  LineChart,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Target, Clock, AlertTriangle, Award, Activity } from 'lucide-react';
import { toast } from 'sonner';

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

interface StatisticsProps {
  trades: Trade[];
}

const COLORS = {
  win: '#28A745',
  loss: '#DC3545',
  primary: '#1E90FF',
  warning: '#FFC107',
  purple: '#6F42C1',
  noData: '#CBD5E1',
  cyan: '#17A2B8',
  pink: '#E83E8C'
};

// Custom tooltips
const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data || !data.instrument || data.profit === undefined) return null;
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm">{data.instrument}</p>
        <p className="text-sm text-muted-foreground">Duration: {data.durationLabel || 'N/A'}</p>
        <p className={`text-sm font-medium ${data.profit >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
          P&L: ${data.profit.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const CustomMonthlyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm">{data.month}</p>
        <p className={`text-sm font-medium ${data.profit >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
          Profit: ${data.profit?.toFixed(2) || '0.00'}
        </p>
        <p className="text-sm text-muted-foreground">Trades: {data.trades || 0}</p>
        {data.winRate !== undefined && (
          <p className="text-sm text-muted-foreground">Win Rate: {data.winRate.toFixed(1)}%</p>
        )}
      </div>
    );
  }
  return null;
};

const CustomDayTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm">{data.fullDay || data.day}</p>
        <p className="text-sm">Win Rate: {data.winRate.toFixed(1)}%</p>
        <p className="text-sm text-muted-foreground">Trades: {data.trades}</p>
        {data.trades > 0 && (
          <p className={`text-sm ${data.avgPnL >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
            Avg P&L: ${data.avgPnL.toFixed(2)}
          </p>
        )}
        {data.totalPnL !== undefined && (
          <p className={`text-sm font-medium ${data.totalPnL >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
            Total: ${data.totalPnL.toFixed(2)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomRRTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm">{data.instrument}</p>
        <p className="text-sm">Planned R:R: 1:{data.plannedRR.toFixed(2)}</p>
        <p className={`text-sm font-medium ${data.actualPnL >= 0 ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
          Actual P&L: ${data.actualPnL.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">Result: {data.outcome}</p>
      </div>
    );
  }
  return null;
};

export function Statistics({ trades }: StatisticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const filteredTrades = useMemo(() => {
    const now = new Date();
    const closedTrades = trades.filter(t => t.status === 'closed');
    
    switch (selectedPeriod) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return closedTrades.filter(t => new Date(t.timestamp) >= weekAgo);
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return closedTrades.filter(t => new Date(t.timestamp) >= monthAgo);
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return closedTrades.filter(t => new Date(t.timestamp) >= quarterAgo);
      default:
        return closedTrades;
    }
  }, [trades, selectedPeriod]);

  const advancedStats = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        totalPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        expectancy: 0,
        avgRR: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        avgDuration: 0,
        currentStreak: { type: 'none' as const, count: 0 },
        kellyPercent: 0
      };
    }

    const winTrades = filteredTrades.filter(t => t.result > 0);
    const lossTrades = filteredTrades.filter(t => t.result < 0);
    
    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.result, 0);
    const winRate = (winTrades.length / filteredTrades.length) * 100;
    
    const avgWin = winTrades.length > 0 
      ? winTrades.reduce((sum, t) => sum + t.result, 0) / winTrades.length 
      : 0;
    const avgLoss = lossTrades.length > 0 
      ? Math.abs(lossTrades.reduce((sum, t) => sum + t.result, 0) / lossTrades.length) 
      : 0;
    
    const largestWin = winTrades.length > 0 
      ? Math.max(...winTrades.map(t => t.result)) 
      : 0;
    const largestLoss = lossTrades.length > 0 
      ? Math.min(...lossTrades.map(t => t.result)) 
      : 0;
    
    const totalWinAmount = avgWin * winTrades.length;
    const totalLossAmount = avgLoss * lossTrades.length;
    const profitFactor = totalLossAmount > 0 
      ? totalWinAmount / totalLossAmount 
      : totalWinAmount > 0 ? 999 : 0;
    
    // Expectancy
    const expectancy = filteredTrades.length > 0 
      ? (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss)
      : 0;

    // Average R:R
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    const consecutiveWins = calculateConsecutiveWins(filteredTrades);
    const consecutiveLosses = calculateConsecutiveLosses(filteredTrades);
    const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(filteredTrades);
    const avgDuration = calculateAvgDuration(filteredTrades);
    const currentStreak = calculateCurrentStreak(filteredTrades);

    // Kelly Criterion
    const kellyPercent = winRate > 0 && avgLoss > 0 
      ? ((winRate / 100) - ((100 - winRate) / 100) / avgRR) * 100
      : 0;
    
    return {
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor: profitFactor > 999 ? 999 : profitFactor,
      consecutiveWins,
      consecutiveLosses,
      totalTrades: filteredTrades.length,
      winTrades: winTrades.length,
      lossTrades: lossTrades.length,
      expectancy,
      avgRR,
      maxDrawdown,
      maxDrawdownPercent,
      avgDuration,
      currentStreak,
      kellyPercent
    };
  }, [filteredTrades]);

  const equityData = useMemo(() => {
    let runningTotal = 0;
    let peak = 0;
    return filteredTrades
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((trade, index) => {
        runningTotal += trade.result;
        peak = Math.max(peak, runningTotal);
        const drawdown = peak - runningTotal;
        const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
        
        return {
          trade: index + 1,
          equity: runningTotal,
          drawdown: -drawdown,
          drawdownPercent: -drawdownPercent,
          date: new Date(trade.timestamp).toLocaleDateString('en-US')
        };
      });
  }, [filteredTrades]);

  const monthlyData = useMemo(() => {
    if (filteredTrades.length === 0) return [];

    const monthlyStats = filteredTrades.reduce((acc, trade) => {
      const date = new Date(trade.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { 
          monthKey,
          month: monthLabel, 
          profit: 0, 
          trades: 0,
          wins: 0,
          sortDate: new Date(date.getFullYear(), date.getMonth(), 1)
        };
      }
      acc[monthKey].profit += trade.result;
      acc[monthKey].trades += 1;
      if (trade.result > 0) acc[monthKey].wins += 1;
      return acc;
    }, {} as Record<string, { monthKey: string; month: string; profit: number; trades: number; wins: number; sortDate: Date }>);

    return Object.values(monthlyStats)
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .map(({ month, profit, trades, wins }) => ({ 
        month, 
        profit: Number(profit.toFixed(2)), 
        trades,
        winRate: trades > 0 ? (wins / trades) * 100 : 0,
        fill: profit >= 0 ? COLORS.win : COLORS.loss
      }));
  }, [filteredTrades]);

  const tradeDurationData = useMemo(() => {
    return filteredTrades
      .filter(trade => trade.closeDate && trade.openDate)
      .map(trade => {
        const openTime = new Date(trade.openDate).getTime();
        const closeTime = new Date(trade.closeDate!).getTime();
        const durationMinutes = (closeTime - openTime) / (1000 * 60);
        const durationHours = durationMinutes / 60;
        
        let displayDuration: number;
        let durationLabel: string;
        let unit: string;
        
        if (durationMinutes < 60) {
          displayDuration = durationMinutes;
          durationLabel = `${durationMinutes.toFixed(0)} min`;
          unit = 'minutes';
        } else if (durationHours < 24) {
          displayDuration = durationHours;
          durationLabel = `${durationHours.toFixed(1)} hrs`;
          unit = 'hours';
        } else {
          const durationDays = durationHours / 24;
          displayDuration = durationDays;
          durationLabel = `${durationDays.toFixed(1)} days`;
          unit = 'days';
        }
        
        return {
          id: trade.id,
          instrument: trade.instrument,
          duration: displayDuration,
          durationLabel,
          unit,
          profit: Number(trade.result.toFixed(2)),
          type: trade.result >= 0 ? 'win' : 'loss',
          fill: trade.result >= 0 ? COLORS.win : COLORS.loss
        };
      })
      .sort((a, b) => a.duration - b.duration);
  }, [filteredTrades]);

  const trendLineData = useMemo(() => {
    if (tradeDurationData.length < 2) return [];

    const n = tradeDurationData.length;
    const sumX = tradeDurationData.reduce((sum, d) => sum + d.duration, 0);
    const sumY = tradeDurationData.reduce((sum, d) => sum + d.profit, 0);
    const sumXY = tradeDurationData.reduce((sum, d) => sum + d.duration * d.profit, 0);
    const sumXX = tradeDurationData.reduce((sum, d) => sum + d.duration * d.duration, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    if (!isFinite(slope) || !isFinite(intercept)) return [];

    const minDuration = Math.min(...tradeDurationData.map(d => d.duration));
    const maxDuration = Math.max(...tradeDurationData.map(d => d.duration));

    return [
      { duration: minDuration, trendProfit: slope * minDuration + intercept },
      { duration: maxDuration, trendProfit: slope * maxDuration + intercept }
    ];
  }, [tradeDurationData]);

  const instrumentPerformance = useMemo(() => {
    const instrumentStats = filteredTrades.reduce((acc, trade) => {
      if (!acc[trade.instrument]) {
        acc[trade.instrument] = { 
          instrument: trade.instrument, 
          profit: 0, 
          trades: 0, 
          wins: 0 
        };
      }
      acc[trade.instrument].profit += trade.result;
      acc[trade.instrument].trades += 1;
      if (trade.result > 0) acc[trade.instrument].wins += 1;
      return acc;
    }, {} as Record<string, { instrument: string; profit: number; trades: number; wins: number }>);

    return Object.values(instrumentStats)
      .map(stat => ({
        ...stat,
        winRate: stat.trades > 0 ? (stat.wins / stat.trades) * 100 : 0,
        avgProfit: stat.profit / stat.trades
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredTrades]);

  const emotionAnalysis = useMemo(() => {
    const emotionStats = filteredTrades.reduce((acc, trade) => {
      if (!trade.emotion) return acc;
      if (!acc[trade.emotion]) {
        acc[trade.emotion] = { emotion: trade.emotion, count: 0, totalPnL: 0, wins: 0 };
      }
      acc[trade.emotion].count += 1;
      acc[trade.emotion].totalPnL += trade.result;
      if (trade.result > 0) acc[trade.emotion].wins += 1;
      return acc;
    }, {} as Record<string, { emotion: string; count: number; totalPnL: number; wins: number }>);

    return Object.values(emotionStats)
      .map(stat => ({
        ...stat,
        avgPnL: stat.totalPnL / stat.count,
        winRate: (stat.wins / stat.count) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTrades]);

  const dayOfWeekAnalysis = useMemo(() => {
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayMap: { [key: number]: string } = {
      0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
      4: 'Thursday', 5: 'Friday', 6: 'Saturday'
    };
    
    const dayStats = filteredTrades.reduce((acc, trade) => {
      const date = new Date(trade.timestamp);
      const day = dayMap[date.getDay()];
      
      if (day === 'Saturday' || day === 'Sunday') return acc;
      
      if (!acc[day]) {
        acc[day] = { day, trades: 0, wins: 0, totalPnL: 0 };
      }
      acc[day].trades += 1;
      acc[day].totalPnL += trade.result;
      if (trade.result > 0) acc[day].wins += 1;
      return acc;
    }, {} as Record<string, { day: string; trades: number; wins: number; totalPnL: number }>);

    return allDays.map(day => ({
      day: day.substring(0, 3),
      fullDay: day,
      trades: dayStats[day]?.trades || 0,
      winRate: dayStats[day] && dayStats[day].trades > 0
        ? (dayStats[day].wins / dayStats[day].trades) * 100 
        : 0,
      avgPnL: dayStats[day] && dayStats[day].trades > 0
        ? dayStats[day].totalPnL / dayStats[day].trades 
        : 0,
      totalPnL: dayStats[day]?.totalPnL || 0,
      fill: dayStats[day]?.trades > 0 ? COLORS.primary : COLORS.noData
    }));
  }, [filteredTrades]);

  const hourlyAnalysis = useMemo(() => {
    const hourStats = filteredTrades.reduce((acc, trade) => {
      const hour = new Date(trade.openDate).getHours();
      if (!acc[hour]) {
        acc[hour] = { hour, trades: 0, wins: 0, totalPnL: 0 };
      }
      acc[hour].trades += 1;
      acc[hour].totalPnL += trade.result;
      if (trade.result > 0) acc[hour].wins += 1;
      return acc;
    }, {} as Record<number, { hour: number; trades: number; wins: number; totalPnL: number }>);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      trades: hourStats[hour]?.trades || 0,
      winRate: hourStats[hour] ? (hourStats[hour].wins / hourStats[hour].trades) * 100 : 0,
      avgPnL: hourStats[hour] ? hourStats[hour].totalPnL / hourStats[hour].trades : 0,
      totalPnL: hourStats[hour]?.totalPnL || 0
    }));
  }, [filteredTrades]);

  const rollingWinRate = useMemo(() => {
    const windowSize = Math.min(20, filteredTrades.length);
    if (windowSize < 5) return [];
    
    return filteredTrades
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((_, index, arr) => {
        if (index < windowSize - 1) return null;
        const window = arr.slice(index - windowSize + 1, index + 1);
        const wins = window.filter(t => t.result > 0).length;
        return {
          trade: index + 1,
          winRate: (wins / windowSize) * 100,
          date: new Date(arr[index].timestamp).toLocaleDateString('en-US')
        };
      })
      .filter(Boolean);
  }, [filteredTrades]);

  const tradeDistribution = useMemo(() => {
    const ranges = [
      { label: '< -$500', min: -Infinity, max: -500 },
      { label: '-$500 to -$200', min: -500, max: -200 },
      { label: '-$200 to $0', min: -200, max: 0 },
      { label: '$0 to $200', min: 0, max: 200 },
      { label: '$200 to $500', min: 200, max: 500 },
      { label: '> $500', min: 500, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: filteredTrades.filter(t => t.result > range.min && t.result <= range.max).length
    }));
  }, [filteredTrades]);

  const riskRewardScatter = useMemo(() => {
    return filteredTrades
      .filter(t => t.stopLoss && t.takeProfit)
      .map(t => {
        const risk = Math.abs(t.entryPrice - t.stopLoss) * t.lotSize * 10000;
        const reward = Math.abs(t.takeProfit - t.entryPrice) * t.lotSize * 10000;
        const rr = risk > 0 ? reward / risk : 0;
        return {
          plannedRR: rr,
          actualPnL: t.result,
          instrument: t.instrument,
          outcome: t.result > 0 ? 'Win' : 'Loss'
        };
      })
      .filter(t => t.plannedRR > 0 && t.plannedRR < 10);
  }, [filteredTrades]);

  function calculateConsecutiveWins(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    
    let maxWins = 0;
    let currentWins = 0;
    
    [...trades]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(trade => {
        if (trade.result > 0) {
          currentWins++;
          maxWins = Math.max(maxWins, currentWins);
        } else {
          currentWins = 0;
        }
      });
    
    return maxWins;
  }

  function calculateConsecutiveLosses(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    
    let maxLosses = 0;
    let currentLosses = 0;
    
    [...trades]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(trade => {
        if (trade.result < 0) {
          currentLosses++;
          maxLosses = Math.max(maxLosses, currentLosses);
        } else {
          currentLosses = 0;
        }
      });
    
    return maxLosses;
  }

  function calculateMaxDrawdown(trades: Trade[]) {
    let peak = 0;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let runningTotal = 0;

    trades
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .forEach(trade => {
        runningTotal += trade.result;
        peak = Math.max(peak, runningTotal);
        const drawdown = peak - runningTotal;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
        if (peak > 0) {
          maxDrawdownPercent = Math.max(maxDrawdownPercent, (drawdown / peak) * 100);
        }
      });

    return { maxDrawdown, maxDrawdownPercent };
  }

  function calculateAvgDuration(trades: Trade[]): number {
    const durations = trades
      .filter(t => t.closeDate)
      .map(t => {
        const duration = new Date(t.closeDate!).getTime() - new Date(t.openDate).getTime();
        return duration / (1000 * 60 * 60); // Convert to hours
      });

    return durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
  }

  function calculateCurrentStreak(trades: Trade[]): { type: 'win' | 'loss' | 'none'; count: number } {
    if (trades.length === 0) return { type: 'none', count: 0 };
    
    const sortedTrades = [...trades].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastResult = sortedTrades[0].result;
    let count = 0;
    
    for (const trade of sortedTrades) {
      if ((lastResult > 0 && trade.result > 0) || (lastResult < 0 && trade.result < 0)) {
        count++;
      } else {
        break;
      }
    }
    
    return { type: lastResult > 0 ? 'win' : 'loss', count };
  }

  const exportData = (format: string) => {
    if (filteredTrades.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    toast.success(`Exporting ${filteredTrades.length} trades as ${format.toUpperCase()}...`);
    
    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      toast.info('PDF export feature coming soon!');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Instrument', 'Type', 'Entry', 'Exit', 'Lot Size', 'P&L', 'Emotion'];
    const rows = filteredTrades.map(trade => [
      new Date(trade.timestamp).toLocaleDateString(),
      trade.instrument,
      trade.type,
      trade.entryPrice,
      trade.exitPrice || 'N/A',
      trade.lotSize,
      trade.result,
      trade.emotion || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-stats-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Trading Data</h3>
        <p className="text-muted-foreground">Start adding trades to see your statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Advanced Trading Analytics</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportData('csv')} 
            className="text-sm"
            disabled={filteredTrades.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export </span>CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportData('pdf')} 
            className="text-sm"
            disabled={filteredTrades.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export </span>PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Time' },
          { value: 'quarter', label: '3 Months' },
          { value: 'month', label: '1 Month' },
          { value: 'week', label: '1 Week' }
        ].map(period => (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period.value)}
            className={selectedPeriod === period.value ? 'bg-[#1E90FF] hover:bg-[#1E90FF]/90' : ''}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {filteredTrades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No trades in selected period</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="psychology">Psychology</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total P&L</p>
                      <p className={`text-lg sm:text-2xl font-bold ${advancedStats.totalPnL >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                        ${advancedStats.totalPnL.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-lg sm:text-2xl font-bold">{advancedStats.winRate.toFixed(1)}%</p>
                      <Progress value={advancedStats.winRate} className="mt-2 h-1" />
                    </div>
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-[#1E90FF]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Profit Factor</p>
                      <p className="text-lg sm:text-2xl font-bold">{advancedStats.profitFactor.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#28A745]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Expectancy</p>
                      <p className={`text-lg sm:text-2xl font-bold ${advancedStats.expectancy >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                        ${advancedStats.expectancy.toFixed(2)}
                      </p>
                    </div>
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-[#1E90FF]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equity Curve */}
            {equityData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Equity Curve & Drawdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={equityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trade" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'Equity') return [`$${value.toFixed(2)}`, 'Equity'];
                          if (name === 'Drawdown') return [`$${Math.abs(value).toFixed(2)}`, 'Drawdown'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="equity" 
                        stroke="#1E90FF" 
                        strokeWidth={2}
                        dot={false}
                        name="Equity"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="drawdown"
                        fill="#DC3545"
                        stroke="#DC3545"
                        fillOpacity={0.3}
                        name="Drawdown"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Monthly Performance with adjusted bar thickness */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(300, monthlyData.length * 50)}>
                  <BarChart data={monthlyData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="month" type="category" width={100} />
                    <Tooltip content={<CustomMonthlyTooltip />} />
                    <ReferenceLine x={0} stroke="#666" />
                    <Bar 
                      dataKey="profit" 
                      fill="#1E90FF" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={30}
                    >
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {tradeDurationData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Trade Duration vs Profit/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        dataKey="duration" 
                        name="Duration" 
                        label={{ 
                          value: `Duration (${tradeDurationData[0]?.unit || 'units'})`, 
                          position: 'insideBottom', 
                          offset: -10 
                        }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="profit" 
                        name="P&L" 
                        label={{ 
                          value: 'Profit/Loss (USD)', 
                          angle: -90, 
                          position: 'insideLeft' 
                        }}
                      />
                      <Tooltip content={<CustomScatterTooltip />} />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                      
                      <Scatter 
                        data={tradeDurationData} 
                        fill="#8884d8"
                      >
                        {tradeDurationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Scatter>
                      
                      {trendLineData.length > 0 && (
                        <Line 
                          data={trendLineData} 
                          dataKey="trendProfit" 
                          stroke="#FFC107" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          legendType="line"
                          name="Trend"
                          isAnimationActive={false}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {/* Rolling Win Rate */}
            {rollingWinRate.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Rolling Win Rate (20 Trades)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={rollingWinRate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trade" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                      />
                      <ReferenceLine y={50} stroke="#999" strokeDasharray="3 3" label="50%" />
                      <Line 
                        type="monotone" 
                        dataKey="winRate" 
                        stroke="#1E90FF" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>P&L Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1E90FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Win/Loss Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Wins', value: advancedStats.winTrades, fill: COLORS.win },
                          { name: 'Losses', value: advancedStats.lossTrades, fill: COLORS.loss }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Win Rate by Trading Day</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Performance analysis across weekdays (Mon-Fri)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayOfWeekAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<CustomDayTooltip />} />
                    <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                      {dayOfWeekAnalysis.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.trades > 0 ? COLORS.primary : COLORS.noData} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {dayOfWeekAnalysis.some(d => d.trades === 0) && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Gray bars indicate days with no trading activity
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  </div>
                  <p className="text-2xl text-red-500">${advancedStats.maxDrawdown.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {advancedStats.maxDrawdownPercent.toFixed(2)}% of peak
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Largest Win</p>
                  <p className="text-2xl text-[#28A745]">${advancedStats.largestWin.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Largest Loss</p>
                  <p className="text-2xl text-red-500">${advancedStats.largestLoss.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Kelly Criterion</p>
                  <p className="text-2xl text-[#1E90FF]">{Math.max(0, advancedStats.kellyPercent).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Optimal position size</p>
                </CardContent>
              </Card>
            </div>

            {riskRewardScatter.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Planned R:R vs Actual Outcome</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="plannedRR" 
                        name="Planned R:R" 
                        label={{ value: 'Planned Risk:Reward', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        dataKey="actualPnL" 
                        name="Actual P&L"
                        label={{ value: 'Actual P&L ($)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomRRTooltip />} />
                      <Legend />
                      <Scatter 
                        name="Wins" 
                        data={riskRewardScatter.filter(d => d.outcome === 'Win')} 
                        fill="#28A745"
                      />
                      <Scatter 
                        name="Losses" 
                        data={riskRewardScatter.filter(d => d.outcome === 'Loss')} 
                        fill="#DC3545"
                      />
                      <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Streak Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Max Consecutive Wins</p>
                      <p className="text-2xl text-[#28A745]">{advancedStats.consecutiveWins}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-[#28A745]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Max Consecutive Losses</p>
                      <p className="text-2xl text-red-500">{advancedStats.consecutiveLosses}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl">{advancedStats.currentStreak.count}</p>
                        {advancedStats.currentStreak.type === 'win' ? (
                          <TrendingUp className="w-4 h-4 text-[#28A745]" />
                        ) : advancedStats.currentStreak.type === 'loss' ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                    <Award className="w-8 h-8 text-[#FFC107]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trade Efficiency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Win Rate</span>
                      <span>{advancedStats.winRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={advancedStats.winRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Profit Factor</span>
                      <span>{advancedStats.profitFactor.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(advancedStats.profitFactor * 20, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Avg R:R</span>
                      <span>1:{advancedStats.avgRR.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min(advancedStats.avgRR * 33, 100)} className="h-2" />
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Avg Trade Duration</p>
                    <p className="text-lg">{advancedStats.avgDuration.toFixed(1)} hours</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayOfWeekAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip content={<CustomDayTooltip />} />
                    <Bar dataKey="totalPnL" name="Total P&L">
                      {dayOfWeekAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? COLORS.win : COLORS.loss} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {hourlyAnalysis.filter(h => h.trades > 0).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Trading Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyAnalysis.filter(h => h.trades > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'avgPnL') return [`$${value.toFixed(2)}`, 'Avg P&L'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="avgPnL" name="avgPnL" fill="#1E90FF">
                        {hourlyAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.avgPnL >= 0 ? COLORS.win : COLORS.loss} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {dayOfWeekAnalysis
                .filter(d => d.trades > 0)
                .sort((a, b) => b.totalPnL - a.totalPnL)
                .slice(0, 3)
                .map((day, index) => (
                  <Card key={day.fullDay}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {day.fullDay}
                        </Badge>
                      </div>
                      <p className={`text-2xl mb-1 ${day.totalPnL >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                        ${day.totalPnL.toFixed(2)}
                      </p>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{day.trades} trades</span>
                        <span>{day.winRate.toFixed(0)}% WR</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="psychology" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Emotion Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {emotionAnalysis.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No emotion data available</p>
                ) : (
                  <div className="space-y-4">
                    {emotionAnalysis.map((emotion) => (
                      <div key={emotion.emotion} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{emotion.emotion}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {emotion.count} trades
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-sm font-medium ${emotion.avgPnL >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                              Avg: ${emotion.avgPnL.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Win Rate: {emotion.winRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Win Rate by Instrument</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(300, instrumentPerformance.length * 40)}>
                    <BarChart data={instrumentPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="instrument" type="category" width={80} />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                      />
                      <Bar dataKey="winRate" fill="#1E90FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instrument Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {instrumentPerformance.map((item) => (
                      <div key={item.instrument} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{item.instrument}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.trades} trades
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-medium ${item.profit >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                              ${item.profit.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg: ${item.avgProfit.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <p className="text-sm">
                              {item.winRate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Win Rate
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Expectancy</p>
                      <p className={`text-lg ${advancedStats.expectancy >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                        ${advancedStats.expectancy.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">per trade</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Kelly %</p>
                      <p className="text-lg text-[#1E90FF]">
                        {Math.max(0, Math.min(25, advancedStats.kellyPercent)).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">optimal size</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Recovery Factor</p>
                      <p className="text-lg">
                        {advancedStats.maxDrawdown > 0 
                          ? (advancedStats.totalPnL / advancedStats.maxDrawdown).toFixed(2)
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Avg Duration</p>
                      <p className="text-lg">{advancedStats.avgDuration.toFixed(1)}h</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">What is Expectancy?</h4>
                    <p className="text-xs text-muted-foreground">
                      Expectancy shows your average profit per trade. A positive expectancy means your trading system is profitable over time.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Kelly Criterion</h4>
                    <p className="text-xs text-muted-foreground">
                      Suggests the optimal position size based on your win rate and average R:R. Using 25-50% of Kelly is recommended for safety.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trading System Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`p-3 rounded-lg ${advancedStats.profitFactor >= 2 ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500' : advancedStats.profitFactor >= 1.5 ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500' : 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500'}`}>
                    <p className="text-sm font-medium">Profit Factor: {advancedStats.profitFactor.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {advancedStats.profitFactor >= 2 ? '✓ Excellent - Strong trading system' :
                       advancedStats.profitFactor >= 1.5 ? '✓ Good - Solid performance' :
                       advancedStats.profitFactor >= 1 ? '⚠ Fair - Room for improvement' :
                       '✗ Poor - Review your strategy'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg ${advancedStats.winRate >= 50 ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500' : 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500'}`}>
                    <p className="text-sm font-medium">Win Rate: {advancedStats.winRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {advancedStats.winRate >= 60 ? '✓ Excellent consistency' :
                       advancedStats.winRate >= 50 ? '✓ Good - Above breakeven' :
                       advancedStats.winRate >= 40 ? '⚠ Ensure R:R is strong' :
                       '⚠ Focus on quality setups'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg ${advancedStats.expectancy > 0 ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500' : 'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500'}`}>
                    <p className="text-sm font-medium">Expectancy: ${advancedStats.expectancy.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {advancedStats.expectancy > 0 ? '✓ Positive edge - Keep trading your plan' : '✗ Negative edge - Review your strategy'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg ${advancedStats.maxDrawdownPercent < 20 ? 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500' : advancedStats.maxDrawdownPercent < 30 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500' : 'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500'}`}>
                    <p className="text-sm font-medium">Max Drawdown: {advancedStats.maxDrawdownPercent.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {advancedStats.maxDrawdownPercent < 20 ? '✓ Good risk management' :
                       advancedStats.maxDrawdownPercent < 30 ? '⚠ Monitor position sizing' :
                       '⚠ High risk - Reduce position size'}
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Action Items:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {advancedStats.winRate < 50 && <li>• Focus on improving entry timing</li>}
                      {advancedStats.avgRR < 1.5 && <li>• Aim for better risk:reward ratios</li>}
                      {advancedStats.consecutiveLosses > 5 && <li>• Set maximum consecutive loss limit</li>}
                      {advancedStats.maxDrawdownPercent > 25 && <li>• Reduce position size to limit drawdown</li>}
                      {advancedStats.profitFactor < 1.5 && <li>• Review and refine entry criteria</li>}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Overall Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-[#1E90FF]">{advancedStats.totalTrades}</p>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-[#28A745]">{advancedStats.winTrades}</p>
                    <p className="text-sm text-muted-foreground">Winners</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-red-500">{advancedStats.lossTrades}</p>
                    <p className="text-sm text-muted-foreground">Losers</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className={`text-3xl font-bold ${advancedStats.totalPnL >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                      ${advancedStats.totalPnL.toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
