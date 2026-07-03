export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  payment_method: string;
  status: 'cleared' | 'pending';
  created_by?: string;
  created_at?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  joined_date: string;
  created_at?: string;
}

export interface DuesRecord {
  id: string;
  member_id: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid' | 'overdue';
  payment_date: string | null;
  verification_status?: 'cleared' | 'pending';
  created_at?: string;
  
  // Joined relation for easy rendering
  member?: Member;
}

export interface Budget {
  category: string;
  limit_amount: number;
  period: string; // e.g. "Monthly", "Annual"
  created_at?: string;
}

export interface ProjectEntry {
  id: string;
  project_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  created_at?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  beneficiaries: number;
  incomes: ProjectEntry[];
  expenditures: ProjectEntry[];
  created_at?: string;
}
