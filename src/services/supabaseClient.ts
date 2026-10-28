import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get config from env or localStorage
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = localStorage.getItem('vyapaar_supabase_url') || '';
  const customKey = localStorage.getItem('vyapaar_supabase_anon_key') || '';

  return {
    url: customUrl || envUrl,
    anonKey: customKey || envKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    anonKey.length > 20 &&
    !anonKey.includes('your-anon-public-key')
  );
}

let cachedClient: SupabaseClient | null = null;
let lastUsedConfig = '';

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const configKey = `${config.url}::${config.anonKey}`;

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (cachedClient && lastUsedConfig === configKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedConfig = configKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      return { success: false, message: 'Invalid Supabase URL format. It must look like https://xxxx.supabase.co' };
    }
    if (!anonKey || anonKey.length < 20) {
      return { success: false, message: 'Invalid Anon Public Key format.' };
    }

    const testClient = createClient(url, anonKey);
    // Lightweight ping to public table or auth
    const { error } = await testClient.from('businesses').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116' && !error.message.includes('permission denied')) {
      // If table doesn't exist yet, it's connected to Supabase but schema is not applied
      if (error.message.includes('relation "public.businesses" does not exist')) {
        return { 
          success: true, 
          message: 'Connected to Supabase! Note: Please execute supabase/schema.sql in your Supabase SQL Editor to create tables.' 
        };
      }
      return { success: false, message: `Supabase error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase!' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err?.message || 'Network error'}` };
  }
}
