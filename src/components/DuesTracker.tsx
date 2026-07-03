import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import type { Member, DuesRecord } from '../types';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Check, 
  Trash2, 
  X, 
  Edit2, 
  Send, 
  AlertCircle
} from 'lucide-react';

export const DuesTracker: React.FC = () => {
  const { 
    members, 
    dues, 
    addMember, 
    updateMember, 
    deleteMember, 
    addDuesRecord,
    updateDuesRecord, 
    deleteDuesRecord 
  } = useDb();

  // Tab State: 'records' or 'roster'
  const [activeTab, setActiveTab] = useState<'records' | 'roster'>('records');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [duesStatusFilter, setDuesStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [deleteConfirmMemberId, setDeleteConfirmMemberId] = useState<string | null>(null);
  const [deleteConfirmDuesId, setDeleteConfirmDuesId] = useState<string | null>(null);

  // Member Form State
  const [memberFormName, setMemberFormName] = useState('');
  const [memberFormEmail, setMemberFormEmail] = useState('');
  const [memberFormStatus, setMemberFormStatus] = useState<'active' | 'inactive'>('active');
  const [memberFormDate, setMemberFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberFormError, setMemberFormError] = useState<string | null>(null);

  // New Due Payment Form State
  const [paymentMemberId, setPaymentMemberId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentVerificationStatus, setPaymentVerificationStatus] = useState<'cleared' | 'pending'>('cleared');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Reset Member Form
  const resetMemberForm = () => {
    setMemberFormName('');
    setMemberFormEmail('');
    setMemberFormStatus('active');
    setMemberFormDate(new Date().toISOString().split('T')[0]);
    setMemberFormError(null);
  };

  // Open Member Modal for Add
  const handleOpenAddMember = () => {
    setEditingMember(null);
    resetMemberForm();
    setIsMemberModalOpen(true);
  };

  // Open Member Modal for Edit
  const handleOpenEditMember = (m: Member) => {
    setEditingMember(m);
    setMemberFormName(m.name);
    setMemberFormEmail(m.email);
    setMemberFormStatus(m.status);
    setMemberFormDate(m.joined_date);
    setMemberFormError(null);
    setIsMemberModalOpen(true);
  };

  // Submit Member Form
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberFormName || !memberFormEmail) {
      setMemberFormError('Name and Email are required.');
      return;
    }

    const memberData = {
      name: memberFormName,
      email: memberFormEmail,
      status: memberFormStatus,
      joined_date: memberFormDate
    };

    try {
      if (editingMember) {
        await updateMember({ ...memberData, id: editingMember.id });
        showNotification('success', `Member "${memberFormName}" updated successfully.`);
      } else {
        await addMember(memberData);
        showNotification('success', `Member "${memberFormName}" added to roster.`);
      }
      setIsMemberModalOpen(false);
      resetMemberForm();
    } catch (err: any) {
      setMemberFormError(err.message || 'Error saving member details.');
    }
  };

  // Delete Member
  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMember(id);
      setDeleteConfirmMemberId(null);
      showNotification('success', 'Member deleted from roster.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error deleting member.');
    }
  };

  // Submit New Due Payment
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMemberId || !paymentAmount || !paymentDate) {
      setPaymentError('Member, amount, and date are required.');
      return;
    }

    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPaymentError('Amount must be a positive number.');
      return;
    }

    try {
      await addDuesRecord({
        member_id: paymentMemberId,
        amount: parsedAmount,
        due_date: paymentDate,
        status: 'paid',
        payment_date: paymentDate,
        verification_status: paymentVerificationStatus
      });

      setIsBatchModalOpen(false);
      setPaymentMemberId('');
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentVerificationStatus('cleared');
      showNotification('success', 'Due payment added and recorded as income.');
    } catch (err: any) {
      setPaymentError(err.message || 'Error adding due payment.');
    }
  };

  // Mark Dues Record as Paid
  const handleMarkAsPaid = async (record: DuesRecord) => {
    try {
      await updateDuesRecord({
        ...record,
        status: 'paid'
      });
      showNotification('success', 'Dues payment received & logged in transactions.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating dues payment.');
    }
  };

  // Delete Dues Record
  const handleDeleteDues = async (id: string) => {
    try {
      await deleteDuesRecord(id);
      setDeleteConfirmDuesId(null);
      showNotification('success', 'Dues record deleted.');
    } catch (err: any) {
      showNotification('error', err.message || 'Error deleting dues record.');
    }
  };

  // Member lookups map for easy join in render
  const membersMap = useMemo(() => {
    const map: Record<string, Member> = {};
    members.forEach(m => {
      map[m.id] = m;
    });
    return map;
  }, [members]);

  // Filtered Dues records
  const filteredDues = useMemo(() => {
    return dues.filter(d => {
      const member = membersMap[d.member_id];
      if (!member) return false;
      
      const matchesSearch = 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = duesStatusFilter === 'all' || d.status === duesStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [dues, membersMap, searchTerm, duesStatusFilter]);

  // Filtered Members Roster
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = memberStatusFilter === 'all' || m.status === memberStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, memberStatusFilter]);

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Membership Dues Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Manage members roster and track subscriptions or dues payments.</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'records' ? (
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-primary hover:bg-primary/95 cursor-pointer"
            >
              <Send className="w-4 h-4 mr-2 text-secondary" />
              Add New Due Payment
            </button>
          ) : (
            <button
              onClick={handleOpenAddMember}
              className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-primary hover:bg-primary/95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2 text-secondary" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2" />
            <span className="text-xs font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Switcher & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
        
        {/* Tab Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex space-x-4">
            <button
              onClick={() => { setActiveTab('records'); setSearchTerm(''); }}
              className={`pb-1.5 text-sm font-bold border-b-2 px-1 transition-colors cursor-pointer ${
                activeTab === 'records'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Due Payments ({dues.length})
            </button>
            <button
              onClick={() => { setActiveTab('roster'); setSearchTerm(''); }}
              className={`pb-1.5 text-sm font-bold border-b-2 px-1 transition-colors cursor-pointer ${
                activeTab === 'roster'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Member Roster ({members.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={activeTab === 'records' ? "Search by member name/email..." : "Search members..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Context Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {activeTab === 'records' ? (
              <select
                value={duesStatusFilter}
                onChange={(e: any) => setDuesStatusFilter(e.target.value)}
                className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
              </select>
            ) : (
              <select
                value={memberStatusFilter}
                onChange={(e: any) => setMemberStatusFilter(e.target.value)}
                className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Members</option>
                <option value="inactive">Inactive Members</option>
              </select>
            )}
          </div>
        </div>

      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {activeTab === 'records' ? (
          
          /* Dues Records List */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Member</th>
                  <th className="py-4 px-6 font-semibold">Amount</th>
                  <th className="py-4 px-6 font-semibold">Due Date</th>
                  <th className="py-4 px-6 font-semibold">Payment Date</th>
                  <th className="py-4 px-6 font-semibold">Verification</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDues.map((record) => {
                  const m = membersMap[record.member_id];
                  if (!m) return null;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{m.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">{formatCurrency(record.amount)}</td>
                      <td className="py-4 px-6 text-xs text-slate-500 font-medium whitespace-nowrap">{record.due_date}</td>
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                        {record.payment_date || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          record.verification_status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {record.verification_status || 'cleared'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          record.status === 'paid' 
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : record.status === 'overdue'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-3">
                          {record.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(record)}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Receive Payment
                            </button>
                          )}

                          {deleteConfirmDuesId === record.id ? (
                            <div className="flex items-center space-x-1.5 animate-pulse bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                              <span className="text-[10px] font-bold text-red-600">Delete?</span>
                              <button onClick={() => handleDeleteDues(record.id)} className="text-red-700 font-bold hover:underline text-[10px] cursor-pointer">Yes</button>
                              <span className="text-slate-400 text-[10px]">|</span>
                              <button onClick={() => setDeleteConfirmDuesId(null)} className="text-slate-500 font-bold hover:underline text-[10px] cursor-pointer">No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmDuesId(record.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredDues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                      No due payments match your current filters. Add a new due payment to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        ) : (

          /* Member Roster list */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Name</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold">Joined Date</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{member.name}</td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{member.email}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-semibold">{member.joined_date}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        member.status === 'active' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2.5">
                        <button
                          onClick={() => handleOpenEditMember(member)}
                          className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                          title="Edit Member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {deleteConfirmMemberId === member.id ? (
                          <div className="flex items-center space-x-1.5 animate-pulse bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                            <span className="text-[10px] font-bold text-red-600">Delete Member?</span>
                            <button onClick={() => handleDeleteMember(member.id)} className="text-red-700 font-bold hover:underline text-[10px] cursor-pointer">Yes</button>
                            <span className="text-slate-400 text-[10px]">|</span>
                            <button onClick={() => setDeleteConfirmMemberId(null)} className="text-slate-500 font-bold hover:underline text-[10px] cursor-pointer">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmMemberId(member.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      No members match your current search. Add a new member to the roster.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Add/Edit Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingMember ? 'Edit Member Details' : 'Add New Member'}
              </h3>
              <button 
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4">
              {memberFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {memberFormError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={memberFormName}
                  onChange={(e) => setMemberFormName(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Samuel Green"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={memberFormEmail}
                  onChange={(e) => setMemberFormEmail(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. sam@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Joined Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Joined Date
                  </label>
                  <input
                    type="date"
                    required
                    value={memberFormDate}
                    onChange={(e) => setMemberFormDate(e.target.value)}
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Membership Status
                  </label>
                  <select
                    value={memberFormStatus}
                    onChange={(e: any) => setMemberFormStatus(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-xl text-white bg-primary hover:bg-primary/95 text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Dues Generation Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Send className="w-5 h-5 mr-2 text-primary" />
                Add New Due Payment
              </h3>
              <button 
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {paymentError}
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 flex items-start">
                <AlertCircle className="w-4 h-4 text-amber-500 mr-2.5 mt-0.5 flex-shrink-0" />
                <div>
                  This records a dues payment entry for a selected member and automatically logs it as income in the Transactions page.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Member *
                  </label>
                  <select
                    required
                    value={paymentMemberId}
                    onChange={(e) => setPaymentMemberId(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select an active member</option>
                    {members.filter(member => member.status === 'active').map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Amount (₦) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="120.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Date Paid *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Verification Status
                  </label>
                  <div className="flex space-x-6 mt-1">
                    <label className="inline-flex items-center text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="paymentVerificationStatus"
                        checked={paymentVerificationStatus === 'cleared'}
                        onChange={() => setPaymentVerificationStatus('cleared')}
                        className="form-radio h-4 w-4 text-primary border-slate-300 focus:ring-primary/20"
                      />
                      <span className="ml-2 text-slate-700 font-semibold">Cleared</span>
                    </label>
                    <label className="inline-flex items-center text-sm cursor-pointer select-none">
                      <input
                        type="radio"
                        name="paymentVerificationStatus"
                        checked={paymentVerificationStatus === 'pending'}
                        onChange={() => setPaymentVerificationStatus('pending')}
                        className="form-radio h-4 w-4 text-primary border-slate-300 focus:ring-primary/20"
                      />
                      <span className="ml-2 text-slate-700 font-semibold">Pending</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-xl text-white bg-primary hover:bg-primary/95 text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Due Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
