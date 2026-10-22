import { connection } from "next/server";
import {
  CATALOG_PAGE_SIZE,
  escapeIlike,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import { productImagePublicUrl } from "@/lib/catalog/image-url";
import { createPublicClient } from "@/lib/supabase/public";

export type CatalogProduct = {
  id: string;
  sku: string;
  article: string;
  slug: string;
  name: string;
  description: string | null;
  price: string | number;
  brandName: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string;
  inStock: boolean;
};

export type CatalogVehicle = {
  id: string;
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
};

type NamedRelation = { name: string } | { name: string }[] | null;

type ImageRow = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type ProductRow = {
  id: string;
  sku: string;
  article: string;
  slug: string;
  name: string;
  description: string | null;
  price: string | number;
  brands: NamedRelation;
  categories: NamedRelation;
  product_images: ImageRow[] | null;
};

export type CatalogQueryResult<T> = {
  data: T;
  error: string | null;
};

export type CatalogListResult = CatalogQueryResult<CatalogProduct[]> & {
  total: number;
};

function relationName(value: NamedRelation) {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value[0]?.name ?? "";
  }

  return value.name;
}

function firstImage(images: ImageRow[] | null) {
  if (!images?.length) {
    return null;
  }

  return [...images].sort((left, right) => left.sort_order - right.sort_order)[0];
}

function mapProduct(row: ProductRow, inStock = false): CatalogProduct {
  const image = firstImage(row.product_images);

  return {
    id: row.id,
    sku: row.sku,
    article: row.article,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    brandName: relationName(row.brands),
    categoryName: relationName(row.categories),
    imageUrl: productImagePublicUrl(image?.storage_path),
    imageAlt: image?.alt_text?.trim() || row.name,
    inStock,
  };
}

async function withStock(
  supabase: NonNullable<ReturnType<typeof createPublicClient>>,
  products: CatalogProduct[],
) {
  if (products.length === 0) {
    return products;
  }

  const { data, error } = await supabase.rpc("list_product_stock", {
    p_product_ids: products.map((product) => product.id),
  });

  if (error || !data) {
    return products;
  }

  const inStock = new Map(
    (data as Array<{ product_id: string; in_stock: boolean }>).map((row) => [
      row.product_id,
      row.in_stock,
    ]),
  );

  return products.map((product) => ({
    ...product,
    inStock: inStock.get(product.id) === true,
  }));
}

function uniqueIds(values: Array<{ id?: string; product_id?: string } | null>) {
  return [
    ...new Set(
      values
        .map((row) => row?.id ?? row?.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
}

function yearMatches(
  vehicle: { year_from: number | null; year_to: number | null },
  year: number | null,
) {
  if (year == null) {
    return true;
  }

  if (vehicle.year_from != null && year < vehicle.year_from) {
    return false;
  }

  if (vehicle.year_to != null && year > vehicle.year_to) {
    return false;
  }

  return true;
}

const productSelect = `
  id,
  sku,
  article,
  slug,
  name,
  description,
  price,
  brands ( name ),
  categories ( name ),
  product_images ( storage_path, alt_text, sort_order )
`;

export async function listPublicVehicles(): Promise<
  CatalogQueryResult<CatalogVehicle[]>
> {
  await connection();
  const supabase = createPublicClient();

  if (!supabase) {
    return { data: [], error: "Каталог пока недоступен." };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, year_from, year_to")
    .not("make", "ilike", "rls-test%")
    .order("make", { ascending: true })
    .order("model", { ascending: true });

  if (error) {
    console.error("catalog.listPublicVehicles", error.message);
    return { data: [], error: "Не удалось загрузить автомобили." };
  }

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      make: row.make,
      model: row.model,
      yearFrom: row.year_from,
      yearTo: row.year_to,
    })),
    error: null,
  };
}

