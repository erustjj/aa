import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { createServerClient } from '@supabase/auth-helpers-remix';

export const meta: MetaFunction = () => {
  return [{ title: "Depo Yönetimi - Giriş" }];
};

// Redirect logged-in users away from login page
export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return redirect('/dashboard', { headers: response.headers });
  }

  return json(null, { headers: response.headers }); // Return null if not logged in
}


export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const formData = await request.formData();
  const email = formData.get("email") as string; // Assuming login with email now
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json({ error: "E-posta ve şifre gereklidir." }, { status: 400, headers: response.headers });
  }

   const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response } // Pass request and response to handle cookies
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase login error:", error.message);
    return json({ error: "Geçersiz e-posta veya şifre." }, { status: 401, headers: response.headers });
  }

  // IMPORTANT: Do NOT redirect here.
  // The auth helper handles cookies. The root loader's revalidation
  // upon `onAuthStateChange` (SIGNED_IN event) will handle the redirect logic.
  // Returning success (even null) with the headers is crucial.
  return json({ success: true }, { headers: response.headers });
}


export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);

  // Display errors from actionData
  useEffect(() => {
    if (actionData?.error) {
      // Maybe use a toast notification library later
      console.error("Login Error:", actionData.error);
    }
     // No need to handle success redirect here, root loader handles it
  }, [actionData]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">
          Depo Yönetim Sistemi Giriş
        </h1>
        {/* Use email for login now */}
        <Form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              E-posta Adresi
            </label>
            <input
              id="email"
              name="email"
              type="email" // Use email type
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              aria-describedby="email-error"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Şifre
            </label>
             <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                aria-describedby="password-error"
              />
               <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
            </div>
          </div>
          {/* Remember me might require more setup with Supabase sessions, removing for simplicity */}
          {/* <div className="flex items-center justify-between"> ... </div> */}

          {actionData?.error && (
            <p id="form-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
              {actionData.error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
            >
              {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </div>
        </Form>
         <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Supabase Auth kullanılıyor. Kayıt için Supabase arayüzünü kullanın veya kayıt formu ekleyin.
        </p>
      </div>
    </div>
  );
}
