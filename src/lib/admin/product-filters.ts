export const ADMIN_PRODUCT_PAGE_SIZE = 20;

export type AdminProductStatus = "all" | "draft" | "live";

export type AdminProductFilters = {
  query: string;
  status: AdminProductStatus;
};

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

export function parseAdminProductFilters(
  searchParams: Record<string, string | string[] | undefined>,
): AdminProductFilters {
  const statusRaw = firstParam(searchParams, "status");

  return {
    query: firstParam(searchParams, "q"),
    status: statusRaw === "draft" || statusRaw === "live" ? statusRaw : "all",
  };
}

export function parseAdminProductPage(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const page = Number(firstParam(searchParams, "page"));
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export function adminProductsHref(filters: AdminProductFilters, page = 1) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

export function sanitizeAdminProductQuery(query: string) {
  return query.replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
}
