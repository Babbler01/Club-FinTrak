import React, { useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { TrendingUp, TrendingDown, DollarSign, PlusCircle, ChevronRight } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
  onQuickAddTx?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onQuickAddTx }) => {
  const { transactions, projects } = useDb();

  const totalIncome = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'income' && tx.status === 'cleared')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && tx.status === 'cleared')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [transactions]);

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const activeProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime || a.title.localeCompare(b.title);
      })
      .slice(0, 5)
      .map((project) => ({
        ...project,
        totalIncome: project.incomes.reduce((sum, entry) => sum + Number(entry.amount), 0),
        totalExpenditure: project.expenditures.reduce((sum, entry) => sum + Number(entry.amount), 0),
      }));
  }, [projects]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
        const bTime = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(value);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your club finances and activity.</p>
        </div>
        {onQuickAddTx && (
          <button
            onClick={onQuickAddTx}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/95 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Add Transaction
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Income</p>
              <h2 className="mt-4 text-3xl font-black text-slate-900">{formatCurrency(totalIncome)}</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">{transactions.some((tx) => tx.type === 'income' && tx.status === 'cleared') ? 'Income from cleared transactions.' : 'No cleared income yet.'}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Expenditure</p>
              <h2 className="mt-4 text-3xl font-black text-slate-900">{formatCurrency(totalExpenses)}</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">{transactions.some((tx) => tx.type === 'expense' && tx.status === 'cleared') ? 'Costs from cleared expense transactions.' : 'No cleared expenses yet.'}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Balance</p>
              <h2 className="mt-4 text-3xl font-black text-slate-900">{formatCurrency(balance)}</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">{transactions.length > 0 ? 'Income minus expenses.' : 'Add transactions to see your balance.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Projects</h2>
              <p className="text-sm text-slate-500 mt-1">Current projects with funding overview.</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/90"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {activeProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                No active projects yet. Create one from the Projects page to track its income and spending.
              </div>
            ) : (
              activeProjects.map((project) => (
                <div key={project.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 min-h-[110px]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                      <p className="mt-2 text-xs text-slate-500">{project.beneficiaries} beneficiaries</p>
                    </div>
                    <div className="text-right text-sm text-slate-700">
                      <p className="font-semibold">Income: {formatCurrency(project.totalIncome)}</p>
                      <p className="mt-2">Expenditure: {formatCurrency(project.totalExpenditure)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Latest Transactions</h2>
              <p className="text-sm text-slate-500 mt-1">Most recent 5 transaction items.</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/90"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 text-center">
                No transactions yet. Add a new transaction to start building your financial history.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                        <p className="mt-1 text-xs text-slate-500">{tx.date} · {tx.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                        </p>
                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          tx.status === 'cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{tx.payment_method}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