async function productIdsForVehicle(
  supabase: NonNullable<ReturnType<typeof createPublicClient>>,
  filters: CatalogFilters,
) {
  if (!filters.make) {
    return null;
  }

  let query = supabase
    .from("vehicles")
    .select("id, year_from, year_to")
    .eq("make", filters.make)
    .not("make", "ilike", "rls-test%");

  if (filters.model) {
    query = query.eq("model", filters.model);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const vehicleIds = (data ?? [])
    .filter((row) => yearMatches(row, filters.year))
    .map((row) => row.id);

  if (vehicleIds.length === 0) {
    return [];
  }

  const { data: links, error: linkError } = await supabase
    .from("product_compatibility")
    .select("product_id")
    .in("vehicle_id", vehicleIds);

  if (linkError) {
    throw new Error(linkError.message);
  }

  return uniqueIds(links ?? []);
}

async function productIdsForSearch(
  supabase: NonNullable<ReturnType<typeof createPublicClient>>,
  query: string,
) {
  if (!query) {
    return null;
  }

  const like = `%${escapeIlike(query)}%`;

  const [{ data: byFields, error: fieldError }, { data: byXref, error: xrefError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id")
        .or(`sku.ilike.${like},article.ilike.${like},name.ilike.${like}`)
        .not("sku", "ilike", "RLS-TEST%"),
      supabase.from("product_cross_references").select("product_id").ilike("article", like),
    ]);

  if (fieldError) {
    throw new Error(fieldError.message);
  }

  if (xrefError) {
    throw new Error(xrefError.message);
  }

  return uniqueIds([...(byFields ?? []), ...(byXref ?? [])]);
}

function intersectIds(left: string[] | null, right: string[] | null) {
  if (left == null) {
    return right;
  }

  if (right == null) {
    return left;
  }

  const rightSet = new Set(right);
  return left.filter((id) => rightSet.has(id));
}

export async function listPublicProducts(
  filters: CatalogFilters = { make: "", model: "", year: null, query: "" },
  page = 1,
  pageSize = CATALOG_PAGE_SIZE,
): Promise<CatalogListResult> {
  await connection();
  const supabase = createPublicClient();

  if (!supabase) {
    return { data: [], total: 0, error: "Каталог пока недоступен." };
  }

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : CATALOG_PAGE_SIZE;
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;

  try {
    const [vehicleIds, searchIds] = await Promise.all([
      productIdsForVehicle(supabase, filters),
      productIdsForSearch(supabase, filters.query),
    ]);
    const ids = intersectIds(vehicleIds, searchIds);

    if (ids && ids.length === 0) {
      return { data: [], total: 0, error: null };
    }

    let query = supabase
      .from("products")
      .select(productSelect, { count: "exact" })
      .not("sku", "ilike", "RLS-TEST%")
      .order("name", { ascending: true })
      .range(from, to);

    if (ids) {
      query = query.in("id", ids);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("catalog.listPublicProducts", error.message);
      return { data: [], total: 0, error: "Не удалось загрузить каталог. Попробуйте позже." };
    }

    return {
      data: await withStock(
        supabase,
        ((data ?? []) as ProductRow[]).map((row) => mapProduct(row)),
      ),
      total: count ?? 0,
      error: null,
    };
  } catch (error) {
    console.error(
      "catalog.listPublicProducts",
      error instanceof Error ? error.message : error,
    );
    return { data: [], total: 0, error: "Не удалось загрузить каталог. Попробуйте позже." };
  }
}

export async function getPublicProductBySlug(
  slug: string,
): Promise<CatalogQueryResult<CatalogProduct | null>> {
  await connection();
  const supabase = createPublicClient();

  if (!supabase) {
    return { data: null, error: "Каталог пока недоступен." };
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .not("sku", "ilike", "RLS-TEST%")
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: "Не удалось загрузить товар. Попробуйте позже.",
    };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const [product] = await withStock(supabase, [mapProduct(data as ProductRow)]);

  return {
    data: product ?? null,
    error: null,
  };
}
