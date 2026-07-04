import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables first, then fall back to LocalStorage.
// In Vercel deployments, the build-time env vars should take precedence.
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';
  const hasEnvConfig = Boolean(envUrl && envKey);

  const localUrl = typeof window !== 'undefined'
    ? window.localStorage.getItem('fintrak_supabase_url')?.trim() || ''
    : '';
  const localKey = typeof window !== 'undefined'
    ? window.localStorage.getItem('fintrak_supabase_key')?.trim() || ''
    : '';

  const url = hasEnvConfig ? envUrl : localUrl;
  const key = hasEnvConfig ? envKey : localKey;

  return {
    url,
    key,
    isConfigured: Boolean(url && key)
  };
};

const config = getSupabaseConfig();

// Initialize the Supabase client if configured, otherwise null
export const supabase = config.isConfigured 
  ? createClient(config.url, config.key) 
  : null;

// Helper to save configuration in LocalStorage
export const saveSupabaseConfig = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('fintrak_supabase_url', url.trim());
    localStorage.setItem('fintrak_supabase_key', key.trim());
  } else {
    localStorage.removeItem('fintrak_supabase_url');
    localStorage.removeItem('fintrak_supabase_key');
  }
};

export const hasSupabaseEnvConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';
  return Boolean(envUrl && envKey);
};

// Helper to clear config
export const clearSupabaseConfig = () => {
  localStorage.removeItem('fintrak_supabase_url');
  localStorage.removeItem('fintrak_supabase_key');
};
