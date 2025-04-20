import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createServerClient } from '@supabase/auth-helpers-remix';

// Action to handle the logout process
export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase logout error:", error);
    // Handle error appropriately, maybe redirect back with an error message
    // For simplicity, we still redirect to login
  }

  // Redirect to login page after logout, ensuring cookies are cleared via headers
  return redirect("/login", { headers: response.headers });
}

// Loader can prevent access if needed, but usually logout is just an action
export async function loader() {
  // Typically, you wouldn't GET a logout route, you'd POST to it.
  // Redirecting GET requests might be a good idea.
  return redirect("/"); // Redirect to home/login if someone tries to GET /logout
}
