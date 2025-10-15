import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, Edit, Trash2, Wallet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { TradingAccount } from '../lib/supabase';
import { useAccounts } from '../hooks/useAccounts';

interface AccountManagerProps {
  currentAccountId: string;
  onAccountChange: (accountId: string) => void;
}

interface DeleteConfirmation {
  accountId: string;
  position: { top: number; left: number };
}

export function AccountManager({ currentAccountId, onAccountChange }: AccountManagerProps) {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    broker: '',
    account_number: '',
    initial_balance: 10000,
    currency: 'USD'
  });

  const handleSave = async () => {
    if (!formData.name || !formData.broker) {
      toast.error('Please fill in account name and broker');
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData);
      } else {
        const newAccount = await addAccount(formData);
        if (accounts.length === 0 && newAccount) {
          onAccountChange(newAccount.id);
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleEdit = (account: TradingAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      broker: account.broker,
      account_number: account.account_number || '',
      initial_balance: account.initial_balance,
      currency: account.currency
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (accountId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (accounts.length === 1) {
      toast.error('Cannot delete the last account');
      return;
    }

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setDeleteConfirmation({
      accountId,
      position: {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX - 250,
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const accountId = deleteConfirmation.accountId;

    try {
      await deleteAccount(accountId);
      if (currentAccountId === accountId && accounts.length > 1) {
        const remainingAccounts = accounts.filter(a => a.id !== accountId);
        if (remainingAccounts.length > 0) {
          onAccountChange(remainingAccounts[0].id);
        }
      }
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      broker: '',
      account_number: '',
      initial_balance: 10000,
      currency: 'USD'
    });
    setEditingAccount(null);
    setIsDialogOpen(false);
  };

  const currentAccount = accounts.find(a => a.id === currentAccountId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-[#1E90FF]" />
          <Select value={currentAccountId} onValueChange={onAccountChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} - {account.broker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {currentAccount && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Account</p>
                <p className="font-medium">{currentAccount.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Broker</p>
                <p className="font-medium">{currentAccount.broker}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Initial Balance</p>
                <p className="font-medium">
                  {currentAccount.currency} {currentAccount.initial_balance.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(currentAccount)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleDeleteClick(currentAccount.id, e)}
                  className="text-red-500 hover:text-red-700"
                  disabled={accounts.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <h3 className="font-semibold text-sm">Delete Account</h3>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update your trading account details' : 'Create a new trading account'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Account, Demo Account"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="broker">Broker *</Label>
              <Input
                id="broker"
                placeholder="e.g., IC Markets, OANDA"
                value={formData.broker}
                onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                placeholder="Optional"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial_balance">Initial Balance</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#1E90FF] hover:bg-[#1E90FF]/90">
              {editingAccount ? 'Update' : 'Create'} Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
