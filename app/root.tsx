import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRevalidator, // Import useRevalidator
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createServerClient } from '@supabase/auth-helpers-remix'; // Import server client helper
import { useEffect, useState } from 'react'; // Import hooks
import { getSupabaseBrowserClient } from '~/lib/supabase'; // Import browser client getter

import MainLayout from "~/components/MainLayout";
import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };

  const response = new Response(); // Needed for helper to manage cookies
  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    request,
    response,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Pass env vars and session to client
  return json(
    {
      ENV: env,
      session,
    },
    {
      headers: response.headers, // Pass back cookie headers
    }
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
   const { ENV, session } = useLoaderData<typeof loader>();
   const revalidator = useRevalidator();
   const [supabase] = useState(() => getSupabaseBrowserClient()); // Use state for client instance

   // Listen for auth changes client-side to trigger revalidation
   useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only revalidate if the session changes significantly (signed in/out)
      // or if the token refreshes (to update server-side context if needed)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
         console.log('Supabase auth state changed:', event);
         revalidator.revalidate();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, revalidator]);


  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-100 dark:bg-gray-950">
        {children}
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { session } = useLoaderData<typeof loader>();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Use the session from the loader to determine layout
  // Show MainLayout if user is logged in AND not on the login page
  if (session && !isLoginPage) {
    return (
      <MainLayout user={session.user}> {/* Pass user data to layout */}
        <Outlet />
      </MainLayout>
    );
  }

  // Show only Outlet for login page or if not logged in
  return <Outlet />;
}
