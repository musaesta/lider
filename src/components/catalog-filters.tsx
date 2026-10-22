"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { catalogSearchHref, type CatalogFilters } from "@/lib/catalog/filters";

const fieldClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4";

export function CatalogFilters({
  makes,
  models,
  years,
  selected,
}: {
  makes: string[];
  models: string[];
  years: number[];
  selected: CatalogFilters;
}) {
  const router = useRouter();

  function goTo(next: Partial<CatalogFilters> & { resetModel?: boolean; resetYear?: boolean }) {
    const filters: CatalogFilters = {
      make: next.make ?? selected.make,
      model: next.resetModel ? "" : (next.model ?? selected.model),
      year: next.resetYear ? null : (next.year === undefined ? selected.year : next.year),
      query: next.query ?? selected.query,
    };
    router.push(catalogSearchHref(filters));
  }

  return (
    <form
      action="/catalog"
      className="mt-8 grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_8rem_1.4fr_auto] lg:items-end"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        goTo({
          make: String(form.get("make") ?? "").trim(),
          model: String(form.get("model") ?? "").trim(),
          year: Number(form.get("year")) || null,
          query: String(form.get("q") ?? "").trim(),
        });
      }}
    >
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
        Марка
        <select
          className={fieldClass}
          defaultValue={selected.make}
          key={`make-${selected.make}`}
          name="make"
          onChange={(event) => {
            goTo({ make: event.target.value, resetModel: true, resetYear: true });
          }}
        >
          <option value="">Все марки</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
        Модель
        <select
          className={fieldClass}
          defaultValue={selected.model}
          disabled={!selected.make}
          key={`model-${selected.make}-${selected.model}`}
          name="model"
          onChange={(event) => {
            goTo({ model: event.target.value, resetYear: true });
          }}
        >
          <option value="">Все модели</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
        Год
        <select
          className={fieldClass}
          defaultValue={selected.year ?? ""}
          disabled={!selected.make}
          key={`year-${selected.make}-${selected.model}-${selected.year ?? ""}`}
          name="year"
          onChange={(event) => {
            goTo({ year: Number(event.target.value) || null });
          }}
        >
          <option value="">Любой</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">
        Артикул или название
        <input
          className={fieldClass}
          defaultValue={selected.query}
          name="q"
          placeholder="Например W 712/75"
          type="search"
        />
      </label>
      <div className="flex gap-2">
        <button
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          type="submit"
        >
          Найти
        </button>
        <Link
          className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          href="/catalog"
        >
          Сброс
        </Link>
      </div>
    </form>
  );
}
