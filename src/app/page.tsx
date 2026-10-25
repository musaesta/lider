import Image from "next/image";
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
        <p className="mt-8 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : (
        <CatalogFilters selected={emptyFilters} vehicles={vehicles} />
      )}
      {makes.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">
            Или выберите марку
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {makes.map((make) => (
              <li key={make}>
                <Link
                  className="inline-flex rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-ink"
                  href={`/catalog?make=${encodeURIComponent(make)}`}
                  prefetch={false}
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

const steps = [
  {
    number: "01",
    title: "Найдите деталь",
    body: "Марка и модель или артикул. На витрине видно, есть товар или нет.",
  },
  {
    number: "02",
    title: "Войдите",
    body: "Корзина и оформление доступны после входа. Гостю каталог открыт.",
  },
  {
    number: "03",
    title: "Оставьте заявку",
    body: "Адрес и комментарий. Оплату и доставку согласуем отдельно.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-10 sm:py-12 lg:px-12">
      <section className="hero-art overflow-hidden rounded-[28px] bg-chrome px-6 py-10 text-on-chrome sm:px-10 sm:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-on-dark">
              Подбор по автомобилю
            </p>
            <h1 className="text-metal mt-4 text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Запчасти по марке, модели или артикулу
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-on-chrome-muted sm:text-lg sm:leading-8">
              Укажите автомобиль — в каталоге останутся совместимые позиции. Можно
              искать по артикулу. Заказ без онлайн-оплаты: оставляете заявку, мы
              подтверждаем наличие.
            </p>
          </div>
          <Image
            alt=""
            className="mx-auto size-44 drop-shadow-[0_18px_40px_rgba(224,36,36,0.35)] sm:size-52 lg:size-56"
            height={224}
            src="/logo.svg"
            unoptimized
            width={224}
          />
        </div>
      </section>
      <Suspense
        fallback={<p className="mt-10 text-sm text-muted">Загрузка подбора…</p>}
      >
        <HomeSearch />
      </Suspense>
      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <li
            className="rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-ink/5"
            key={step.number}
          >
            <p className="font-display text-sm font-black italic text-accent">{step.number}</p>
            <h2 className="mt-2 text-base font-semibold text-ink">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-10">
        <Link
          className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          href="/catalog"
        >
          Весь каталог
        </Link>
      </p>
    </main>
  );
}
