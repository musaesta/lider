import Link from "next/link";
import { Suspense } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import { PendingLink } from "@/components/pending-link";
import { AdminListSkeleton } from "@/components/skeletons";
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
          ? "rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
          : "rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
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
            <PendingLink
              className={
                active
                  ? "rounded-full bg-accent transition-colors hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-line hover:bg-canvas"
              }
              href={adminProductsHref({ query: filters.query, status: tab.status })}
              key={tab.status}
            >
              {tab.label}
            </PendingLink>
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
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium text-muted">
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
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:text-ink"
            href="/admin/products"
          >
            Сброс
          </Link>
        ) : null}
      </form>
      {error ? (
        <p className="mt-8 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {!error && products.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          {hasQuery || filters.status !== "all"
            ? "По этому запросу товаров нет."
            : "Товаров пока нет."}
        </p>
      ) : null}
      {!error && products.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {products.map((product) => (
            <li key={product.id}>
              <PendingLink
                className="block rounded-2xl border border-line bg-surface p-4 hover:border-accent/40"
                href={`/admin/products/${product.id}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-ink">{product.name}</p>
                  <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <StorefrontBadge isActive={product.isActive} />
                  <span>
                    {product.brandName} · {product.categoryName} · арт. {product.article} ·{" "}
                    {product.sku}
                  </span>
                </p>
              </PendingLink>
            </li>
          ))}
        </ul>
      ) : null}
      {!error && total > 0 ? (
        <nav
          aria-label="Страницы списка товаров"
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-muted">
            Показаны {from}–{to} из {total}
          </p>
          {pageCount > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              {page > 1 ? (
                  <PendingLink
                    className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:border-accent/40"
                    href={adminProductsHref(filters, page - 1)}
                  >
                    Назад
                  </PendingLink>
              ) : null}
              <span className="text-sm text-muted">
                {page} из {pageCount}
              </span>
              {page < pageCount ? (
                  <PendingLink
                    className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:border-accent/40"
                    href={adminProductsHref(filters, page + 1)}
                  >
                    Дальше
                  </PendingLink>
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
          <h2 className="text-xl font-semibold text-ink">Товары</h2>
          <p className="mt-1 text-sm text-muted">
            Найдите карточку по имени или артикулу. Черновик виден только здесь;
            на витрине — после кнопки «Выложить».
          </p>
        </div>
        <PendingLink
          className="rounded-full bg-accent transition-colors hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white"
          href="/admin/products/new"
        >
          Новый товар
        </PendingLink>
      </div>
      <Suspense fallback={<div className="mt-8"><AdminListSkeleton /></div>}>
        <AdminProductsContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
