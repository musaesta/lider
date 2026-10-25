import Link from "next/link";

const links = [
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/brands", label: "Бренды" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/vehicles", label: "Авто" },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-line hover:bg-canvas"
          href={link.href}
          key={link.href}
          prefetch={false}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
