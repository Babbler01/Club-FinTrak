import React, { useMemo, useRef, useState } from 'react';
import { useDb } from '../context/DbContext';
import { jsPDF } from 'jspdf';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(value);
};

export const Report: React.FC = () => {
  const { transactions } = useDb();
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const incomeExpenses = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - index));
      return {
        month: months[date.getMonth()],
        year: date.getFullYear(),
        Income: 0,
        Expense: 0,
      };
    });

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const targetIndex = data.findIndex((item) => item.month === months[txDate.getMonth()] && item.year === txDate.getFullYear());
      if (targetIndex !== -1 && tx.status === 'cleared') {
        if (tx.type === 'income') {
          data[targetIndex].Income += Number(tx.amount);
        } else {
          data[targetIndex].Expense += Number(tx.amount);
        }
      }
    });

    return data;
  }, [transactions]);

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

  const exportPdf = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const margin = 40;
      const lineHeight = 18;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      let cursor = 60;

      pdf.setFontSize(18);
      pdf.text('Annual Financial Report', margin, cursor);
      cursor += lineHeight * 1.5;

      pdf.setFontSize(11);
      pdf.text('Summary of the account with income, expenditure and balance details.', margin, cursor);
      cursor += lineHeight * 2;

      pdf.setFontSize(12);
      pdf.text(`Total Income: ${formatCurrency(totalIncome)}`, margin, cursor);
      cursor += lineHeight;
      pdf.text(`Total Expenditure: ${formatCurrency(totalExpenses)}`, margin, cursor);
      cursor += lineHeight;
      pdf.text(`Current Balance: ${formatCurrency(balance)}`, margin, cursor);
      cursor += lineHeight * 2;

      const incomeLabel = 'Income vs Expenditure (last 12 months)';
      pdf.setFontSize(12);
      pdf.text(incomeLabel, margin, cursor);
      cursor += lineHeight;

      pdf.setFontSize(10);
      incomeExpenses.forEach((item) => {
        if (cursor > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          cursor = margin;
        }
        pdf.text(`${item.month} ${item.year} — Income: ${formatCurrency(item.Income)}, Expense: ${formatCurrency(item.Expense)}`, margin, cursor, { maxWidth: pageWidth });
        cursor += lineHeight;
      });

      pdf.save(`annual-financial-report-${new Date().getFullYear()}.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
      alert('Unable to generate PDF at this time. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans" ref={reportRef}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Annual Financial Report</h1>
          <p className="text-sm text-slate-500 mt-1">Summary of the account with income, expenditure and balance details.</p>
        </div>
        <button
          onClick={exportPdf}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Generating PDF...' : 'Export Annual PDF'}
        </button>
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
          <p className="mt-4 text-sm text-slate-500">Income recorded for the reporting period.</p>
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
          <p className="mt-4 text-sm text-slate-500">Total cleared expenses in the period.</p>
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
          <p className="mt-4 text-sm text-slate-500">Net amount remaining after expenses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Income vs Expenditure</h2>
              <p className="text-sm text-slate-500 mt-1">Monthly trend for the last 12 months.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Annual</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenses} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip formatter={(value) => value == null ? '' : formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#be123c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Annual Account Summary</h2>
            <p className="text-sm text-slate-500 mt-1">Snapshot of finance performance for the year.</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Income Growth</p>
              <p className="mt-3 text-lg font-bold text-slate-900">{formatCurrency(totalIncome)}</p>
              <p className="text-sm text-slate-500 mt-1">Strong revenue inflows support the club’s operations.</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Expense Control</p>
              <p className="mt-3 text-lg font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
              <p className="text-sm text-slate-500 mt-1">Expenses are tracked and ready for review.</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Closing Balance</p>
              <p className="mt-3 text-lg font-bold text-slate-900">{formatCurrency(balance)}</p>
              <p className="text-sm text-slate-500 mt-1">Available funds after the annual settlement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
