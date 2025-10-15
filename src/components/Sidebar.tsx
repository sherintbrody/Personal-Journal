import React, { useState } from 'react';
import { 
  BarChart3, 
  Plus, 
  TrendingUp, 
  BookOpen, 
  Calculator, 
  Settings as SettingsIcon,
  Home,
  Calendar,
  List,
  User,
  LogOut,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile?: boolean;
}

interface LogoutConfirmation {
  position: { top: number; left: number };
}

export function Sidebar({ activeTab, setActiveTab, isMobile = false }: SidebarProps) {
  const { logout, user } = useAuth();
  const [logoutConfirmation, setLogoutConfirmation] = useState<LogoutConfirmation | null>(null);
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-trade', label: 'Add Trade', icon: Plus },
    { id: 'trade-log', label: 'Trade Log', icon: List },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'pnl-calendar', label: 'P&L Calendar', icon: Calendar },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'risk-calculator', label: 'Risk Calculator', icon: Calculator },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogoutClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setLogoutConfirmation({
      position: {
        top: rect.top + window.scrollY - 120, // Position above the button
        left: rect.left + window.scrollX,
      }
    });
  };

  const confirmLogout = async () => {
    setLogoutConfirmation(null);
    await logout();
    toast.success("You've been logged out successfully.");
  };

  const cancelLogout = () => {
    setLogoutConfirmation(null);
  };

  return (
    <>
      <aside className="w-64 bg-card border-r border-border h-screen flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <TrendingUp className="w-6 h-6" style={{ color: '#1E90FF' }} />
              <Shield className="w-3 h-3 absolute -bottom-1 -right-1 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold">Trading Journal</h1>
          </div>
          <p className="text-sm text-muted-foreground">Professional Trading Tracker</p>
        </div>
        
        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start gap-2 ${
                    activeTab === item.id 
                      ? 'bg-[#1E90FF] text-white hover:bg-[#1E90FF]/90' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="p-4 border-t border-border bg-muted/30 flex-shrink-0">
          <div className="space-y-3">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#1E90FF]/10 rounded-full flex-shrink-0">
                  <User className="w-4 h-4 text-[#1E90FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Logged in as</p>
                  <p className="text-sm font-medium truncate">
                    {user.email || 'trader@example.com'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
              onClick={handleLogoutClick}
            >
              <LogOut className="w-3 h-3" />
              Logout
            </Button>

            {/* Copyright */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground text-center">
                © 2024 Trading Journal
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-green-500" />
                Secure Session
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Toast */}
      {logoutConfirmation && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={cancelLogout}
          />
          
          {/* Confirmation Toast */}
          <div
            className="fixed z-50 animate-in slide-in-from-top-2 fade-in duration-300"
            style={{
              top: `${logoutConfirmation.position.top}px`,
              left: `${logoutConfirmation.position.left}px`,
            }}
          >
            <div className="bg-background border border-red-200 dark:border-red-900 rounded-lg shadow-2xl p-4 w-[280px]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm">Confirm Logout</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Are you sure you want to logout from your account?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelLogout}
                      className="flex-1 text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={confirmLogout}
                      className="flex-1 text-xs h-8 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
