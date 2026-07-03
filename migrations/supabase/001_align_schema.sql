-- Club FinTrak schema alignment migration
-- Safe for existing Supabase projects: adds missing columns/tables without dropping data.
-- Run this in the Supabase SQL Editor.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Ensure core tables exist
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'cleared' CHECK (status IN ('cleared', 'pending')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.dues (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue')),
  payment_date DATE,
  verification_status TEXT DEFAULT 'cleared',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.budgets (
  category TEXT PRIMARY KEY,
  limit_amount NUMERIC(12,2) NOT NULL,
  period TEXT NOT NULL DEFAULT 'Monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  beneficiaries INTEGER NOT NULL DEFAULT 0,
  incomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  expenditures JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2) Add any missing columns to existing tables
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.members
SET created_at = COALESCE(created_at, timezone('utc'::text, now()))
WHERE created_at IS NULL;

ALTER TABLE public.members
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.transactions
SET created_at = COALESCE(created_at, timezone('utc'::text, now()))
WHERE created_at IS NULL;

ALTER TABLE public.transactions
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.dues
  ADD COLUMN IF NOT EXISTS verification_status TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.dues
SET verification_status = CASE
  WHEN verification_status IS NULL AND status = 'paid' THEN 'cleared'
  WHEN verification_status IS NULL THEN 'pending'
  ELSE verification_status
END
WHERE verification_status IS NULL;

UPDATE public.dues
SET created_at = COALESCE(created_at, timezone('utc'::text, now()))
WHERE created_at IS NULL;

ALTER TABLE public.dues
  ALTER COLUMN verification_status SET DEFAULT 'cleared',
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.budgets
SET created_at = COALESCE(created_at, timezone('utc'::text, now()))
WHERE created_at IS NULL;

ALTER TABLE public.budgets
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS beneficiaries INTEGER,
  ADD COLUMN IF NOT EXISTS incomes JSONB,
  ADD COLUMN IF NOT EXISTS expenditures JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.projects
SET title = COALESCE(title, 'Untitled Project')
WHERE title IS NULL;

UPDATE public.projects
SET beneficiaries = COALESCE(beneficiaries, 0)
WHERE beneficiaries IS NULL;

UPDATE public.projects
SET incomes = COALESCE(incomes, '[]'::jsonb)
WHERE incomes IS NULL;

UPDATE public.projects
SET expenditures = COALESCE(expenditures, '[]'::jsonb)
WHERE expenditures IS NULL;

UPDATE public.projects
SET created_at = COALESCE(created_at, timezone('utc'::text, now()))
WHERE created_at IS NULL;

ALTER TABLE public.projects
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN beneficiaries SET DEFAULT 0,
  ALTER COLUMN beneficiaries SET NOT NULL,
  ALTER COLUMN incomes SET DEFAULT '[]'::jsonb,
  ALTER COLUMN incomes SET NOT NULL,
  ALTER COLUMN expenditures SET DEFAULT '[]'::jsonb,
  ALTER COLUMN expenditures SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
  ALTER COLUMN created_at SET NOT NULL;

-- 3) Helpful indexes for the app queries
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_dues_member_id ON public.dues(member_id);
CREATE INDEX IF NOT EXISTS idx_dues_status ON public.dues(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

COMMIT;
