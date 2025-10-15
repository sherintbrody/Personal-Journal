import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { InstrumentSelect } from './InstrumentSelect';
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
  type: 'buy' | 'sell';
  exitPrice?: number;
  status: 'open' | 'closed';
  openDate: Date;
  closeDate?: Date;
  timestamp: Date;
}

interface AddTradeProps {
  onAddTrade?: (trade: Trade) => void;
  currentAccountId: string; // ADD THIS
}
const EMOTIONS = [
  'Calm', 'Confident', 'Fearful', 'Greedy', 'Frustrated', 'Euphoric', 
  'Hesitant', 'Focused', 'Stressed', 'Optimistic', 'Pessimistic', 'Neutral'
];

// Helper function to format date for datetime-local input
const formatDateForInput = (date: Date | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const adjustedDate = new Date(d.getTime() - offset * 60000);
  return adjustedDate.toISOString().slice(0, 16);
};

export function AddTrade({ onAddTrade, currentAccountId }: AddTradeProps){
  const [formData, setFormData] = useState<Trade>({
    id: '',
    instrument: '',
    lotSize: 0,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    result: 0,
    notes: '',
    emotion: '',
    mindsetBefore: '',
    mindsetAfter: '',
    type: 'buy',
    status: 'closed',
    openDate: new Date(),
    closeDate: new Date(),
    timestamp: new Date()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.instrument || !formData.lotSize || !formData.entryPrice) {
      toast.error('Please complete Instrument, Entry Price, and Lot Size');
      return;
    }

    if (formData.lotSize <= 0 || formData.entryPrice <= 0) {
      toast.error('Lot Size and Entry Price must be greater than 0');
      return;
    }

    // If status is open, clear the close date and exit price
    const tradeData = formData.status === 'open' 
      ? { ...formData, closeDate: undefined, exitPrice: undefined, result: 0 }
      : formData;

    // Create trade with unique ID and timestamp
    const newTrade: Trade = {
      ...tradeData,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    // Save to localStorage
    const existingTrades = JSON.parse(localStorage.getItem('trades') || '[]');
    existingTrades.push(newTrade);
    localStorage.setItem('trades', JSON.stringify(existingTrades));

    // Trigger storage event for same-tab updates
    window.dispatchEvent(new Event('tradesUpdated'));

    // Call parent callback if provided
    if (onAddTrade) {
      onAddTrade(newTrade);
    }

    toast.success('Trade added successfully!');
    
    // Reset form
    setFormData({
      id: '',
      instrument: '',
      lotSize: 0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      result: 0,
      notes: '',
      emotion: '',
      mindsetBefore: '',
      mindsetAfter: '',
      type: 'buy',
      status: 'closed',
      openDate: new Date(),
      closeDate: new Date(),
      timestamp: new Date()
    });
  };

  const updateField = (field: keyof Trade, value: any) => {
    setFormData(prev => {
      // If changing status to open, clear close date and exit price
      if (field === 'status' && value === 'open') {
        return { 
          ...prev, 
          [field]: value,
          closeDate: undefined,
          exitPrice: undefined,
          result: 0
        };
      }
      // If changing status to closed and no close date, set current date
      if (field === 'status' && value === 'closed' && !prev.closeDate) {
        return { 
          ...prev, 
          [field]: value,
          closeDate: new Date()
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const calculatePnL = () => {
    if (!formData.entryPrice || !formData.exitPrice || !formData.lotSize) return;
    
    const pipValue = 10; // Simplified pip value for major pairs
    let pips = 0;
    
    if (formData.type === 'buy') {
      pips = (formData.exitPrice - formData.entryPrice) * 10000;
    } else {
      pips = (formData.entryPrice - formData.exitPrice) * 10000;
    }
    
    const pnl = pips * pipValue * formData.lotSize;
    updateField('result', Math.round(pnl * 100) / 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl">Add New Trade</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Trade Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instrument">Instrument *</Label>
                <InstrumentSelect
                  value={formData.instrument}
                  onValueChange={(value) => updateField('instrument', value)}
                  placeholder="Select instrument..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openDate">Open Date & Time *</Label>
                  <Input
                    id="openDate"
                    type="datetime-local"
                    value={formatDateForInput(formData.openDate)}
                    onChange={(e) => updateField('openDate', e.target.value ? new Date(e.target.value) : new Date())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trade Status *</Label>
                  <Select value={formData.status} onValueChange={(value: 'open' | 'closed') => updateField('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open (Active)</SelectItem>
                      <SelectItem value="closed">Closed (Completed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.status === 'closed' && (
                <div className="space-y-2">
                  <Label htmlFor="closeDate">Close Date & Time</Label>
                  <Input
                    id="closeDate"
                    type="datetime-local"
                    value={formatDateForInput(formData.closeDate)}
                    onChange={(e) => updateField('closeDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Order Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value: 'buy' | 'sell') => updateField('type', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buy" id="buy" />
                    <Label htmlFor="buy">Buy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sell" id="sell" />
                    <Label htmlFor="sell">Sell</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lotSize">Lot Size *</Label>
                  <Input
                    id="lotSize"
                    type="number"
                    step="0.01"
                    value={formData.lotSize || ''}
                    onChange={(e) => updateField('lotSize', parseFloat(e.target.value) || 0)}
                    placeholder="0.10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Entry Price *</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    step="0.00001"
                    value={formData.entryPrice || ''}
                    onChange={(e) => updateField('entryPrice', parseFloat(e.target.value) || 0)}
                    placeholder="1.08500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.00001"
                    value={formData.stopLoss || ''}
                    onChange={(e) => updateField('stopLoss', parseFloat(e.target.value) || 0)}
                    placeholder="1.08000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    step="0.00001"
                    value={formData.takeProfit || ''}
                    onChange={(e) => updateField('takeProfit', parseFloat(e.target.value) || 0)}
                    placeholder="1.09500"
                  />
                </div>
              </div>

              {formData.status === 'closed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exitPrice">Exit Price</Label>
                    <Input
                      id="exitPrice"
                      type="number"
                      step="0.00001"
                      value={formData.exitPrice || ''}
                      onChange={(e) => {
                        updateField('exitPrice', parseFloat(e.target.value) || 0);
                        setTimeout(calculatePnL, 100);
                      }}
                      placeholder="1.09200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="result">P&L (USD)</Label>
                    <Input
                      id="result"
                      type="number"
                      step="0.01"
                      value={formData.result || ''}
                      onChange={(e) => updateField('result', parseFloat(e.target.value) || 0)}
                      placeholder="250.00"
                      className={formData.result > 0 ? 'text-green-600 font-semibold' : formData.result < 0 ? 'text-red-600 font-semibold' : ''}
                    />
                  </div>
                </div>
              )}

              {formData.status === 'open' && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ℹ️ This trade is marked as <strong>Open</strong>. You can update it later when the trade is closed.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Trading Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Entry reason, market conditions, setup used..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Psychology Management */}
          <Card>
            <CardHeader>
              <CardTitle>Psychology Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emotion">Emotion During Trading</Label>
                <Select value={formData.emotion} onValueChange={(value) => updateField('emotion', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dominant emotion" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONS.map((emotion) => (
                      <SelectItem key={emotion} value={emotion}>{emotion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mindsetBefore">Mindset Before Trade</Label>
                <Textarea
                  id="mindsetBefore"
                  value={formData.mindsetBefore}
                  onChange={(e) => updateField('mindsetBefore', e.target.value)}
                  placeholder="How you feel and think before entering the trade..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mindsetAfter">
mindset After Trade{formData.status === 'open' ? ' (Optional - Update Later)' : ''}</Label>
                <Textarea
                  id="mindsetAfter"
                  value={formData.mindsetAfter}
                  onChange={(e) => updateField('mindsetAfter', e.target.value)}
                  placeholder={formData.status === 'open' 
                    ? "You can add your reflection when the trade is closed..." 
                    : "Reflection after trade completion, lessons learned..."}
                  rows={3}
                />
              </div>

              <div className="bg-[#1E90FF]/10 p-4 rounded-lg">
                <h4 className="text-sm mb-2">Trading Psychology Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Stay calm and objective in every decision</li>
                  <li>• Don't trade when emotionally unstable</li>
                  <li>• Always follow your trading plan</li>
                  <li>• Learn from every trade, both profit and loss</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => {
            setFormData({
              id: '',
              instrument: '',
              lotSize: 0,
              entryPrice: 0,
              stopLoss: 0,
              takeProfit: 0,
              result: 0,
              notes: '',
              emotion: '',
              mindsetBefore: '',
              mindsetAfter: '',
              type: 'buy',
              status: 'closed',
              openDate: new Date(),
              closeDate: new Date(),
              timestamp: new Date()
            });
          }}>
            Reset Form
          </Button>
          <Button 
            type="submit" 
            className="bg-[#1E90FF] hover:bg-[#1E90FF]/90"
          >
            Save Trade
          </Button>
        </div>
      </form>
    </div>
  );
}
