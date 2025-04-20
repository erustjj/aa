import { Form, Link, useRouteLoaderData } from "@remix-run/react"; // Import Form and useRouteLoaderData
import type { loader as rootLoader } from "~/root"; // Import root loader type

export default function Header() {
  // Access session data loaded in the root loader
  const rootData = useRouteLoaderData<typeof rootLoader>("root");
  const userEmail = rootData?.session?.user?.email; // Get user email if available

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div>
        {/* Placeholder for potential breadcrumbs or title */}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Gösterge Paneli {/* TODO: Make dynamic based on route */}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {userEmail ? (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300" title={userEmail}>
              Hoşgeldin, {userEmail.split('@')[0]} {/* Show part before @ */}
            </span>
            {/* Use a Form for logout to trigger the POST action */}
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Çıkış Yap
              </button>
            </Form>
          </>
        ) : (
          // Optional: Show login link if somehow header is shown while logged out
          <Link to="/login" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            Giriş Yap
          </Link>
        )}
      </div>
    </header>
  );
}
