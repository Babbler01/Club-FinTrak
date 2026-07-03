import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { saveSupabaseConfig, clearSupabaseConfig, getSupabaseConfig } from '../lib/supabase';
import { 
  Database, 
  Settings as SettingsIcon, 
  Save, 
  Trash2, 
  RefreshCw, 
  Check, 
  Copy,
  AlertTriangle,
  Code
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { isDemoMode, reloadConfig, resetDatabaseToDemo } = useDb();
  
  // Connection Form State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Load current values
  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl.trim() && supabaseKey.trim()) {
      saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      reloadConfig();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    reloadConfig();
  };

  const handleResetDemoData = () => {
    if (window.confirm("This will reset the browser's database and restore default demo transactions, members, and budgets. Proceed?")) {
      resetDatabaseToDemo();
      alert("Browser database has been reset to demo seed data.");
    }
  };

  const sqlSchema = `-- SQL Schema Migration for Club FinTrak
-- Paste this script into your Supabase SQL Editor to set up your tables.

-- 1. Create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT CHECK (status IN ('cleared', 'pending')) NOT NULL DEFAULT 'cleared',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create dues records table
CREATE TABLE IF NOT EXISTS dues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('paid', 'unpaid', 'overdue')) NOT NULL DEFAULT 'unpaid',
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  category TEXT PRIMARY KEY,
  limit_amount NUMERIC(12, 2) NOT NULL,
  period TEXT NOT NULL DEFAULT 'Monthly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure database connections, reset local storage, and manage credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Connection panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Supabase connection card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Supabase Cloud Connection</h3>
                <p className="text-xs text-slate-400">Connect the dashboard to your live cloud SQL database.</p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              
              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  Credentials updated. Refreshing database connection...
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Supabase Anon API Key
                </label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50/30 font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-primary hover:bg-primary/95 cursor-pointer"
                >
                  <Save className="w-4 h-4 mr-2 text-secondary" />
                  Connect Supabase
                </button>

                {!isDemoMode && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 cursor-pointer"
                  >
                    Disconnect Database
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Database migrations card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Database Schema Setup</h3>
                  <p className="text-xs text-slate-400">Initialize tables in your Supabase project.</p>
                </div>
              </div>
              
              <button
                onClick={copySqlToClipboard}
                className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-950 bg-white hover:bg-slate-50 cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                    Copied SQL!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy SQL Migration
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 overflow-hidden border border-slate-800 shadow-inner">
              <pre className="text-[10px] text-slate-300 font-mono overflow-y-auto max-h-56 leading-relaxed select-all">
                {sqlSchema}
              </pre>
            </div>
          </div>

        </div>

        {/* Demo Database Controls side-panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Demo Mode Tools</h3>
                <p className="text-xs text-slate-400">Manage browser database parameters.</p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 text-xs text-amber-800 flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mr-2.5 mt-0.5 flex-shrink-0" />
              <div>
                These controls modify data stored on your computer (LocalStorage) and are active only in <b>Demo Mode</b>.
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResetDemoData}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2 text-slate-500" />
                Reset browser Demo data
              </button>
              
              <button
                onClick={() => {
                  if (confirm("This will erase all local configurations and database tables. Proceed?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-red-200 rounded-xl shadow-sm text-xs font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                Hard clear cache & settings
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
