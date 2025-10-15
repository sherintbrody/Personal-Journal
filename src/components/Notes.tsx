import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Plus, Edit2, Trash2, StickyNote, BookMarked, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

interface NotesProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const CATEGORIES = [
  'Strategy',
  'Risk Management',
  'Psychology',
  'Market Analysis',
  'Lessons Learned',
  'Goals',
  'Ideas',
  'Resources',
  'General'
];

const CATEGORY_COLORS: Record<string, string> = {
  'Strategy': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Risk Management': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Psychology': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Market Analysis': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Lessons Learned': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Goals': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Ideas': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Resources': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'General': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

export function Notes({ notes, onAddNote, onUpdateNote, onDeleteNote }: NotesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'General'
  });

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [notes, searchTerm, filterCategory]);

  const notesByCategory = useMemo(() => {
    return CATEGORIES.map(category => ({
      category,
      count: notes.filter(n => n.category === category).length,
      notes: notes.filter(n => n.category === category)
    })).filter(cat => cat.count > 0);
  }, [notes]);

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      await onAddNote({
        title: newNote.title,
        content: newNote.content,
        category: newNote.category
      });
      
      setNewNote({ title: '', content: '', category: 'General' });
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      await onUpdateNote(editingNote.id, {
        title: editingNote.title,
        content: editingNote.content,
        category: editingNote.category
      });
      
      setEditingNote(null);
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await onDeleteNote(id);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote({ ...note });
    setIsAddingNote(false);
  };

  const cancelEdit = () => {
    setEditingNote(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-[#1E90FF]" />
            Trading Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture ideas, strategies, and lessons
          </p>
        </div>
        <Button 
          onClick={() => {
            setIsAddingNote(!isAddingNote);
            setEditingNote(null);
          }}
          className="bg-[#1E90FF] hover:bg-[#1E90FF]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isAddingNote ? 'Cancel' : 'New Note'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Notes</p>
              <p className="text-2xl font-bold text-[#1E90FF]">{notes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold text-[#28A745]">{notesByCategory.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold text-[#FFC107]">
                {notes.filter(n => {
                  const noteDate = new Date(n.created_at || 0);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return noteDate >= weekAgo;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold text-[#6F42C1]">
                {notes.filter(n => {
                  const noteDate = new Date(n.created_at || 0);
                  const today = new Date();
                  return noteDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Note Form */}
      {(isAddingNote || editingNote) && (
        <Card className="border-[#1E90FF]/30">
          <CardHeader>
            <CardTitle>{editingNote ? 'Edit Note' : 'New Note'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={editingNote ? editingNote.title : newNote.title}
                onChange={(e) => editingNote 
                  ? setEditingNote({ ...editingNote, title: e.target.value })
                  : setNewNote(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Important Risk Management Rule"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={editingNote ? editingNote.category : newNote.category} 
                onValueChange={(value) => editingNote
                  ? setEditingNote({ ...editingNote, category: value })
                  : setNewNote(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={editingNote ? editingNote.content : newNote.content}
                onChange={(e) => editingNote
                  ? setEditingNote({ ...editingNote, content: e.target.value })
                  : setNewNote(prev => ({ ...prev, content: e.target.value }))
                }
                placeholder="Write your note here..."
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={editingNote ? cancelEdit : () => setIsAddingNote(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingNote ? handleUpdateNote : handleAddNote}
                className="bg-[#1E90FF] hover:bg-[#1E90FF]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                {editingNote ? 'Update' : 'Save'} Note
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
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Notes</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start capturing your trading insights and ideas
                </p>
                <Button 
                  onClick={() => setIsAddingNote(true)}
                  className="bg-[#1E90FF] hover:bg-[#1E90FF]/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-2">{note.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {note.category && (
                            <Badge 
                              variant="secondary" 
                              className={CATEGORY_COLORS[note.category] || ''}
                            >
                              {note.category}
                            </Badge>
                          )}
                          {note.created_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(note)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                      {note.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {notesByCategory.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No notes in any category yet</p>
              </CardContent>
            </Card>
          ) : (
            notesByCategory.map(({ category, count, notes: categoryNotes }) => (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-[#1E90FF]" />
                      {category}
                    </CardTitle>
                    <Badge variant="outline">{count} notes</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryNotes.slice(0, 3).map((note) => (
                      <div key={note.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{note.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {note.content}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(note)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#FFC107]" />
                Note Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#1E90FF]" />
                  Trading Strategy Template
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Strategy Name:</strong> [Name your strategy]</p>
                  <p><strong>Entry Criteria:</strong> [When to enter]</p>
                  <p><strong>Exit Criteria:</strong> [When to exit]</p>
                  <p><strong>Risk Management:</strong> [Stop loss, position size]</p>
                  <p><strong>Best Market Conditions:</strong> [Trending, ranging, etc.]</p>
                  <p><strong>Notes:</strong> [Additional observations]</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Lesson Learned Template</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>What Happened:</strong> [Describe the situation]</p>
                  <p><strong>What I Did:</strong> [Your actions]</p>
                  <p><strong>Result:</strong> [Outcome]</p>
                  <p><strong>Lesson:</strong> [What you learned]</p>
                  <p><strong>Action Plan:</strong> [How to avoid/repeat]</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Market Analysis Template</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Pair/Asset:</strong> [What you're analyzing]</p>
                  <p><strong>Timeframe:</strong> [Chart timeframe]</p>
                  <p><strong>Trend:</strong> [Bullish/Bearish/Sideways]</p>
                  <p><strong>Key Levels:</strong> [Support/Resistance]</p>
                  <p><strong>Indicators:</strong> [What indicators say]</p>
                  <p><strong>Bias:</strong> [Your trading bias]</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
