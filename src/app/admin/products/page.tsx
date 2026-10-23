import Link from "next/link";
import { Suspense } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import { formatPrice } from "@/lib/catalog/format";
import {
  ADMIN_PRODUCT_PAGE_SIZE,
  adminProductsHref,
  parseAdminProductFilters,
  parseAdminProductPage,
} from "@/lib/admin/product-filters";
import { listAdminProducts } from "@/lib/admin/queries";

const statusTabs = [
  { status: "all" as const, label: "Все" },
  { status: "draft" as const, label: "Черновики" },
  { status: "live" as const, label: "На витрине" },
];

function StorefrontBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={
        isActive
          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"
          : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"
      }
    >
      {isActive ? "На витрине" : "Черновик"}
    </span>
  );
}

async function AdminProductsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseAdminProductFilters(params);
  const page = parseAdminProductPage(params);
  const { products, total, error } = await listAdminProducts(filters, page);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PRODUCT_PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * ADMIN_PRODUCT_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PRODUCT_PAGE_SIZE, total);
  const hasQuery = Boolean(filters.query);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = filters.status === tab.status;
          return (
            <Link
              className={
                active
                  ? "rounded-full bg-slate-950 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }
              href={adminProductsHref({ query: filters.query, status: tab.status })}
              key={tab.status}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <form
        action="/admin/products"
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        method="get"
      >
        {filters.status !== "all" ? (
          <input name="status" type="hidden" value={filters.status} />
        ) : null}
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-slate-500">
          Поиск по названию, артикулу или SKU
          <input
            className={adminFieldClass}
            defaultValue={filters.query}
            name="q"
            placeholder="Например 0 451 103 316"
            type="search"
          />
        </label>
        <button className={adminButtonClass} type="submit">
          Найти
        </button>
        {hasQuery || filters.status !== "all" ? (
          <Link
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900"
            href="/admin/products"
          >
            Сброс
          </Link>
        ) : null}
      </form>
      {error ? (
        <p className="mt-8 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {!error && products.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          {hasQuery || filters.status !== "all"
            ? "По этому запросу товаров нет."
            : "Товаров пока нет."}
        </p>
      ) : null}
      {!error && products.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                className="block rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-slate-300"
                href={`/admin/products/${product.id}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-950">{product.name}</p>
                  <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <StorefrontBadge isActive={product.isActive} />
                  <span>
                    {product.brandName} · {product.categoryName} · арт. {product.article} ·{" "}
                    {product.sku}
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {!error && total > 0 ? (
        <nav
          aria-label="Страницы списка товаров"
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-slate-500">
            Показаны {from}–{to} из {total}
          </p>
          {pageCount > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              {page > 1 ? (
                <Link
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
                  href={adminProductsHref(filters, page - 1)}
                >
                  Назад
                </Link>
              ) : null}
              <span className="text-sm text-slate-500">
                {page} из {pageCount}
              </span>
              {page < pageCount ? (
                <Link
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
                  href={adminProductsHref(filters, page + 1)}
                >
                  Дальше
                </Link>
              ) : null}
            </div>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

export default function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Товары</h2>
          <p className="mt-1 text-sm text-slate-500">
            Найдите карточку по имени или артикулу. Черновик виден только здесь;
            на витрине — после кнопки «Выложить».
          </p>
        </div>
        <Link
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          href="/admin/products/new"
        >
          Новый товар
        </Link>
      </div>
      <Suspense fallback={<p className="mt-8 text-sm text-slate-500">Загрузка товаров…</p>}>
        <AdminProductsContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
