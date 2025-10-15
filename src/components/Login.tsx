import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, User, Lock, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
    
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1E90FF]/10 via-background to-[#28A745]/10 p-4">
      <div className="w-full max-w-sm space-y-6 px-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2.5 bg-[#1E90FF] rounded-xl shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
          <p className="text-sm text-muted-foreground">
            Professional Trading Performance Tracker
          </p>
        </div>

        {/* Login Card - Wider Version with Better Padding */}
        <Card className="border-2 shadow-2xl">
          <CardHeader className="space-y-1 pb-4 pt-6 px-8">
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center text-xs">
              Sign in to access your trading dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 text-sm"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1.5 text-xs">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pr-10 text-sm"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1.5"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-1/2 h-10 bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-sm mt-5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pb-5 pt-2 px-8">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-[#28A745]" />
              <span>Secure Trading Journal System</span>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-1.5">
          <p className="text-[10px] text-muted-foreground">
            © 2024 Trading Journal. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#1E90FF]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#28A745]/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
