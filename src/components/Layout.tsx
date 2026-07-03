import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  PiggyBank, 
  LogOut, 
  Menu, 
  X, 
  Activity, 
  Database,
  BarChart2
} from 'lucide-react';

interface LayoutProps {
  activeView: string;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeView, onViewChange, children }) => {
  const { user, signOut } = useAuth();
  const { isDemoMode } = useDb();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'dues', name: 'Dues Tracker', icon: Users },
    { id: 'projects', name: 'Projects', icon: PiggyBank },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-primary text-white px-4 py-3 flex items-center justify-between shadow-md z-30">
        <div className="flex items-center space-x-2">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
            <Activity className="w-5 h-5 text-secondary" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">Club FinTrak</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Mobile DB Badge */}
          <div className={`p-1.5 rounded-lg ${isDemoMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
            <Database className="w-4 h-4" />
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-lg hover:bg-white/10 focus:outline-none transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer Menu */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary text-white pt-20 pb-4 shadow-xl">
            <nav className="mt-5 px-4 space-y-1 flex-grow">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`group w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-secondary text-primary shadow-md' 
                        : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-slate-300 group-hover:text-white'}`} />
                    {item.name}
                  </button>
                );
              })}
            </nav>
            
            {/* User footer in Mobile Menu */}
            <div className="px-4 border-t border-white/10 pt-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{user?.user_metadata?.full_name || 'Treasurer'}</p>
                  <p className="text-[10px] text-slate-300 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:w-64 md:h-screen bg-primary text-white border-r border-primary/20 shadow-lg overflow-y-auto">
        {/* Brand Header */}
        <div className="px-6 py-6 flex items-center space-x-3 border-b border-white/10">
          <div className="bg-white/10 p-2 rounded-xl border border-white/20 shadow-inner">
            <Activity className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight leading-none">Club FinTrak</span>
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest mt-1">Treasurer Desk</span>
          </div>
        </div>

        {/* Database Status Bar */}
        <div className="px-6 py-3 bg-primary-600 flex items-center justify-between text-xs border-b border-white/5">
          <span className="text-slate-200">Database:</span>
          <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
            isDemoMode 
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
              : 'bg-green-400/20 text-green-300 border border-green-400/30'
          }`}>
            <Database className="w-3 h-3 mr-1" />
            {isDemoMode ? 'Demo Mode' : 'Cloud'}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`group w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-secondary text-primary shadow-md' 
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-slate-300 group-hover:text-white'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-white/10 bg-primary-600">
          <div className="flex items-center space-x-3 px-2 py-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center font-extrabold shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {user?.user_metadata?.full_name || 'Treasurer'}
              </p>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => signOut()}
            className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 flex min-h-screen flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
