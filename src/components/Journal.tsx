import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar as CalendarIcon, Plus, Search, Trash2, AlertTriangle } from 'lucide-react';
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

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

interface JournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  trades?: Trade[];
}

interface DeleteConfirmation {
  entryId: string;
  position: { top: number; left: number };
}

const MOODS = [
  'Excellent', 'Good', 'Neutral', 'Anxious', 'Frustrated', 'Confident', 'Uncertain', 'Motivated'
];

const TAGS = [
  'Trading Strategy', 'Risk Management', 'Psychology', 'Market Analysis', 
  'Discipline', 'Patience', 'Learning', 'Breakthrough', 'Setback', 'Goal Setting'
];

export function Journal({ entries, onAddEntry, onUpdateEntry, onDeleteEntry, trades = [] }: JournalProps) {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);

  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: '',
    tags: [] as string[]
  });

  const getDayStats = (dateString: string) => {
    const date = new Date(dateString);
    const dayTrades = trades.filter(t => 
      t.status === 'closed' && 
      t.timestamp.toDateString() === date.toDateString()
    );
    
    const totalPnL = dayTrades.reduce((sum, t) => sum + t.result, 0);
    const wins = dayTrades.filter(t => t.result > 0).length;
    const losses = dayTrades.filter(t => t.result < 0).length;
    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
    
    return {
      totalTrades: dayTrades.length,
      totalPnL,
      wins,
      losses,
      winRate,
      trades: dayTrades
    };
  };

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return getDayStats(today);
  }, [trades]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesMood = filterMood === 'all' || entry.mood === filterMood;
      
      return matchesSearch && matchesMood;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, searchTerm, filterMood]);

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      await onAddEntry({
        title: newEntry.title,
        content: newEntry.content,
        date: new Date().toISOString().split('T')[0],
        mood: newEntry.mood || undefined,
        tags: newEntry.tags.length > 0 ? newEntry.tags : undefined
      });
      
      setNewEntry({
        title: '',
        content: '',
        mood: '',
        tags: []
      });
      setIsAddingEntry(false);
      toast.success('Journal entry added successfully!');
    } catch (error) {
      console.error('Error adding journal entry:', error);
      toast.error('Failed to add journal entry');
    }
  };

  const handleDeleteClick = (entryId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setDeleteConfirmation({
      entryId,
      position: {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX - 250,
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      await onDeleteEntry(deleteConfirmation.entryId);
      toast.success('Journal entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete journal entry');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const toggleTag = (tag: string) => {
    setNewEntry(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#1E90FF]" />
            Trading Journal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily reflections and trading insights
          </p>
        </div>
        <Button 
          onClick={() => setIsAddingEntry(!isAddingEntry)}
          className="bg-[#1E90FF] hover:bg-[#1E90FF]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAddingEntry ? 'Cancel' : 'New Entry'}
        </Button>
      </div>

      {/* Today's Trading Summary */}
      {trades.length > 0 && (
        <Card className="bg-gradient-to-br from-[#1E90FF]/10 to-transparent border-[#1E90FF]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#1E90FF]" />
              Today's Trading Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold text-[#1E90FF]">{todayStats.totalTrades}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className={`text-2xl font-bold ${todayStats.totalPnL >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                  ${todayStats.totalPnL.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{todayStats.winRate.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">W/L</p>
                <p className="text-2xl font-bold">
                  <span className="text-[#28A745]">{todayStats.wins}</span>
                  /
                  <span className="text-red-500">{todayStats.losses}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Entry Form */}
      {isAddingEntry && (
        <Card className="border-[#1E90FF]/30">
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Entry Title *</Label>
              <Input
                id="title"
                value={newEntry.title}
                onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Great Trading Day - Followed My Plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">How are you feeling today?</Label>
              <Select value={newEntry.mood} onValueChange={(value) => setNewEntry(prev => ({ ...prev, mood: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your mood" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((mood) => (
                    <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags (Select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={newEntry.tags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer ${newEntry.tags.includes(tag) ? 'bg-[#1E90FF]' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Journal Entry *</Label>
              <Textarea
                id="content"
                value={newEntry.content}
                onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your thoughts, reflections, lessons learned, what went well, what to improve..."
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Include what went well, what to improve, key lessons, and goals for tomorrow
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEntry} className="bg-[#1E90FF] hover:bg-[#1E90FF]/90">
                <Plus className="w-4 h-4 mr-2" />
                Save Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search journal entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterMood} onValueChange={setFilterMood}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Moods</SelectItem>
                {MOODS.map((mood) => (
                  <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries Timeline */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start documenting your trading journey by creating your first entry
              </p>
              <Button 
                onClick={() => setIsAddingEntry(true)}
                className="bg-[#1E90FF] hover:bg-[#1E90FF]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => {
            const dayStats = getDayStats(entry.date);
            const entryDate = new Date(entry.date);
            
            return (
              <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-5 h-5 text-[#1E90FF]" />
                        {entry.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entryDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                      {entry.mood && (
                        <Badge variant="outline" className="bg-[#1E90FF]/10">
                          {entry.mood}
                        </Badge>
                      )}
                      {dayStats.totalTrades > 0 && (
                        <Badge 
                          variant={dayStats.totalPnL >= 0 ? 'default' : 'destructive'}
                          className={dayStats.totalPnL >= 0 ? 'bg-[#28A745]' : ''}
                        >
                          ${dayStats.totalPnL.toFixed(2)}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(entry.id, e)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Day's Trading Stats */}
                  {dayStats.totalTrades > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Trading Summary</p>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Trades</p>
                          <p className="font-medium">{dayStats.totalTrades}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className="font-medium">{dayStats.winRate.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Wins</p>
                          <p className="font-medium text-[#28A745]">{dayStats.wins}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Losses</p>
                          <p className="font-medium text-red-500">{dayStats.losses}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Entry Content */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                  </div>

                  {/* Timestamp */}
                  {entry.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(entry.created_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Journal Tips */}
      <Card className="bg-gradient-to-br from-[#1E90FF]/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base">Journaling Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Write your journal entry at the end of each trading day while everything is fresh</li>
            <li>• Be honest about your emotions and decisions - this is for your growth</li>
            <li>• Focus on the process, not just the results</li>
            <li>• Review past entries weekly to identify patterns and progress</li>
            <li>• Use specific examples rather than general statements</li>
            <li>• Celebrate small wins and learn from every mistake</li>
          </ul>
        </CardContent>
      </Card>

      {/* Delete Confirmation Toast */}
      {deleteConfirmation && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={cancelDelete}
          />
          
          {/* Confirmation Toast */}
          <div
            className="fixed z-50 animate-in slide-in-from-top-2 fade-in duration-300"
            style={{
              top: `${deleteConfirmation.position.top}px`,
              left: `${deleteConfirmation.position.left}px`,
            }}
          >
            <div className="bg-background border border-red-200 dark:border-red-900 rounded-lg shadow-2xl p-4 w-[280px]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm">Delete Entry</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Are you sure? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelDelete}
                      className="flex-1 text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={confirmDelete}
                      className="flex-1 text-xs h-8 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
