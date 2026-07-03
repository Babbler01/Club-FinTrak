import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { Mail, Lock, Database, ArrowRight, Activity } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, bypassAuthForDemo } = useAuth();
  const { supabaseConfigured } = useDb();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const { error: authError } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);
        
      if (authError) {
        setError(authError.message || 'An authentication error occurred.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white shadow-lg mb-4 hover:scale-105 transition-transform duration-200">
          <Activity className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Club FinTrak
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Professional financial management for club treasurers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          
          {/* Mode Badge */}
          <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-start">
              <Database className={`w-5 h-5 mt-0.5 mr-3 ${supabaseConfigured ? 'text-primary' : 'text-amber-500'}`} />
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Database Connection: {supabaseConfigured ? 'Supabase' : 'Demo Mode'}
                </h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {supabaseConfigured 
                    ? 'Connected to your cloud Supabase database.' 
                    : 'No Supabase credentials found. App is running locally via browser Storage. Feel free to use mock accounts or click Quick Launch.'
                  }
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-slate-50/50"
                  placeholder="treasurer@yourclub.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-slate-50/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 cursor-pointer"
              >
                {loading 
                  ? 'Processing...' 
                  : isSignUp 
                    ? 'Create Treasurer Account' 
                    : 'Sign In as Treasurer'
                }
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or</span>
              </div>
            </div>

            {/* Quick Demo Access (Only visible when Supabase not configured) */}
            {!supabaseConfigured && (
              <button
                onClick={bypassAuthForDemo}
                className="mt-6 w-full flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer group"
              >
                Quick Launch Demo
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-sm font-medium text-primary hover:underline cursor-pointer focus:outline-none"
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : 'New to Club Fintrak? Create Account'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
