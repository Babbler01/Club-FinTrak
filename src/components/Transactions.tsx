import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import type { Transaction } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

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

const PAYMENT_METHODS = [
  'Card',
  'Cash',
  'Bank Transfer',
  'Check',
  'PayPal'
];

export const Transactions: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useDb();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'cleared' | 'pending'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formMethod, setFormMethod] = useState(PAYMENT_METHODS[0]);
  const [formStatus, setFormStatus] = useState<'cleared' | 'pending'>('cleared');
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form
  const resetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormAmount('');
    setFormType('expense');
    setFormCategory(CATEGORIES[0]);
    setFormMethod(PAYMENT_METHODS[0]);
    setFormStatus('cleared');
    setFormError(null);
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingTransaction(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormDate(tx.date);
    setFormDescription(tx.description);
    setFormAmount(tx.amount.toString());
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormMethod(tx.payment_method);
    setFormStatus(tx.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription || !formAmount) {
      setFormError('Please fill out all required fields.');
      return;
    }
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }

    const txData = {
      date: formDate,
      description: formDescription,
      amount: parsedAmount,
      type: formType,
      category: formCategory,
      payment_method: formMethod,
      status: formStatus
    };

    try {
      if (editingTransaction) {
        await updateTransaction({ ...txData, id: editingTransaction.id });
      } else {
        await addTransaction(txData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Error saving transaction.');
    }
  };

  // Delete transaction
  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
        const bTime = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
        return bTime - aTime;
      })
      .filter(tx => {
        const matchesSearch = 
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
        
        return matchesSearch && matchesType && matchesCategory && matchesStatus;
      });
  }, [transactions, searchTerm, typeFilter, categoryFilter, statusFilter]);

  // Pagination Logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter, statusFilter]);

  // CSV Export Utility
  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Category', 'Payment Method', 'Status', 'Amount'];
    const rows = filteredTransactions.map(tx => [
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type,
      tx.category,
      tx.payment_method,
      tx.status,
      tx.amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `club_fintrak_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">Log, view, and analyze all income streams and expenses.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-primary hover:bg-primary/95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2 text-secondary" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search description/category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="income">Income (+)</option>
              <option value="expense">Expense (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="cleared">Cleared</option>
              <option value="pending">Pending</option>
            </select>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Description</th>
                <th className="py-4 px-6 font-semibold">Category</th>
                <th className="py-4 px-6 font-semibold">Payment Method</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 text-right font-semibold">Amount</th>
                <th className="py-4 px-6 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-slate-500 text-xs font-medium whitespace-nowrap">{tx.date}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{tx.description}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs whitespace-nowrap">{tx.payment_method}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        tx.status === 'cleared' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-bold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {deleteConfirmId === tx.id ? (
                          <div className="flex items-center space-x-1.5 animate-pulse bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                            <span className="text-[10px] font-bold text-red-600 uppercase">Confirm?</span>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="text-red-700 font-extrabold hover:underline text-[10px] cursor-pointer"
                            >
                              Yes
                            </button>
                            <span className="text-slate-400 text-[10px]">|</span>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-slate-500 font-bold hover:underline text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(tx.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No transactions match your current filters. Clear a filter or add a new transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredTransactions.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Showing <b className="text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</b> to <b className="text-slate-700">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</b> of <b className="text-slate-700">{filteredTransactions.length}</b> records
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTransaction ? 'Edit Transaction' : 'Log Transaction'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {formError}
                </div>
              )}

              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    formType === 'income'
                      ? 'bg-green-50 text-green-700 border-green-300 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  Income (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    formType === 'expense'
                      ? 'bg-red-50 text-red-700 border-red-300 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                  Expense (-)
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Website Host Domain"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="0.00"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Category
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

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status cleared/pending */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Verification Status
                </label>
                <div className="flex space-x-6 mt-1">
                  <label className="inline-flex items-center text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'cleared'}
                      onChange={() => setFormStatus('cleared')}
                      className="form-radio h-4 w-4 text-primary border-slate-300 focus:ring-primary/20"
                    />
                    <span className="ml-2 text-slate-700 font-semibold">Cleared (Completed)</span>
                  </label>
                  <label className="inline-flex items-center text-sm cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'pending'}
                      onChange={() => setFormStatus('pending')}
                      className="form-radio h-4 w-4 text-primary border-slate-300 focus:ring-primary/20"
                    />
                    <span className="ml-2 text-slate-700 font-semibold">Pending (Awaiting settlement)</span>
                  </label>
                </div>
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
                  {editingTransaction ? 'Save Changes' : 'Log Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
