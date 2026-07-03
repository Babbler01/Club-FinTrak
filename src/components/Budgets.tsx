import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import type { Budget } from '../types';
import { 
  PiggyBank, 
  Plus, 
  Edit2, 
  X, 
  AlertTriangle, 
  CheckCircle
} from 'lucide-react';

const CATEGORIES = [
  'Catering',
  'Equipment',
  'Operations & Website',
  'Marketing & Printing',
  'Events & Guest Speakers',
  'Other'
];

export const Budgets: React.FC = () => {
  const { budgets, transactions, updateBudget } = useDb();
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formLimit, setFormLimit] = useState('');
  const [formPeriod, setFormPeriod] = useState<'Monthly' | 'Annual'>('Monthly');
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal for editing/adding budget
  const handleOpenAddEdit = (budget?: Budget) => {
    if (budget) {
      setFormCategory(budget.category);
      setFormLimit(budget.limit_amount.toString());
      setFormPeriod(budget.period as 'Monthly' | 'Annual');
    } else {
      setFormCategory(CATEGORIES[0]);
      setFormLimit('');
      setFormPeriod('Monthly');
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Budget Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLimit) {
      setFormError('Please enter a limit amount.');
      return;
    }
    const parsedLimit = parseFloat(formLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setFormError('Limit must be a positive number.');
      return;
    }

    try {
      await updateBudget({
        category: formCategory,
        limit_amount: parsedLimit,
        period: formPeriod
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving budget ceiling.');
    }
  };

  // Calculate actual spending per category
  const budgetsWithSpent = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Map existing budgets
    return budgets.map(b => {
      let spent = 0;

      transactions.forEach(tx => {
        // Only count cleared expenses
        if (tx.type !== 'expense' || tx.status !== 'cleared') return;
        if (tx.category !== b.category) return;

        const txDate = new Date(tx.date);
        
        if (b.period === 'Monthly') {
          // Check if same month and year
          if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
            spent += Number(tx.amount);
          }
        } else {
          // Annual - check if same year
          if (txDate.getFullYear() === currentYear) {
            spent += Number(tx.amount);
          }
        }
      });

      const percent = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;

      return {
        ...b,
        spent: Number(spent.toFixed(2)),
        percent: Number(percent.toFixed(1))
      };
    });
  }, [budgets, transactions]);

  // Overall budget progress (Summary card)
  const totalStats = useMemo(() => {
    let limitSum = 0;
    let spentSum = 0;
    
    budgetsWithSpent.forEach(b => {
      // Convert all to monthly equivalents for summary or just sum them
      limitSum += b.limit_amount;
      spentSum += b.spent;
    });

    const percent = limitSum > 0 ? (spentSum / limitSum) * 100 : 0;

    return {
      limitSum,
      spentSum,
      percent: Number(percent.toFixed(1))
    };
  }, [budgetsWithSpent]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(val);
  };

  // Determine progress color
  const getProgressColor = (percent: number) => {
    if (percent > 100) return 'bg-red-500';
    if (percent > 80) return 'bg-amber-500';
    return 'bg-primary'; // Main blue
  };

  const getProgressBg = (percent: number) => {
    if (percent > 100) return 'bg-red-50 text-red-700 border-red-200';
    if (percent > 80) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Budgets</h1>
          <p className="text-sm text-slate-500 mt-1">Set expense ceilings for different categories and track actual vs budget thresholds.</p>
        </div>
        <button
          onClick={() => handleOpenAddEdit()}
          className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-primary hover:bg-primary/95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2 text-secondary" />
          Set Budget Limit
        </button>
      </div>

      {/* Summary KPI Block */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Spending vs Budget Limits</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{formatCurrency(totalStats.spentSum)}</span>
            <span className="text-slate-400 text-sm">of {formatCurrency(totalStats.limitSum)} allocated</span>
          </div>
          <p className="text-xs text-slate-400">Sum of all configured budget lines across their respective periods.</p>
        </div>

        {/* Global Progress Bar */}
        <div className="flex-1 max-w-md w-full">
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
            <span>Utilization Rate</span>
            <span>{totalStats.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getProgressColor(totalStats.percent)}`}
              style={{ width: `${Math.min(totalStats.percent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetsWithSpent.map((b) => {
          return (
            <div key={b.category} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
              
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{b.category}</h3>
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                      {b.period}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleOpenAddEdit(b)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    title="Edit Limit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Indicators */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-slate-50 py-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spent ({b.period})</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(b.spent)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Limit Ceiling</span>
                    <p className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(b.limit_amount)}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Alert */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Usage</span>
                    <span>{b.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor(b.percent)}`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Status Callout Badge */}
                <div className={`p-3 rounded-xl border text-xs flex items-center ${getProgressBg(b.percent)}`}>
                  {b.percent > 100 ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-bold">Over Budget: Exceeded by {formatCurrency(b.spent - b.limit_amount)}</span>
                    </>
                  ) : b.percent > 80 ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-semibold">Approaching limit. {formatCurrency(b.limit_amount - b.spent)} remaining</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="font-semibold">Budget secure. {formatCurrency(b.limit_amount - b.spent)} remaining</span>
                    </>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {budgetsWithSpent.length === 0 && (
          <div className="col-span-2 bg-slate-50 py-16 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500">
            <PiggyBank className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No budget allocations configured.</p>
            <p className="text-xs text-slate-400 mt-1">Configure expense ceilings to start tracking your expenditure.</p>
            <button
              onClick={() => handleOpenAddEdit()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              Set First Budget
            </button>
          </div>
        )}
      </div>

      {/* Set/Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Set Budget Ceiling
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {formError}
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Budget Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Spending Ceiling (₦) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. 500"
                />
              </div>

              {/* Period */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Reset Period
                </label>
                <select
                  value={formPeriod}
                  onChange={(e: any) => setFormPeriod(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Monthly">Monthly Reset</option>
                  <option value="Annual">Annual Reset</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-xl text-white bg-primary hover:bg-primary/95 text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Budget Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
