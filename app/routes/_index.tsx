import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createServerClient } from '@supabase/auth-helpers-remix';

// Redirect root path based on auth state
export async function loader({ request }: LoaderFunctionArgs) {
   const response = new Response();
   const supabase = createServerClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_ANON_KEY!,
     { request, response }
   );
   const { data: { session } } = await supabase.auth.getSession();

   if (session) {
      // If user is logged in, redirect to the dashboard
      return redirect("/dashboard", { headers: response.headers });
   } else {
      // If user is not logged in, redirect to the login page
      return redirect("/login", { headers: response.headers });
   }
}

// This component will likely never render due to the redirects
export default function Index() {
  return null;
}
