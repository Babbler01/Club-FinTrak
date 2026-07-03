import type { Transaction, Member, DuesRecord, Budget, Project, ProjectEntry } from '../types';

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: 'John Doe', email: 'john.doe@example.com', status: 'active', joined_date: '2025-01-15' },
  { id: 'm2', name: 'Jane Smith', email: 'jane.smith@example.com', status: 'active', joined_date: '2025-02-10' },
  { id: 'm3', name: 'Robert Johnson', email: 'robert.j@example.com', status: 'active', joined_date: '2025-03-05' },
  { id: 'm4', name: 'Emily Davis', email: 'emily.d@example.com', status: 'active', joined_date: '2025-04-12' },
  { id: 'm5', name: 'Michael Brown', email: 'm.brown@example.com', status: 'active', joined_date: '2025-05-18' },
  { id: 'm6', name: 'Sarah Wilson', email: 'sarah.w@example.com', status: 'inactive', joined_date: '2024-09-22' },
  { id: 'm7', name: 'David Garcia', email: 'd.garcia@example.com', status: 'active', joined_date: '2025-06-01' },
];

export const MOCK_BUDGETS: Budget[] = [
  { category: 'Catering', limit_amount: 600, period: 'Monthly' },
  { category: 'Equipment', limit_amount: 1000, period: 'Annual' },
  { category: 'Operations & Website', limit_amount: 300, period: 'Monthly' },
  { category: 'Marketing & Printing', limit_amount: 200, period: 'Monthly' },
  { category: 'Events & Guest Speakers', limit_amount: 1500, period: 'Annual' },
];

export const MOCK_PROJECTS = [
  {
    id: 'p1',
    title: 'Community Skills Workshop',
    description: 'Provide workshops on financial literacy and career development.',
    beneficiaries: 120,
    incomes: [
      {
        id: 'pe1',
        project_id: 'p1',
        date: '2026-06-12',
        description: 'Workshop sponsorship',
        amount: 800,
        type: 'income',
        category: 'Sponsorships',
      }
    ],
    expenditures: [
      {
        id: 'pe2',
        project_id: 'p1',
        date: '2026-06-15',
        description: 'Venue rental',
        amount: 250,
        type: 'expense',
        category: 'Operations & Website',
      },
      {
        id: 'pe3',
        project_id: 'p1',
        date: '2026-06-16',
        description: 'Training materials',
        amount: 180,
        type: 'expense',
        category: 'Equipment',
      }
    ]
  },
  {
    id: 'p2',
    title: 'Health Outreach Campaign',
    description: 'Community outreach focused on wellness and preventive care.',
    beneficiaries: 75,
    incomes: [
      {
        id: 'pe4',
        project_id: 'p2',
        date: '2026-06-20',
        description: 'Health campaign grant',
        amount: 1200,
        type: 'income',
        category: 'Grants',
      }
    ],
    expenditures: [
      {
        id: 'pe5',
        project_id: 'p2',
        date: '2026-06-22',
        description: 'Promotional materials',
        amount: 260,
        type: 'expense',
        category: 'Marketing & Printing',
      }
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: '2026-06-05',
    description: 'Gold Sponsorship - Apex Corp',
    amount: 1500,
    type: 'income',
    category: 'Sponsorships',
    payment_method: 'Bank Transfer',
    status: 'cleared',
  },
  {
    id: 't2',
    date: '2026-06-10',
    description: 'Meeting Room Catering (Pizza & Drinks)',
    amount: 145,
    type: 'expense',
    category: 'Catering',
    payment_method: 'Card',
    status: 'cleared',
  },
  {
    id: 't3',
    date: '2026-06-15',
    description: 'Annual Membership Dues - Jane Smith',
    amount: 120,
    type: 'income',
    category: 'Membership Dues',
    payment_method: 'Card',
    status: 'cleared',
  },
  {
    id: 't4',
    date: '2026-06-18',
    description: 'Domain Renewal & Web Hosting',
    amount: 79.99,
    type: 'expense',
    category: 'Operations & Website',
    payment_method: 'Card',
    status: 'cleared',
  },
  {
    id: 't5',
    date: '2026-06-20',
    description: 'Bake Sale Fundraiser Income',
    amount: 420.50,
    type: 'income',
    category: 'Fundraising',
    payment_method: 'Cash',
    status: 'cleared',
  },
  {
    id: 't6',
    date: '2026-06-25',
    description: 'Guest Speaker Travel Reimbursement',
    amount: 250,
    type: 'expense',
    category: 'Events & Guest Speakers',
    payment_method: 'Bank Transfer',
    status: 'cleared',
  },
  {
    id: 't7',
    date: '2026-06-27',
    description: 'New Conference Microphone System',
    amount: 380,
    type: 'expense',
    category: 'Equipment',
    payment_method: 'Card',
    status: 'cleared',
  },
  {
    id: 't8',
    date: '2026-07-01',
    description: 'Annual Membership Dues - John Doe',
    amount: 120,
    type: 'income',
    category: 'Membership Dues',
    payment_method: 'Cash',
    status: 'cleared',
  },
  {
    id: 't9',
    date: '2026-07-02',
    description: 'Flyers & Pamphlets for Summer Recruitment',
    amount: 65,
    type: 'expense',
    category: 'Marketing & Printing',
    payment_method: 'Cash',
    status: 'cleared',
  },
  {
    id: 't10',
    date: '2026-07-03',
    description: 'Meeting Room Hall Rental Deposit (July)',
    amount: 150,
    type: 'expense',
    category: 'Operations & Website',
    payment_method: 'Bank Transfer',
    status: 'pending',
  },
];

export const MOCK_DUES: DuesRecord[] = [
  { id: 'd1', member_id: 'm1', amount: 120, due_date: '2026-06-30', status: 'paid', payment_date: '2026-07-01' },
  { id: 'd2', member_id: 'm2', amount: 120, due_date: '2026-06-30', status: 'paid', payment_date: '2026-06-15' },
  { id: 'd3', member_id: 'm3', amount: 120, due_date: '2026-06-30', status: 'unpaid', payment_date: null },
  { id: 'd4', member_id: 'm4', amount: 120, due_date: '2026-05-31', status: 'overdue', payment_date: null },
  { id: 'd5', member_id: 'm5', amount: 120, due_date: '2026-06-30', status: 'unpaid', payment_date: null },
  { id: 'd7', member_id: 'm7', amount: 120, due_date: '2026-07-31', status: 'unpaid', payment_date: null },
];

export const getLocalStorageData = <T>(key: string, defaultData: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
};

export const setLocalStorageData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};
