import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Calculator, AlertTriangle, TrendingUp, DollarSign, Info } from 'lucide-react';

// Define instrument types and their specifications
const INSTRUMENTS = {
  'NAS100': { 
    type: 'index', 
    pointValue: 1, // $1 per point movement
    minMove: 0.01,
    displayName: 'NASDAQ 100',
    decimal: 2
  },
  'US30': { 
    type: 'index', 
    pointValue: 1, // $1 per point movement
    minMove: 0.01,
    displayName: 'Dow Jones 30',
    decimal: 2
  },
  'XAUUSD': { 
    type: 'commodity', 
    pointValue: 0.01, // $0.01 per 0.01 movement (per oz)
    contractSize: 100, // 100 oz per lot
    minMove: 0.01,
    displayName: 'Gold',
    decimal: 2
  },
  'EUR/USD': { 
    type: 'forex', 
    pointValue: 10, // $10 per pip for standard lot
    minMove: 0.00001,
    displayName: 'EUR/USD',
    decimal: 5
  },
  'GBP/USD': { 
    type: 'forex', 
    pointValue: 10,
    minMove: 0.00001,
    displayName: 'GBP/USD',
    decimal: 5
  },
  'USD/JPY': { 
    type: 'forex', 
    pointValue: 10,
    minMove: 0.001,
    displayName: 'USD/JPY',
    decimal: 3
  }
};

// Leverage options
const LEVERAGE_OPTIONS = [
  { value: 1, label: '1:1' },
  { value: 10, label: '1:10' },
  { value: 30, label: '1:30' },
  { value: 50, label: '1:50' },
  { value: 100, label: '1:100' },
  { value: 200, label: '1:200' },
  { value: 500, label: '1:500' },
  { value: 1000, label: '1:1000' },
];

