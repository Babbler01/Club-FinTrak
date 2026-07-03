import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, getSupabaseConfig } from '../lib/supabase';
import type { Transaction, Member, DuesRecord, Budget, Project, ProjectEntry } from '../types';
import { 
  MOCK_TRANSACTIONS, 
  MOCK_MEMBERS, 
  MOCK_DUES, 
  MOCK_BUDGETS,
  MOCK_PROJECTS,
  getLocalStorageData, 
  setLocalStorageData 
} from '../lib/mockData';

interface DbContextType {
  transactions: Transaction[];
  members: Member[];
  dues: DuesRecord[];
  budgets: Budget[];
  projects: Project[];
  loading: boolean;
  isDemoMode: boolean;
  supabaseConfigured: boolean;
  refreshData: () => Promise<void>;
  
  // Transactions API
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Members API
  addMember: (m: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (m: Member) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  
  // Dues API
  addDuesRecord: (d: Omit<DuesRecord, 'id'>) => Promise<DuesRecord>;
  updateDuesRecord: (d: DuesRecord) => Promise<DuesRecord>;
  deleteDuesRecord: (id: string) => Promise<void>;
  generateDuesForAllMembers: (amount: number, dueDate: string) => Promise<void>;
  
  // Projects API
  addProject: (project: Omit<Project, 'id' | 'incomes' | 'expenditures'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  addProjectEntry: (projectId: string, entry: Omit<ProjectEntry, 'id' | 'project_id'>) => Promise<ProjectEntry>;
  
  // Database Controls
  reloadConfig: () => void;
  resetDatabaseToDemo: () => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<DuesRecord[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [configTrigger, setConfigTrigger] = useState(0);

  // Check Supabase Config
  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseConfigured(config.isConfigured);
    setIsDemoMode(!config.isConfigured);
  }, [configTrigger]);

  const reloadConfig = useCallback(() => {
    setConfigTrigger(prev => prev + 1);
  }, []);

  // Fetch Data function
  const refreshData = useCallback(async () => {
    setLoading(true);
    const config = getSupabaseConfig();
    
    if (config.isConfigured && supabase) {
      try {
        // 1. Fetch Transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        if (txError) throw txError;
        setTransactions(txData || []);

        // 2. Fetch Members
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .order('name');
        if (memberError) throw memberError;
        setMembers(memberData || []);

        // 3. Fetch Dues
        const { data: duesData, error: duesError } = await supabase
          .from('dues')
          .select('*')
          .order('due_date', { ascending: false });
        if (duesError) throw duesError;
        setDues(duesData || []);

        // 4. Fetch Budgets
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('*');
        if (budgetError) throw budgetError;
        setBudgets(budgetData || []);

        // 5. Fetch Projects
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*');
        if (projectError) throw projectError;
        setProjects(projectData || []);
        
        setIsDemoMode(false);
      } catch (err) {
        console.error("Supabase fetch error, falling back to local storage:", err);
        // Fallback to local storage on error
        loadLocalStorageData();
      }
    } else {
      // Local Storage Mode
      loadLocalStorageData();
    }
    setLoading(false);
  }, [supabaseConfigured]);

  const loadLocalStorageData = () => {
    const localTx = getLocalStorageData<Transaction[]>('fintrak_transactions', MOCK_TRANSACTIONS);
    const localMem = getLocalStorageData<Member[]>('fintrak_members', MOCK_MEMBERS);
    const localDues = getLocalStorageData<DuesRecord[]>('fintrak_dues', MOCK_DUES);
    const localBudgets = getLocalStorageData<Budget[]>('fintrak_budgets', MOCK_BUDGETS);
    const localProjects = getLocalStorageData<Project[]>('fintrak_projects', MOCK_PROJECTS);
    
    setTransactions(localTx);
    setMembers(localMem);
    setDues(localDues);
    setBudgets(localBudgets);
    setProjects(localProjects);
    setIsDemoMode(true);
  };

  useEffect(() => {
    refreshData();
  }, [refreshData, supabaseConfigured]);

  // Reset local storage database to demo seed data
  const resetDatabaseToDemo = useCallback(() => {
    localStorage.removeItem('fintrak_transactions');
    localStorage.removeItem('fintrak_members');
    localStorage.removeItem('fintrak_dues');
    localStorage.removeItem('fintrak_budgets');
    localStorage.removeItem('fintrak_projects');
    loadLocalStorageData();
  }, []);

  // TRANSACTIONS CRUD
  const addTransaction = async (tx: Omit<Transaction, 'id'>): Promise<Transaction> => {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([tx])
        .select()
        .single();
      if (error) throw error;
      setTransactions(prev => [data, ...prev]);
      return data;
    } else {
      const newTx: Transaction = {
        ...tx,
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      setLocalStorageData('fintrak_transactions', updated);
      return newTx;
    }
  };

  const updateTransaction = async (tx: Transaction): Promise<Transaction> => {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .update(tx)
        .eq('id', tx.id)
        .select()
        .single();
      if (error) throw error;
      setTransactions(prev => prev.map(item => item.id === tx.id ? data : item));
      return data;
    } else {
      const updated = transactions.map(item => item.id === tx.id ? tx : item);
      setTransactions(updated);
      setLocalStorageData('fintrak_transactions', updated);
      return tx;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    if (!isDemoMode && supabase) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(item => item.id !== id));
    } else {
      const updated = transactions.filter(item => item.id !== id);
      setTransactions(updated);
      setLocalStorageData('fintrak_transactions', updated);
    }
  };

  // MEMBERS CRUD
  const addMember = async (m: Omit<Member, 'id'>): Promise<Member> => {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('members')
        .insert([m])
        .select()
        .single();
      if (error) throw error;
      setMembers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } else {
      const newMember: Member = {
        ...m,
        id: 'mem_' + Math.random().toString(36).substr(2, 9),
      };
      const updated = [...members, newMember].sort((a, b) => a.name.localeCompare(b.name));
      setMembers(updated);
      setLocalStorageData('fintrak_members', updated);
      return newMember;
    }
  };

  const updateMember = async (m: Member): Promise<Member> => {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('members')
        .update(m)
        .eq('id', m.id)
        .select()
        .single();
      if (error) throw error;
      setMembers(prev => prev.map(item => item.id === m.id ? data : item).sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } else {
      const updated = members.map(item => item.id === m.id ? m : item).sort((a, b) => a.name.localeCompare(b.name));
      setMembers(updated);
      setLocalStorageData('fintrak_members', updated);
      return m;
    }
  };

  const deleteMember = async (id: string): Promise<void> => {
    if (!isDemoMode && supabase) {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMembers(prev => prev.filter(item => item.id !== id));
      // Cascade delete dues records in state (in Supabase cascade handles this)
      setDues(prev => prev.filter(d => d.member_id !== id));
    } else {
      const updated = members.filter(item => item.id !== id);
      setMembers(updated);
      setLocalStorageData('fintrak_members', updated);
      
      const updatedDues = dues.filter(item => item.member_id !== id);
      setDues(updatedDues);
      setLocalStorageData('fintrak_dues', updatedDues);
    }
  };

  // DUES CRUD
  const addDuesRecord = async (d: Omit<DuesRecord, 'id'>): Promise<DuesRecord> => {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('dues')
        .insert([d])
        .select()
        .single();
      if (error) throw error;
      setDues(prev => [data, ...prev]);

      if (d.status === 'paid' || d.verification_status === 'cleared') {
        const member = members.find(m => m.id === d.member_id);
        await addTransaction({
          date: d.payment_date || d.due_date || new Date().toISOString().split('T')[0],
          description: `Dues Payment - ${member ? member.name : 'Member'}`,
          amount: d.amount,
          type: 'income',
          category: 'Membership Dues',
          payment_method: 'Card',
          status: d.verification_status === 'pending' ? 'pending' : 'cleared'
        });
      }

      return data;
    } else {
      const newDues: DuesRecord = {
        ...d,
        id: 'due_' + Math.random().toString(36).substr(2, 9),
      };
      const updated = [newDues, ...dues];
      setDues(updated);
      setLocalStorageData('fintrak_dues', updated);

      if (d.status === 'paid' || d.verification_status === 'cleared') {
        const member = members.find(m => m.id === d.member_id);
        await addTransaction({
          date: d.payment_date || d.due_date || new Date().toISOString().split('T')[0],
          description: `Dues Payment - ${member ? member.name : 'Member'}`,
          amount: d.amount,
          type: 'income',
          category: 'Membership Dues',
          payment_method: 'Card',
          status: d.verification_status === 'pending' ? 'pending' : 'cleared'
        });
      }

      return newDues;
    }
  };

  const updateDuesRecord = async (d: DuesRecord): Promise<DuesRecord> => {
    // If status becomes "paid", automatically log a corresponding transaction if it doesn't exist
    let recordToUpdate = { ...d };
    
    // If transitioning to paid and previously unpaid/overdue
    const originalRecord = dues.find(item => item.id === d.id);
    const becamePaid = d.status === 'paid' && originalRecord && originalRecord.status !== 'paid';
    
    if (becamePaid && !d.payment_date) {
      recordToUpdate.payment_date = new Date().toISOString().split('T')[0];
    } else if (d.status !== 'paid') {
      recordToUpdate.payment_date = null;
    }

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('dues')
        .update({
          status: recordToUpdate.status,
          payment_date: recordToUpdate.payment_date
        })
        .eq('id', d.id)
        .select()
        .single();
      if (error) throw error;
      
      // If it became paid, log the transaction
      if (becamePaid) {
        const member = members.find(m => m.id === d.member_id);
        const description = `Dues Payment - ${member ? member.name : 'Member'}`;
        await addTransaction({
          date: recordToUpdate.payment_date || new Date().toISOString().split('T')[0],
          description,
          amount: d.amount,
          type: 'income',
          category: 'Membership Dues',
          payment_method: 'Card',
          status: 'cleared'
        });
      }

      setDues(prev => prev.map(item => item.id === d.id ? data : item));
      return data;
    } else {
      const updated = dues.map(item => item.id === d.id ? recordToUpdate : item);
      setDues(updated);
      setLocalStorageData('fintrak_dues', updated);

      if (becamePaid) {
        const member = members.find(m => m.id === d.member_id);
        const description = `Dues Payment - ${member ? member.name : 'Member'}`;
        await addTransaction({
          date: recordToUpdate.payment_date || new Date().toISOString().split('T')[0],
          description,
          amount: d.amount,
          type: 'income',
          category: 'Membership Dues',
          payment_method: 'Card',
          status: 'cleared'
        });
      }

      return recordToUpdate;
    }
  };

  const deleteDuesRecord = async (id: string): Promise<void> => {
    if (!isDemoMode && supabase) {
      const { error } = await supabase
        .from('dues')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setDues(prev => prev.filter(item => item.id !== id));
    } else {
      const updated = dues.filter(item => item.id !== id);
      setDues(updated);
      setLocalStorageData('fintrak_dues', updated);
    }
  };

  const generateDuesForAllMembers = async (amount: number, dueDate: string): Promise<void> => {
    const activeMembers = members.filter(m => m.status === 'active');
    
    if (!isDemoMode && supabase) {
      const duesToInsert = activeMembers.map(m => ({
        member_id: m.id,
        amount,
        due_date: dueDate,
        status: 'unpaid' as const,
        payment_date: null
      }));
      
      const { error } = await supabase
        .from('dues')
        .insert(duesToInsert);
      if (error) throw error;
      
      await refreshData();
    } else {
      const newRecords: DuesRecord[] = activeMembers.map(m => ({
        id: 'due_' + Math.random().toString(36).substr(2, 9),
        member_id: m.id,
        amount,
        due_date: dueDate,
        status: 'unpaid',
        payment_date: null
      }));
      
      const updated = [...newRecords, ...dues];
      setDues(updated);
      setLocalStorageData('fintrak_dues', updated);
    }
  };

  // BUDGETS CRUD
  const updateBudget = async (b: Budget): Promise<Budget> => {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(b)
        .select()
        .single();
      if (error) throw error;
      setBudgets(prev => {
        const exists = prev.some(item => item.category === b.category);
        if (exists) {
          return prev.map(item => item.category === b.category ? data : item);
        } else {
          return [...prev, data];
        }
      });
      return data;
    } else {
      setBudgets(prev => {
        const exists = prev.some(item => item.category === b.category);
        let updated: Budget[];
        if (exists) {
          updated = prev.map(item => item.category === b.category ? b : item);
        } else {
          updated = [...prev, b];
        }
        setLocalStorageData('fintrak_budgets', updated);
        return updated;
      });
      return b;
    }
  };

  const addProject = async (
    project: Omit<Project, 'id' | 'incomes' | 'expenditures'>
  ): Promise<Project> => {
    const newProject: Project = {
      ...project,
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      incomes: [],
      expenditures: [],
      created_at: new Date().toISOString(),
    };

    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
      if (error) throw error;
      const savedProject: Project = {
        ...data,
        incomes: data.incomes || [],
        expenditures: data.expenditures || [],
      };
      setProjects(prev => [savedProject, ...prev]);
      return savedProject;
    } else {
      const updated = [newProject, ...projects];
      setProjects(updated);
      setLocalStorageData('fintrak_projects', updated);
      return newProject;
    }
  };

  const updateProject = async (project: Project): Promise<Project> => {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .upsert(project)
        .select()
        .single();
      if (error) throw error;
      const savedProject: Project = {
        ...data,
        incomes: data.incomes || [],
        expenditures: data.expenditures || [],
      };
      setProjects(prev => prev.map(item => item.id === savedProject.id ? savedProject : item));
      return savedProject;
    } else {
      const updated = projects.map(item => item.id === project.id ? project : item);
      setProjects(updated);
      setLocalStorageData('fintrak_projects', updated);
      return project;
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    if (!isDemoMode && supabase) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setProjects(prev => prev.filter(item => item.id !== id));
    } else {
      const updated = projects.filter(item => item.id !== id);
      setProjects(updated);
      setLocalStorageData('fintrak_projects', updated);
    }
  };

  const addProjectEntry = async (
    projectId: string,
    entry: Omit<ProjectEntry, 'id' | 'project_id'>
  ): Promise<ProjectEntry> => {
    const newEntry: ProjectEntry = {
      ...entry,
      id: 'pe_' + Math.random().toString(36).substr(2, 9),
      project_id: projectId,
      created_at: new Date().toISOString(),
    };

    const project = projects.find(item => item.id === projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    const updatedProject: Project = {
      ...project,
      incomes: entry.type === 'income' ? [...project.incomes, newEntry] : project.incomes,
      expenditures: entry.type === 'expense' ? [...project.expenditures, newEntry] : project.expenditures,
    };

    if (!isDemoMode && supabase) {
      const { error: projectError } = await supabase
        .from('projects')
        .upsert(updatedProject)
        .select()
        .single();
      if (projectError) throw projectError;
      setProjects(prev => prev.map(item => item.id === updatedProject.id ? updatedProject : item));
    } else {
      const updatedProjects = projects.map(item => item.id === updatedProject.id ? updatedProject : item);
      setProjects(updatedProjects);
      setLocalStorageData('fintrak_projects', updatedProjects);
    }

    const transaction: Omit<Transaction, 'id'> = {
      date: newEntry.date,
      description: `${entry.type === 'income' ? 'Project Income' : 'Project Expense'} - ${entry.description}`,
      amount: entry.amount,
      type: entry.type,
      category: entry.category,
      payment_method: 'Card',
      status: 'cleared',
    };

    await addTransaction(transaction);
    return newEntry;
  };

  return (
    <DbContext.Provider value={{
      transactions,
      members,
      dues,
      budgets,
      projects,
      loading,
      isDemoMode,
      supabaseConfigured,
      refreshData,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addMember,
      updateMember,
      deleteMember,
      addDuesRecord,
      updateDuesRecord,
      deleteDuesRecord,
      generateDuesForAllMembers,
      addProject,
      updateProject,
      deleteProject,
      addProjectEntry,
      reloadConfig,
      resetDatabaseToDemo
    }}>
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};
