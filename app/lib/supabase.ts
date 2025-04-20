import { createBrowserClient } from '@supabase/auth-helpers-remix'
import { createClient } from '@supabase/supabase-js' // Keep original for server if needed separately

// Browser client (uses window.ENV) - safe for client-side
export const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined' || !window.ENV?.SUPABASE_URL || !window.ENV?.SUPABASE_ANON_KEY) {
     // Return a dummy client or throw error on server/if ENV not set
     // This prevents errors during SSR when window is not available
     // console.warn("Attempted to get browser client on server or ENV not set.");
     // You might return a minimal client or null depending on usage
     // For simplicity, let's return a basic client, but auth won't work server-side with this one.
     // A better approach is to ensure this is only called client-side.
     return createClient("http://localhost", "dummykey"); // Or handle appropriately
  }
  return createBrowserClient(
    window.ENV.SUPABASE_URL!,
    window.ENV.SUPABASE_ANON_KEY!
  );
}


// Server client (uses process.env) - used in loaders/actions via auth-helpers
// We don't export a single instance directly anymore,
// as auth-helpers will create context-specific clients.

// Helper type for window.ENV
declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

// Type helper for Supabase client (can be used for both browser/server types)
export type SupabaseClientType = ReturnType<typeof createBrowserClient>;

// Type helper for Database schema (optional but recommended)
// You can generate this using `npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts`
// import { Database } from 'types/supabase';
// export type TypedSupabaseClient = SupabaseClient<Database>;
// export const getTypedSupabaseBrowserClient = () => createBrowserClient<Database>(...)