export function RiskCalculator() {
  const [riskCalcData, setRiskCalcData] = useState({
    accountBalance: 10000,
    riskPercentage: 2,
    entryPrice: 15850.50,
    stopLoss: 15800.00,
    instrument: 'NAS100',
    leverage: 100
  });

  const [positionSizeData, setPositionSizeData] = useState({
    accountBalance: 10000,
    riskAmount: 200,
    entryPrice: 15850.50,
    stopLoss: 15800.00,
    instrument: 'NAS100',
    leverage: 100
  });

  const [pipCalcData, setPipCalcData] = useState({
    lotSize: 1,
    points: 50, // Changed from pips to points for indices
    instrument: 'NAS100'
  });

  // Get point/pip value based on instrument
  function getPointValue(instrument: string, lotSize: number = 1): number {
    const spec = INSTRUMENTS[instrument];
    if (!spec) return 10;

    if (spec.type === 'index') {
      return spec.pointValue * lotSize;
    } else if (spec.type === 'commodity' && spec.contractSize) {
      return spec.pointValue * spec.contractSize * lotSize;
    } else {
      return spec.pointValue * lotSize;
    }
  }

  // Calculate point difference based on instrument type
  function calculatePointDifference(instrument: string, price1: number, price2: number): number {
    const spec = INSTRUMENTS[instrument];
    if (!spec) return 0;

    const priceDiff = Math.abs(price1 - price2);
    
    if (spec.type === 'index' || spec.type === 'commodity') {
      // For indices and gold, the difference is already in points
      return priceDiff;
    } else if (spec.type === 'forex') {
      // For forex, convert to pips
      if (instrument.includes('JPY')) {
        return priceDiff * 100;
      } else {
        return priceDiff * 10000;
      }
    }
    return priceDiff;
  }

  const riskCalculation = useMemo(() => {
    const riskAmount = (riskCalcData.accountBalance * riskCalcData.riskPercentage) / 100;
    const pointDifference = calculatePointDifference(
      riskCalcData.instrument, 
      riskCalcData.entryPrice, 
      riskCalcData.stopLoss
    );
    const pointValue = getPointValue(riskCalcData.instrument, 1);
    const suggestedLotSize = pointDifference > 0 ? riskAmount / (pointDifference * pointValue) : 0;
    
    // Calculate margin required
    const spec = INSTRUMENTS[riskCalcData.instrument];
    const contractValue = riskCalcData.entryPrice * suggestedLotSize * (spec.contractSize || 1);
    const marginRequired = contractValue / riskCalcData.leverage;
    
    return {
      riskAmount,
      pointDifference,
      suggestedLotSize: Math.round(suggestedLotSize * 100) / 100,
      pointValue,
      marginRequired: Math.round(marginRequired * 100) / 100
    };
  }, [riskCalcData]);

  const positionSizeCalculation = useMemo(() => {
    const pointDifference = calculatePointDifference(
      positionSizeData.instrument,
      positionSizeData.entryPrice,
      positionSizeData.stopLoss
    );
    const pointValue = getPointValue(positionSizeData.instrument, 1);
    const suggestedLotSize = pointDifference > 0 ? positionSizeData.riskAmount / (pointDifference * pointValue) : 0;
    const riskPercentage = (positionSizeData.riskAmount / positionSizeData.accountBalance) * 100;
    
    // Calculate margin required
    const spec = INSTRUMENTS[positionSizeData.instrument];
    const contractValue = positionSizeData.entryPrice * suggestedLotSize * (spec.contractSize || 1);
    const marginRequired = contractValue / positionSizeData.leverage;
    
    return {
      pointDifference,
      suggestedLotSize: Math.round(suggestedLotSize * 100) / 100,
      riskPercentage: Math.round(riskPercentage * 100) / 100,
      pointValue,
      marginRequired: Math.round(marginRequired * 100) / 100
    };
  }, [positionSizeData]);

  const pipCalculation = useMemo(() => {
    const pointValue = getPointValue(pipCalcData.instrument, pipCalcData.lotSize);
    const profitLoss = pipCalcData.points * pointValue;
    
    return {
      pointValue,
      profitLoss: Math.round(profitLoss * 100) / 100
    };
  }, [pipCalcData]);

  const riskLevels = [
    { percentage: 1, label: 'Conservative', color: 'bg-green-500' },
    { percentage: 2, label: 'Moderate', color: 'bg-blue-500' },
    { percentage: 3, label: 'Aggressive', color: 'bg-yellow-500' },
    { percentage: 5, label: 'High Risk', color: 'bg-red-500' }
  ];

  // Update entry and stop loss when instrument changes
  const handleInstrumentChange = (value: string, setter: any) => {
    const defaultPrices = {
      'NAS100': { entry: 15850.50, stop: 15800.00 },
      'US30': { entry: 38500.00, stop: 38450.00 },
      'XAUUSD': { entry: 2050.50, stop: 2045.00 },
      'EUR/USD': { entry: 1.0850, stop: 1.0800 },
      'GBP/USD': { entry: 1.2750, stop: 1.2700 },
      'USD/JPY': { entry: 148.50, stop: 148.00 }
    };

    setter((prev: any) => ({
      ...prev,
      instrument: value,
      entryPrice: defaultPrices[value]?.entry || prev.entryPrice,
      stopLoss: defaultPrices[value]?.stop || prev.stopLoss
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-5 h-5 md:w-6 md:h-6 text-[#1E90FF]" />
        <h1 className="text-xl md:text-2xl font-bold">Risk Management Calculator</h1>
      </div>

      <Tabs defaultValue="risk-calculator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="risk-calculator">Risk Calculator</TabsTrigger>
          <TabsTrigger value="position-size">Position Size</TabsTrigger>
          <TabsTrigger value="pip-calculator">Point/Pip Calculator</TabsTrigger>
          <TabsTrigger value="risk-guide">Risk Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="risk-calculator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Calculator</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Calculate lot size based on risk tolerance
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountBalance">Account Balance (USD)</Label>
                  <Input
                    id="accountBalance"
                    type="number"
                    value={riskCalcData.accountBalance}
                    onChange={(e) => setRiskCalcData(prev => ({ 
                      ...prev, 
                      accountBalance: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leverage">Leverage</Label>
                  <Select
                    value={riskCalcData.leverage.toString()}
                    onValueChange={(value) => setRiskCalcData(prev => ({ 
                      ...prev, 
                      leverage: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVERAGE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskPercentage">Risk Percentage (%)</Label>
                  <Input
                    id="riskPercentage"
                    type="number"
                    step="0.1"
                    value={riskCalcData.riskPercentage}
                    onChange={(e) => setRiskCalcData(prev => ({ 
                      ...prev, 
                      riskPercentage: parseFloat(e.target.value) || 0 
                    }))}
                  />
                  <div className="flex gap-1 mt-2">
                    {riskLevels.map((level) => (
                      <Button
                        key={level.percentage}
                        variant="outline"
                        size="sm"
                        onClick={() => setRiskCalcData(prev => ({ 
                          ...prev, 
                          riskPercentage: level.percentage 
                        }))}
                        className={`text-xs ${
                          riskCalcData.riskPercentage === level.percentage ? 'ring-2 ring-[#1E90FF]' : ''
                        }`}
                      >
                        {level.percentage}%
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrument">Instrument</Label>
                  <Select
                    value={riskCalcData.instrument}
                    onValueChange={(value) => handleInstrumentChange(value, setRiskCalcData)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAS100">NAS100 (NASDAQ)</SelectItem>
                      <SelectItem value="US30">US30 (Dow Jones)</SelectItem>
                      <SelectItem value="XAUUSD">XAUUSD (Gold)</SelectItem>
                      <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                      <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                      <SelectItem value="USD/JPY">USD/JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryPrice">Entry Price</Label>
                    <Input
                      id="entryPrice"
                      type="number"
                      step={INSTRUMENTS[riskCalcData.instrument]?.minMove || 0.01}
                      value={riskCalcData.entryPrice}
                      onChange={(e) => setRiskCalcData(prev => ({ 
                        ...prev, 
                        entryPrice: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      step={INSTRUMENTS[riskCalcData.instrument]?.minMove || 0.01}
                      value={riskCalcData.stopLoss}
                      onChange={(e) => setRiskCalcData(prev => ({ 
                        ...prev, 
                        stopLoss: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calculation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Risk Amount</p>
                    <p className="text-lg text-[#1E90FF]">
                      ${riskCalculation.riskAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {INSTRUMENTS[riskCalcData.instrument]?.type === 'forex' ? 'Pip' : 'Point'} Distance
                    </p>
                    <p className="text-lg text-[#28A745]">
                      {riskCalculation.pointDifference.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-center p-4 bg-[#1E90FF]/10 rounded-lg border-2 border-[#1E90FF]">
                  <p className="text-sm text-muted-foreground mb-1">Suggested Lot Size</p>
                  <p className="text-2xl text-[#1E90FF]">
                    {riskCalculation.suggestedLotSize.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>
                      {INSTRUMENTS[riskCalcData.instrument]?.type === 'forex' ? 'Pip' : 'Point'} Value:
                    </span>
                    <span>${riskCalculation.pointValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Margin Required:</span>
                    <span className="text-[#1E90FF]">
                      ${riskCalculation.marginRequired.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Max Loss:</span>
                    <span className="text-red-500">
                      ${riskCalculation.riskAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Leverage Used:</span>
                    <span>1:{riskCalcData.leverage}</span>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Risk Warning:</p>
                      <p>Never risk more than you can afford to lose. Higher leverage increases risk.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="position-size" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Position Size Calculator</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Calculate lot size based on specific risk amount
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="psAccountBalance">Account Balance (USD)</Label>
                  <Input
                    id="psAccountBalance"
                    type="number"
                    value={positionSizeData.accountBalance}
                    onChange={(e) => setPositionSizeData(prev => ({ 
                      ...prev, 
                      accountBalance: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="psLeverage">Leverage</Label>
                  <Select
                    value={positionSizeData.leverage.toString()}
                    onValueChange={(value) => setPositionSizeData(prev => ({ 
                      ...prev, 
                      leverage: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVERAGE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskAmount">Risk Amount (USD)</Label>
                  <Input
                    id="riskAmount"
                    type="number"
                    value={positionSizeData.riskAmount}
                    onChange={(e) => setPositionSizeData(prev => ({ 
                      ...prev, 
                      riskAmount: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="psInstrument">Instrument</Label>
                  <Select
                    value={positionSizeData.instrument}
                    onValueChange={(value) => handleInstrumentChange(value, setPositionSizeData)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAS100">NAS100 (NASDAQ)</SelectItem>
                      <SelectItem value="US30">US30 (Dow Jones)</SelectItem>
                      <SelectItem value="XAUUSD">XAUUSD (Gold)</SelectItem>
                      <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                      <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                      <SelectItem value="USD/JPY">USD/JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="psEntryPrice">Entry Price</Label>
                    <Input
                      id="psEntryPrice"
                      type="number"
                      step={INSTRUMENTS[positionSizeData.instrument]?.minMove || 0.01}
                      value={positionSizeData.entryPrice}
                      onChange={(e) => setPositionSizeData(prev => ({ 
                        ...prev, 
                        entryPrice: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="psStopLoss">Stop Loss</Label>
                    <Input
                      id="psStopLoss"
                      type="number"
                      step={INSTRUMENTS[positionSizeData.instrument]?.minMove || 0.01}
                      value={positionSizeData.stopLoss}
                      onChange={(e) => setPositionSizeData(prev => ({ 
                        ...prev, 
                        stopLoss: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Position Size Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-[#1E90FF]/10 rounded-lg border-2 border-[#1E90FF]">
                  <p className="text-sm text-muted-foreground mb-1">Recommended Lot Size</p>
                  <p className="text-2xl text-[#1E90FF]">
                    {positionSizeCalculation.suggestedLotSize.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Risk %</p>
                    <p className="text-lg text-[#1E90FF]">
                      {positionSizeCalculation.riskPercentage.toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {INSTRUMENTS[positionSizeData.instrument]?.type === 'forex' ? 'Pip' : 'Point'} Distance
                    </p>
                    <p className="text-lg text-[#28A745]">
                      {positionSizeCalculation.pointDifference.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Margin Required:</span>
                    <span className="text-[#1E90FF]">
                      ${positionSizeCalculation.marginRequired.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Leverage:</span>
                    <span>1:{positionSizeData.leverage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pip-calculator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Point/Pip Value Calculator</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Calculate profit/loss value based on points/pips
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pcInstrument">Instrument</Label>
                  <Select
                    value={pipCalcData.instrument}
                    onValueChange={(value) => setPipCalcData(prev => ({ ...prev, instrument: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAS100">NAS100 (NASDAQ)</SelectItem>
                      <SelectItem value="US30">US30 (Dow Jones)</SelectItem>
                      <SelectItem value="XAUUSD">XAUUSD (Gold)</SelectItem>
                      <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                      <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                      <SelectItem value="USD/JPY">USD/JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lotSize">Lot Size</Label>
                  <Input
                    id="lotSize"
                    type="number"
                    step="0.01"
                    value={pipCalcData.lotSize}
                    onChange={(e) => setPipCalcData(prev => ({ 
                      ...prev, 
                      lotSize: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">
                    Number of {INSTRUMENTS[pipCalcData.instrument]?.type === 'forex' ? 'Pips' : 'Points'}
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    value={pipCalcData.points}
                    onChange={(e) => setPipCalcData(prev => ({ 
                      ...prev, 
                      points: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Instrument Info:</p>
                      <p className="text-muted-foreground">
                        {INSTRUMENTS[pipCalcData.instrument]?.displayName}: 
                        {INSTRUMENTS[pipCalcData.instrument]?.type === 'index' && ' $1 per point per lot'}
                        {INSTRUMENTS[pipCalcData.instrument]?.type === 'commodity' && ' 100 oz per lot'}
                        {INSTRUMENTS[pipCalcData.instrument]?.type === 'forex' && ' Standard lot = 100,000 units'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calculation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-[#1E90FF]/10 rounded-lg border-2 border-[#1E90FF]">
                  <p className="text-sm text-muted-foreground mb-1">Profit/Loss</p>
                  <p className={`text-2xl ${
                    pipCalculation.profitLoss >= 0 ? 'text-[#28A745]' : 'text-red-500'
                  }`}>
                    {pipCalculation.profitLoss >= 0 ? '+' : ''}${pipCalculation.profitLoss.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>
                      {INSTRUMENTS[pipCalcData.instrument]?.type === 'forex' ? 'Pip' : 'Point'} Value (per lot):
                    </span>
                    <span>${getPointValue(pipCalcData.instrument, 1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      Per {INSTRUMENTS[pipCalcData.instrument]?.type === 'forex' ? 'Pip' : 'Point'} P&L:
                    </span>
                    <span>${getPointValue(pipCalcData.instrument, pipCalcData.lotSize).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Lots:</span>
                    <span>{pipCalcData.lotSize}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk-guide" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Management Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {riskLevels.map((level) => (
                    <div key={level.percentage} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                      <div>
                        <p className="font-medium">{level.label}</p>
                        <p className="text-sm text-muted-foreground">{level.percentage}% per trade</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <h4 className="font-medium mb-2">Leverage Guidelines</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Beginners: 1:10 to 1:30</p>
                    <p>• Intermediate: 1:50 to 1:100</p>
                    <p>• Advanced: 1:100 to 1:200</p>
                    <p>• Professional: 1:200+</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Management Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">1% Rule</h4>
                    <p className="text-muted-foreground">
                      Never risk more than 1% of your account on a single trade for conservative approach.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">2% Rule</h4>
                    <p className="text-muted-foreground">
                      Most professional traders risk 2% maximum per trade for balanced growth.
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">Position Sizing</h4>
                    <p className="text-muted-foreground">
                      Always calculate position size based on your stop loss distance and leverage.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">Leverage Management</h4>
                    <p className="text-muted-foreground">
                      Higher leverage amplifies both profits and losses. Start with lower leverage.
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <h4 className="font-medium mb-2">Never Risk More Than 5%</h4>
                    <p className="text-muted-foreground">
                      Risking more than 5% per trade can quickly deplete your account even with good win rate.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
