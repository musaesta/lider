export type CatalogFilters = {
  make: string;
  model: string;
  year: number | null;
  query: string;
};

export const CATALOG_PAGE_SIZE = 12;

export function catalogHasFilters(filters: CatalogFilters) {
  return Boolean(filters.make || filters.model || filters.year || filters.query);
}

export function catalogSearchHref(filters: CatalogFilters, page = 1) {
  const params = new URLSearchParams();

  if (filters.make) {
    params.set("make", filters.make);
  }

  if (filters.model) {
    params.set("model", filters.model);
  }

  if (filters.year) {
    params.set("year", String(filters.year));
  }

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
}

export function parseCatalogFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const yearRaw = firstParam(searchParams, "year");
  const year = Number(yearRaw);

  return {
    make: firstParam(searchParams, "make"),
    model: firstParam(searchParams, "model"),
    year: Number.isInteger(year) && year >= 1886 && year <= 2200 ? year : null,
    query: firstParam(searchParams, "q"),
  };
}

export function parseCatalogPage(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const page = Number(firstParam(searchParams, "page"));
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export function escapeIlike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function catalogFilterOptions(
  vehicles: Array<{
    make: string;
    model: string;
    yearFrom: number | null;
    yearTo: number | null;
  }>,
  selected: Pick<CatalogFilters, "make" | "model">,
) {
  const makes = [...new Set(vehicles.map((vehicle) => vehicle.make))].sort((left, right) =>
    left.localeCompare(right, "ru"),
  );
  const models = [
    ...new Set(
      vehicles
        .filter((vehicle) => !selected.make || vehicle.make === selected.make)
        .map((vehicle) => vehicle.model),
    ),
  ].sort((left, right) => left.localeCompare(right, "ru"));

  const years = new Set<number>();

  for (const vehicle of vehicles) {
    if (selected.make && vehicle.make !== selected.make) {
      continue;
    }

    if (selected.model && vehicle.model !== selected.model) {
      continue;
    }

    const from = vehicle.yearFrom ?? vehicle.yearTo;
    const to = vehicle.yearTo ?? vehicle.yearFrom;

    if (from == null || to == null) {
      continue;
    }

    for (let year = from; year <= to; year += 1) {
      years.add(year);
    }
  }

  return {
    makes,
    models,
    years: [...years].sort((left, right) => right - left),
  };
}
