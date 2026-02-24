/**
 * Browser-side Supabase client for DreamBreeze.
 *
 * Uses @supabase/ssr createBrowserClient for cookie-based auth
 * that works with Next.js App Router.
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/**
 * Create (or return cached) browser-side Supabase client.
 *
 * This client is safe to use in React components, client-side hooks,
 * and browser-only code. It reads the auth session from cookies
 * managed by the SSR middleware.
 */
export function createBrowserClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  browserClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
