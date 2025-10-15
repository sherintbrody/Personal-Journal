import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Wallet, LogOut } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AddTrade } from './components/AddTrade';
import { TradeLog } from './components/TradeLog';
import { Statistics } from './components/Statistics';
import { PnLCalendar } from './components/PnLCalendar';
import { Journal } from './components/Journal';
import { Notes } from './components/Notes';
import { Settings } from './components/Settings';
import { RiskCalculator } from './components/RiskCalculator';
import { MobileNav } from './components/MobileNav';
import { AccountManager } from './components/AccountManager';
import { Login } from './components/Login';
import { Toaster, toast } from 'sonner';
import { useTrades } from './hooks/useTrades';
import { useJournal } from './hooks/useJournal';
import { useNotes } from './hooks/useNotes';
import { useAccounts } from './hooks/useAccounts';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Button } from './components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';

interface Trade {
  id: string;
  accountId?: string;
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

function AppContent() {
  // ✅ ALL HOOKS MUST BE CALLED FIRST - Before any conditional returns
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  
  // Use Supabase hooks - ALWAYS call these, regardless of auth state
  const { accounts, loading: accountsLoading } = useAccounts();
  
  const { 
    trades: supabaseTrades, 
    loading: tradesLoading, 
    addTrade: addTradeToSupabase, 
    updateTrade: updateTradeInSupabase, 
    deleteTrade: deleteTradeFromSupabase 
  } = useTrades(currentAccountId);

  const {
    entries: journalEntries,
    loading: journalLoading,
    addEntry: addJournalEntry,
    updateEntry: updateJournalEntry,
    deleteEntry: deleteJournalEntry
  } = useJournal();

  const {
    notes,
    loading: notesLoading,
    addNote: addNoteToSupabase,
    updateNote: updateNoteInSupabase,
    deleteNote: deleteNoteFromSupabase
  } = useNotes();

  // Set default account when accounts load
  useEffect(() => {
    if (!accountsLoading && accounts.length > 0 && !currentAccountId) {
      setCurrentAccountId(accounts[0].id);
    }
  }, [accounts, accountsLoading, currentAccountId]);

  // Transform Supabase trades to component format (with Date objects)
  const trades: Trade[] = supabaseTrades.map(trade => ({
    id: trade.id,
    accountId: trade.account_id,
    instrument: trade.instrument,
    lotSize: trade.lot_size,
    entryPrice: trade.entry_price,
    stopLoss: trade.stop_loss,
    takeProfit: trade.take_profit,
    result: trade.result,
    notes: trade.notes || '',
    emotion: trade.emotion || '',
    mindsetBefore: trade.mindset_before || '',
    mindsetAfter: trade.mindset_after || '',
    timestamp: new Date(trade.timestamp),
    type: trade.type,
    exitPrice: trade.exit_price,
    status: trade.status,
    openDate: new Date(trade.open_date),
    closeDate: trade.close_date ? new Date(trade.close_date) : undefined,
  }));

  // Initialize with sample data if database is empty
  useEffect(() => {
    const initializeSampleData = async () => {
      if (!tradesLoading && trades.length === 0 && !isInitialized && currentAccountId) {
        try {
          const sampleTrades = [
            {
              account_id: currentAccountId,
              instrument: 'NAS100',
              lot_size: 0.5,
              entry_price: 15850,
              stop_loss: 15800,
              take_profit: 15950,
              result: 250,
              notes: 'Strong bullish momentum on tech stocks',
              emotion: 'Confident',
              mindset_before: 'Prepared and focused',
              mindset_after: 'Satisfied with execution',
              timestamp: new Date(2024, 9, 15).toISOString(),
              type: 'buy' as const,
              exit_price: 15920,
              status: 'closed' as const,
              open_date: new Date(2024, 9, 15, 9, 30).toISOString(),
              close_date: new Date(2024, 9, 15, 15, 45).toISOString()
            },
            {
              account_id: currentAccountId,
              instrument: 'GOLD',
              lot_size: 0.3,
              entry_price: 1950.50,
              stop_loss: 1945.00,
              take_profit: 1965.00,
              result: -150,
              notes: 'Failed breakout, quick reversal on dollar strength',
              emotion: 'Disappointed',
              mindset_before: 'Optimistic about breakout',
              mindset_after: 'Need better confirmation signals',
              timestamp: new Date(2024, 9, 12).toISOString(),
              type: 'buy' as const,
              exit_price: 1948.20,
              status: 'closed' as const,
              open_date: new Date(2024, 9, 12, 10, 15).toISOString(),
              close_date: new Date(2024, 9, 12, 14, 30).toISOString()
            },
            {
              account_id: currentAccountId,
              instrument: 'US30',
              lot_size: 0.8,
              entry_price: 34980,
              stop_loss: 35030,
              take_profit: 34850,
              result: 520,
              notes: 'Perfect rejection from resistance level',
              emotion: 'Calm',
              mindset_before: 'Patient for setup',
              mindset_after: 'Great patience paid off',
              timestamp: new Date(2024, 9, 10).toISOString(),
              type: 'sell' as const,
              exit_price: 34815,
              status: 'closed' as const,
              open_date: new Date(2024, 9, 10, 8, 0).toISOString(),
              close_date: new Date(2024, 9, 10, 16, 20).toISOString()
            },
            {
              account_id: currentAccountId,
              instrument: 'EUR/USD',
              lot_size: 1.0,
              entry_price: 1.0850,
              stop_loss: 1.0800,
              take_profit: 1.0920,
              result: 350,
              notes: 'ECB rate decision favorable for EUR',
              emotion: 'Focused',
              mindset_before: 'Well prepared for news',
              mindset_after: 'Good risk management',
              timestamp: new Date(2024, 9, 8).toISOString(),
              type: 'buy' as const,
              exit_price: 1.0915,
              status: 'closed' as const,
              open_date: new Date(2024, 9, 8, 7, 30).toISOString(),
              close_date: new Date(2024, 9, 8, 13, 15).toISOString()
            }
          ];

          const { error } = await supabase
            .from('trades')
            .insert(sampleTrades);

          if (error) {
            console.error('Error loading sample data:', error);
          } else {
            toast.success('Sample data loaded!');
          }
        } catch (error) {
          console.error('Error initializing sample data:', error);
        }
        setIsInitialized(true);
      }
    };

    initializeSampleData();
  }, [tradesLoading, trades.length, isInitialized, currentAccountId]);

  // Transform component trade to Supabase format and add
  const addTrade = async (trade: Omit<Trade, 'id' | 'timestamp'>) => {
    try {
      await addTradeToSupabase({
        account_id: currentAccountId,
        instrument: trade.instrument,
        lot_size: trade.lotSize,
        entry_price: trade.entryPrice,
        stop_loss: trade.stopLoss,
        take_profit: trade.takeProfit,
        result: trade.result,
        notes: trade.notes,
        emotion: trade.emotion,
        mindset_before: trade.mindsetBefore,
        mindset_after: trade.mindsetAfter,
        timestamp: new Date().toISOString(),
        type: trade.type,
        exit_price: trade.exitPrice,
        status: trade.status,
        open_date: trade.openDate.toISOString(),
        close_date: trade.closeDate?.toISOString(),
      });
    } catch (error) {
      console.error('Error adding trade:', error);
    }
  };

  // Transform component trade to Supabase format and update
  const updateTrade = async (trade: Trade) => {
    try {
      await updateTradeInSupabase(trade.id, {
        instrument: trade.instrument,
        lot_size: trade.lotSize,
        entry_price: trade.entryPrice,
        stop_loss: trade.stopLoss,
        take_profit: trade.takeProfit,
        result: trade.result,
        notes: trade.notes,
        emotion: trade.emotion,
        mindset_before: trade.mindsetBefore,
        mindset_after: trade.mindsetAfter,
        type: trade.type,
        exit_price: trade.exitPrice,
        status: trade.status,
        close_date: trade.closeDate?.toISOString(),
      });
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  };

  // Delete trade
  const deleteTrade = async (tradeId: string) => {
    try {
      await deleteTradeFromSupabase(tradeId);
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  // Mini account selector component for Dashboard
  const MiniAccountSelector = () => {
    const currentAccount = accounts.find(a => a.id === currentAccountId);
    
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#1E90FF]" />
          <Select value={currentAccountId} onValueChange={setCurrentAccountId}>
            <SelectTrigger className="w-[200px] h-8">
              <SelectValue placeholder="Select account">
                {currentAccount && (
                  <span className="text-sm">
                    {currentAccount.name}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <span>{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({account.broker})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    // Combined loading state
    const isLoading = tradesLoading || journalLoading || notesLoading || accountsLoading;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading your trading data...</p>
            <p className="text-sm text-muted-foreground mt-2">
              {accountsLoading && '💼 Loading accounts...'}
              {tradesLoading && '📊 Loading trades...'}
              {journalLoading && '📔 Loading journal...'}
              {notesLoading && '📝 Loading notes...'}
            </p>
          </div>
        </div>
      );
    }

    // Show account creation if no accounts exist
    if (!currentAccountId && accounts.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-[#1E90FF]" />
              <h2 className="text-xl font-bold mb-2">Welcome!</h2>
              <p className="text-muted-foreground mb-4">
                Create your first trading account to get started
              </p>
              <AccountManager 
                currentAccountId={currentAccountId}
                onAccountChange={setCurrentAccountId}
              />
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            {/* Mini account selector only for dashboard */}
            <div className="flex justify-between items-center">
              <MiniAccountSelector />
            </div>
            <Dashboard trades={trades} />
          </div>
        );
      case 'add-trade':
        return <AddTrade onAddTrade={addTrade} currentAccountId={currentAccountId} />;
      case 'trade-log':
        return <TradeLog trades={trades} onUpdateTrade={updateTrade} onDeleteTrade={deleteTrade} />;
      case 'statistics':
        return <Statistics trades={trades} />;
      case 'pnl-calendar':
        return <PnLCalendar trades={trades} />;
      case 'journal':
        return (
          <Journal 
            entries={journalEntries}
            onAddEntry={addJournalEntry}
            onUpdateEntry={updateJournalEntry}
            onDeleteEntry={deleteJournalEntry}
          />
        );
      case 'notes':
        return (
          <Notes
            notes={notes}
            onAddNote={addNoteToSupabase}
            onUpdateNote={updateNoteInSupabase}
            onDeleteNote={deleteNoteFromSupabase}
          />
        );
      case 'risk-calculator':
        return <RiskCalculator />;
      case 'settings':
        return (
          <Settings 
            currentAccountId={currentAccountId}
            onAccountChange={setCurrentAccountId}
          />
        );
      default:
        return <Dashboard trades={trades} />;
    }
  };

  // ✅ NOW we can do conditional rendering AFTER all hooks are called
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1E90FF] mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Toaster position="top-right" richColors />
      
      {/* Desktop Layout - Fixed Container */}
      <div className="hidden md:flex h-full">
        {/* Sidebar - Fixed Position */}
        <div className="flex-shrink-0">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isMobile={false}
          />
        </div>
        
        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-full overflow-y-auto">
        <MobileNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
        />
        <main className="pb-20 px-4 py-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Main App component wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
