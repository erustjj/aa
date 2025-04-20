import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { createServerClient } from '@supabase/auth-helpers-remix'; // Import helper

export const meta: MetaFunction = () => {
  return [{ title: "Depo Yönetimi - Gösterge Paneli" }];
};

// Loader to protect the route and load data
export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );
  const { data: { session } } = await supabase.auth.getSession();

  // If there's no session, redirect to login
  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  // User is logged in, load dashboard data here if needed
  // Example: Fetch counts from your database using the authenticated client
  // const { data: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  // const { data: transferCount } = await supabase.from('transfers').select('*', { count: 'exact', head: true, filter: 'status=eq.PENDING' });

  // Return session (contains user info) and any dashboard data
  // Make sure to include headers for cookie management
  return json({ session /*, productCount: productCount?.count, transferCount: transferCount?.count */ }, { headers: response.headers });
}


export default function Dashboard() {
  // const { productCount, transferCount } = useLoaderData<typeof loader>(); // Use loaded data

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Gösterge Paneli
      </h2>
      <p className="text-gray-700 dark:text-gray-300">
        Depo yönetim sistemine hoş geldiniz. Burası ana kontrol paneliniz olacak.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">Toplam Ürün</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {/* {productCount ?? 'N/A'} */}
            150 {/* Placeholder */}
          </p>
        </div>
         <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">Bekleyen Transferler</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
             {/* {transferCount ?? 'N/A'} */}
             5 {/* Placeholder */}
          </p>
        </div>
         <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">Düşük Stok Uyarısı</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            12 {/* Placeholder */}
          </p>
        </div>
      </div>
    </div>
  );
}
