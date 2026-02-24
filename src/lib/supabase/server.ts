/**
 * Server-side Supabase client for DreamBreeze.
 *
 * Uses @supabase/ssr createServerClient for server components,
 * server actions, and route handlers in Next.js App Router.
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a server-side Supabase client.
 *
 * Must be called within a Server Component, Server Action, or Route Handler.
 * Creates a fresh client per request (no caching) to ensure cookie context
 * is correct.
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method is called from a Server Component where
          // cookies cannot be set. This is expected when reading the session
          // in Server Components — the middleware handles refreshing.
        }
      },
    },
  });
}
