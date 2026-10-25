import { Suspense } from "react";
import { CatalogFilters } from "@/components/catalog-filters";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductCard } from "@/components/product-card";
import { CatalogDynamicSkeleton } from "@/components/skeletons";
import {
  catalogHasFilters,
  parseCatalogFilters,
  parseCatalogPage,
} from "@/lib/catalog/filters";
import { listPublicProducts, listPublicVehicles } from "@/lib/catalog/queries";

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selected = parseCatalogFilters(params);
  const page = parseCatalogPage(params);
  const [{ data: vehicles }, { data: products, total, error }] = await Promise.all([
    listPublicVehicles(),
    listPublicProducts(selected, page),
  ]);
  const hasFilters = catalogHasFilters(selected);

  return (
    <CatalogFilters
      key={`${selected.make}|${selected.model}|${selected.year ?? ""}|${selected.query}`}
      selected={selected}
      vehicles={vehicles}
    >
      {error ? (
        <p className="mt-10 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {!error && products.length === 0 ? (
        <p className="mt-10 text-sm leading-6 text-muted">
          {hasFilters
            ? "По этому запросу ничего не нашлось. Смените автомобиль или артикул."
            : page > 1
              ? "На этой странице товаров нет."
              : "Товары скоро появятся. Сейчас в каталоге ещё нет опубликованных позиций."}
        </p>
      ) : null}
      {!error && products.length > 0 ? (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : null}
      {!error && total > 0 ? (
        <CatalogPagination filters={selected} page={page} total={total} />
      ) : null}
    </CatalogFilters>
  );
}

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 sm:px-10 lg:px-12">
      <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
        Каталог
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
        Сначала автомобиль или артикул — так проще найти нужную деталь. В корзину
        можно добавить после входа.
      </p>
      <Suspense fallback={<CatalogDynamicSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
