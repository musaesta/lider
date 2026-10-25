"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  catalogFilterOptions,
  catalogSearchHref,
  type CatalogFilters,
  type CatalogVehicleOption,
} from "@/lib/catalog/filters";

const fieldClass =
  "rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none ring-accent/25 focus:border-accent focus:ring-4";

export function CatalogFilters({
  vehicles,
  selected,
}: {
  vehicles: CatalogVehicleOption[];
  selected: CatalogFilters;
}) {
  const router = useRouter();
  const [make, setMake] = useState(selected.make);
  const [model, setModel] = useState(selected.model);
  const [year, setYear] = useState(selected.year ? String(selected.year) : "");
  const options = useMemo(
    () => catalogFilterOptions(vehicles, { make, model }),
    [vehicles, make, model],
  );

  return (
    <form
      action="/catalog"
      className="mt-8 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_8rem_1.4fr_auto] lg:items-end"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        router.push(
          catalogSearchHref({
            make: String(form.get("make") ?? "").trim(),
            model: String(form.get("model") ?? "").trim(),
            year: Number(form.get("year")) || null,
            query: String(form.get("q") ?? "").trim(),
          }),
        );
      }}
    >
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        Марка
        <select
          className={fieldClass}
          name="make"
          onChange={(event) => {
            setMake(event.target.value);
            setModel("");
            setYear("");
          }}
          value={make}
        >
          <option value="">Все марки</option>
          {options.makes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        Модель
        <select
          className={fieldClass}
          disabled={!make}
          name="model"
          onChange={(event) => {
            setModel(event.target.value);
            setYear("");
          }}
          value={model}
        >
          <option value="">Все модели</option>
          {options.models.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        Год
        <select
          className={fieldClass}
          disabled={!make}
          name="year"
          onChange={(event) => {
            setYear(event.target.value);
          }}
          value={year}
        >
          <option value="">Любой</option>
          {options.years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
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
          className="rounded-xl bg-accent transition-colors hover:bg-accent-hover px-4 py-2.5 text-sm font-semibold text-white"
          type="submit"
        >
          Найти
        </button>
        <Link
          className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:text-ink"
          href="/catalog"
          prefetch={false}
        >
          Сброс
        </Link>
      </div>
    </form>
  );
}
