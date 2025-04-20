import { NavLink } from "@remix-run/react";

const navigation = [
  { name: "Gösterge Paneli", href: "/dashboard" },
  { name: "Ürün Yönetimi", href: "/products" },
  { name: "Departman Yönetimi", href: "/departments" },
  { name: "Transfer Oluştur", href: "/transfers/new" },
  { name: "Transfer Geçmişi", href: "/transfers" },
  { name: "Satın Alma Girişi", href: "/purchases/new" },
  { name: "Satın Alma Geçmişi", href: "/purchases" },
  { name: "Stok Sayım Girişi", href: "/inventory/new" },
  { name: "Stok Sayım Geçmişi", href: "/inventory" },
  { name: "Profilim", href: "/profile" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
        {/* Replace with Logo if available */}
        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          Depo Yönetimi
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  }`
                }
              >
                {/* Add icons later if desired */}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
