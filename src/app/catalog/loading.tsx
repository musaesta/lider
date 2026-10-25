import { CatalogDynamicSkeleton } from "@/components/skeletons";

export default function CatalogLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 sm:px-10 lg:px-12">
      <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Каталог</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
        Сначала автомобиль или артикул — так проще найти нужную деталь. В корзину
        можно добавить после входа.
      </p>
      <CatalogDynamicSkeleton />
    </main>
  );
}
