import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, Link } from "@remix-run/react";
import { createServerClient } from '@supabase/auth-helpers-remix';

export const meta: MetaFunction = () => {
  return [{ title: "Depo Yönetimi - Yeni Ürün Ekle" }];
};

// Type for product groups fetched in loader
type ProductGroup = {
  id: number;
  name: string;
};

// Type for potential action errors
type ActionData = {
  error?: string;
  fieldErrors?: {
    stock_code?: string;
    material_name_1?: string;
    unit_of_measure?: string;
    group_id?: string;
  };
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

  // Fetch product groups for the dropdown
  const { data: productGroups, error } = await supabase
    .from('product_groups')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching product groups:", error);
    throw new Response("Ürün grupları yüklenirken bir hata oluştu.", { status: 500 });
  }

  return json({ productGroups: productGroups as ProductGroup[] }, { headers: response.headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );

  // Check for active session again for the action
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Can't return redirect directly in action for non-GET, throw redirect
     throw redirect("/login", { headers: response.headers });
  }

  const formData = await request.formData();
  const stock_code = formData.get("stock_code") as string;
  const material_name_1 = formData.get("material_name_1") as string;
  const material_name_2 = formData.get("material_name_2") as string | null;
  const unit_of_measure = formData.get("unit_of_measure") as string;
  const serial_number = formData.get("serial_number") as string | null;
  const group_id_str = formData.get("group_id") as string;

  const fieldErrors: ActionData['fieldErrors'] = {};
  if (!stock_code) fieldErrors.stock_code = "Stok Kodu zorunludur.";
  if (!material_name_1) fieldErrors.material_name_1 = "Malzeme Adı zorunludur.";
  if (!unit_of_measure) fieldErrors.unit_of_measure = "Birim zorunludur.";
  if (!group_id_str) fieldErrors.group_id = "Ürün Grubu seçilmelidir.";

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>({ fieldErrors }, { status: 400, headers: response.headers });
  }

  const group_id = parseInt(group_id_str, 10);
  if (isNaN(group_id)) {
     return json<ActionData>({ fieldErrors: { group_id: "Geçersiz Ürün Grubu." } }, { status: 400, headers: response.headers });
  }

  const { error } = await supabase
    .from('products')
    .insert([
      {
        stock_code,
        material_name_1,
        material_name_2: material_name_2 || null, // Ensure null if empty
        unit_of_measure,
        serial_number: serial_number || null, // Ensure null if empty
        group_id,
        current_stock: 0, // Default initial stock to 0
        // created_by: session.user.id, // Add if you want to track who created it
        // updated_by: session.user.id,
      },
    ]);

  if (error) {
    console.error("Error inserting product:", error);
    // Check for unique constraint violation (e.g., duplicate stock_code)
    if (error.code === '23505') { // PostgreSQL unique violation code
       return json<ActionData>({ error: `Bu Stok Kodu (${stock_code}) zaten mevcut.` }, { status: 409, headers: response.headers }); // 409 Conflict
    }
    return json<ActionData>({ error: "Ürün eklenirken bir veritabanı hatası oluştu." }, { status: 500, headers: response.headers });
  }

  // Redirect back to the product list on success
  return redirect("/products", { headers: response.headers });
}


export default function AddProductPage() {
  const { productGroups } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Yeni Ürün Ekle
        </h2>
        <Link
          to="/products"
          className="rounded bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Geri Dön
        </Link>
      </div>

      {actionData?.error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300">
          {actionData.error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Form method="post" className="space-y-4">
          {/* Stock Code */}
          <div>
            <label htmlFor="stock_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Stok Kodu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="stock_code"
              name="stock_code"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm"
              aria-describedby={actionData?.fieldErrors?.stock_code ? "stock_code-error" : undefined}
            />
            {actionData?.fieldErrors?.stock_code && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" id="stock_code-error">
                {actionData.fieldErrors.stock_code}
              </p>
            )}
          </div>

          {/* Material Name 1 */}
          <div>
            <label htmlFor="material_name_1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Malzeme Adı 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="material_name_1"
              name="material_name_1"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm"
               aria-describedby={actionData?.fieldErrors?.material_name_1 ? "material_name_1-error" : undefined}
           />
            {actionData?.fieldErrors?.material_name_1 && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" id="material_name_1-error">
                {actionData.fieldErrors.material_name_1}
              </p>
            )}
          </div>

          {/* Material Name 2 (Optional) */}
          <div>
            <label htmlFor="material_name_2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Malzeme Adı 2 (Opsiyonel)
            </label>
            <input
              type="text"
              id="material_name_2"
              name="material_name_2"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm"
            />
          </div>

          {/* Unit of Measure */}
          <div>
            <label htmlFor="unit_of_measure" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Birim <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="unit_of_measure"
              name="unit_of_measure"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm"
              aria-describedby={actionData?.fieldErrors?.unit_of_measure ? "unit_of_measure-error" : undefined}
            />
             {actionData?.fieldErrors?.unit_of_measure && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" id="unit_of_measure-error">
                {actionData.fieldErrors.unit_of_measure}
              </p>
            )}
          </div>

          {/* Serial Number (Optional) */}
          <div>
            <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Seri No (Opsiyonel)
            </label>
            <input
              type="text"
              id="serial_number"
              name="serial_number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm"
            />
          </div>

          {/* Product Group */}
          <div>
            <label htmlFor="group_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ürün Grubu <span className="text-red-500">*</span>
            </label>
            <select
              id="group_id"
              name="group_id"
              required
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm"
              defaultValue=""
              aria-describedby={actionData?.fieldErrors?.group_id ? "group_id-error" : undefined}
            >
              <option value="" disabled>-- Grup Seçin --</option>
              {productGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
             {actionData?.fieldErrors?.group_id && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" id="group_id-error">
                {actionData.fieldErrors.group_id}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Ürünü Kaydet
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
