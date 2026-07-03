import React, { useEffect, useState } from 'react';
import { useDb } from '../context/DbContext';
import type { Project, ProjectEntry } from '../types';
import { ChevronLeft, PlusCircle } from 'lucide-react';

const CATEGORIES = [
  'Membership Dues',
  'Catering',
  'Equipment',
  'Operations & Website',
  'Marketing & Printing',
  'Events & Guest Speakers',
  'Sponsorships',
  'Fundraising',
  'Other'
];

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onBack }) => {
  const { projects, addProjectEntry, updateProject } = useDb();
  const project = projects.find((item) => item.id === projectId);
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [beneficiaries, setBeneficiaries] = useState('');
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null);
  const [beneficiariesSaved, setBeneficiariesSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setBeneficiaries(project.beneficiaries.toString());
      setBeneficiariesSaved(false);
      setBeneficiariesError(null);
    }
  }, [project]);

  if (!project) {
    return (
      <div className="space-y-6 font-sans">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to Projects
        </button>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">Project not found.</p>
        </div>
      </div>
    );
  }

  const incomes = project.incomes ?? [];
  const expenditures = project.expenditures ?? [];
  const totalIncome = incomes.reduce((acc, entry) => acc + entry.amount, 0);
  const totalExpense = expenditures.reduce((acc, entry) => acc + entry.amount, 0);
  const costPerBeneficiary = project.beneficiaries > 0 ? totalExpense / project.beneficiaries : 0;

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);

  const entries = entryType === 'income' ? incomes : expenditures;

  const handleSaveBeneficiaries = async () => {
    setBeneficiariesError(null);
    setBeneficiariesSaved(false);

    const parsed = Number(beneficiaries);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setBeneficiariesError('Enter a positive beneficiary count.');
      return;
    }

    try {
      await updateProject({ ...project, beneficiaries: parsed });
      setBeneficiariesSaved(true);
      setTimeout(() => setBeneficiariesSaved(false), 2500);
    } catch (err: any) {
      setBeneficiariesError(err.message || 'Unable to save beneficiaries.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim()) {
      setError('Description and amount are required.');
      return;
    }
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    try {
      await addProjectEntry(project.id, {
        date,
        description: description.trim(),
        amount: parsedAmount,
        type: entryType,
        category,
      });
      setDescription('');
      setAmount('');
      setCategory(CATEGORIES[0]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to save entry.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to Projects
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{project.title}</h1>
            <p className="text-sm text-slate-500 mt-1">{project.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Beneficiaries</p>
                  <input
                    type="number"
                    min="1"
                    value={beneficiaries}
                    onChange={(e) => setBeneficiaries(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-black text-slate-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveBeneficiaries}
                  className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/95"
                >
                  Save
                </button>
              </div>
              {beneficiariesError && <p className="mt-3 text-xs text-rose-600">{beneficiariesError}</p>}
              {beneficiariesSaved && <p className="mt-3 text-xs text-emerald-600">Beneficiaries saved.</p>}
            </div>
            <div className="rounded-3xl bg-emerald-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Total Income</p>
              <p className="mt-2 text-2xl font-black text-emerald-900">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-3xl bg-rose-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-rose-700">Total Expense</p>
              <p className="mt-2 text-2xl font-black text-rose-900">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Item</h2>
                <p className="text-sm text-slate-500 mt-1">Select the entry type, then add it to the project.</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setEntryType('income')}
                  className={`w-full rounded-3xl py-3 text-sm font-bold ${entryType === 'income' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('expense')}
                  className={`w-full rounded-3xl py-3 text-sm font-bold ${entryType === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Expenditure
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/95">
                <PlusCircle className="h-4 w-4" /> Add Entry
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Project Entries</h2>
                <p className="text-sm text-slate-500 mt-1">Review income and expense entries together.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {project.beneficiaries} beneficiaries
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No entries yet.</td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3 text-slate-700">{entry.date}</td>
                        <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${entry.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{entry.category}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Summary</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Total Income: <span className="font-semibold text-slate-900">{formatCurrency(totalIncome)}</span></p>
              <p>Total Expense: <span className="font-semibold text-slate-900">{formatCurrency(totalExpense)}</span></p>
              <p>Cost per Beneficiary: <span className="font-semibold text-slate-900">{formatCurrency(costPerBeneficiary)}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
