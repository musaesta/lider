import Link from "next/link";
import { CATALOG_PAGE_SIZE, catalogSearchHref, type CatalogFilters } from "@/lib/catalog/filters";

export function CatalogPagination({
  filters,
  page,
  total,
}: {
  filters: CatalogFilters;
  page: number;
  total: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  if (total === 0) {
    return null;
  }

  const from = (page - 1) * CATALOG_PAGE_SIZE + 1;
  const to = Math.min(page * CATALOG_PAGE_SIZE, total);

  return (
    <nav
      aria-label="Страницы каталога"
      className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted">
        Показаны {from}–{to} из {total}
      </p>
      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {page > 1 ? (
            <Link
              className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:border-accent/40"
              href={catalogSearchHref(filters, page - 1)}
              prefetch={false}
            >
              Назад
            </Link>
          ) : (
            <span className="rounded-xl border border-transparent px-3 py-2 text-sm text-silver">
              Назад
            </span>
          )}
          <span className="text-sm text-muted">
            {page} из {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:border-accent/40"
              href={catalogSearchHref(filters, page + 1)}
              prefetch={false}
            >
              Дальше
            </Link>
          ) : (
            <span className="rounded-xl border border-transparent px-3 py-2 text-sm text-silver">
              Дальше
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
