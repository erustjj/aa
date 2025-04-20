import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { createServerClient } from '@supabase/auth-helpers-remix';

export const meta: MetaFunction = () => {
  return [{ title: "Depo Yönetimi - Ürün Yönetimi" }];
};

// Define the type for our product data, including the group name
type ProductWithGroup = {
  id: string;
  stock_code: string;
  material_name_1: string;
  unit_of_measure: string;
  current_stock: number;
  serial_number: string | null;
  product_groups: { // Joined data
    name: string;
  } | null; // Handle cases where group might be null
};

export async function loader({ request }: LoaderFunctionArgs) {
  const response = new Response();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );

  // Check for active session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  // Fetch products and join with product_groups
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      stock_code,
      material_name_1,
      unit_of_measure,
      current_stock,
      serial_number,
      product_groups ( name )
    `)
    .order('material_name_1', { ascending: true }); // Order alphabetically by name

  if (error) {
    console.error("Error fetching products:", error);
    // Handle error appropriately, maybe return an error message
    throw new Response("Ürünler yüklenirken bir hata oluştu.", { status: 500 });
  }

  // Return the fetched products, ensuring headers are passed for session management
  return json({ products: products as ProductWithGroup[] }, { headers: response.headers });
}

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Ürün Yönetimi
        </h2>
        <Link
          to="/products/new" // Link to the future add product page
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Yeni Ürün Ekle
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Stok Kodu</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Malzeme Adı</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Grup</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Birim</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Mevcut Stok</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Seri No</th>
              {/* Add Actions column later */}
              {/* <th scope="col" className="relative px-4 py-3"><span className="sr-only">Eylemler</span></th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Gösterilecek ürün bulunamadı.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? undefined : 'bg-gray-50 dark:bg-gray-900/50'}> {/* Zebra stripes */}
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{product.stock_code}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{product.material_name_1}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{product.product_groups?.name ?? 'N/A'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{product.unit_of_measure}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{product.current_stock.toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{product.serial_number ?? '-'}</td>
                  {/* Add action buttons (Edit/Delete) later */}
                  {/* <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                    <Link to={`/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Düzenle</Link>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
