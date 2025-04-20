import Header from "./Header";
import Sidebar from "./Sidebar";
import type { User } from "@supabase/supabase-js"; // Import User type

// Accept user prop
export default function MainLayout({ children, user }: { children: React.ReactNode, user: User | null }) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar /> {/* Sidebar doesn't need user prop directly for now */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header now gets user data via useRouteLoaderData, no need to pass prop here */}
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {/* TODO: Add Alert/Notification component area here */}
          {children}
        </main>
      </div>
    </div>
  );
}
