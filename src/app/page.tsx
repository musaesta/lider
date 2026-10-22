import Link from "next/link";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/catalog-filters";
import { catalogFilterOptions } from "@/lib/catalog/filters";
import { listPublicVehicles } from "@/lib/catalog/queries";

const emptyFilters = { make: "", model: "", year: null, query: "" };

async function HomeSearch() {
  const { data: vehicles, error } = await listPublicVehicles();
  const options = catalogFilterOptions(vehicles, emptyFilters);
  const makes = options.makes;

  return (
    <div>
      {error ? (
        <p className="mt-8 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : (
        <CatalogFilters
          makes={options.makes}
          models={options.models}
          selected={emptyFilters}
          years={options.years}
        />
      )}
      {makes.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Или выберите марку
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {makes.map((make) => (
              <li key={make}>
                <Link
                  className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-orange-200 hover:text-slate-950"
                  href={`/catalog?make=${encodeURIComponent(make)}`}
                >
                  {make}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
          Подбор по автомобилю
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Запчасти по марке, модели или артикулу
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Укажите автомобиль — в каталоге останутся совместимые позиции. Можно
          искать по артикулу. Заказ без онлайн-оплаты: оставляете заявку, мы
          подтверждаем наличие.
        </p>
      </section>
      <Suspense
        fallback={<p className="mt-10 text-sm text-slate-500">Загрузка подбора…</p>}
      >
        <HomeSearch />
      </Suspense>
      <ol className="mt-14 grid gap-4 sm:grid-cols-3">
        <li className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            1
          </p>
          <h2 className="mt-2 text-base font-semibold text-slate-950">Найдите деталь</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Марка и модель или артикул. На витрине видно, есть товар или нет.
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            2
          </p>
          <h2 className="mt-2 text-base font-semibold text-slate-950">Войдите</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Корзина и оформление доступны после входа. Гостю каталог открыт.
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            3
          </p>
          <h2 className="mt-2 text-base font-semibold text-slate-950">Оставьте заявку</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Адрес и комментарий. Оплату и доставку согласуем отдельно.
          </p>
        </li>
      </ol>
      <p className="mt-10">
        <Link
          className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
          href="/catalog"
        >
          Весь каталог
        </Link>
      </p>
    </main>
  );
}
