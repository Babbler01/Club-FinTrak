import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or LocalStorage
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('fintrak_supabase_url');
  const localKey = localStorage.getItem('fintrak_supabase_key');
  
  return {
    url: localUrl || envUrl || '',
    key: localKey || envKey || '',
    isConfigured: !!(localUrl || envUrl) && !!(localKey || envKey)
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

// Helper to clear config
export const clearSupabaseConfig = () => {
  localStorage.removeItem('fintrak_supabase_url');
  localStorage.removeItem('fintrak_supabase_key');
};
