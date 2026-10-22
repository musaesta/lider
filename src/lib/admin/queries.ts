import { connection } from "next/server";
import { productImagePublicUrl } from "@/lib/catalog/image-url";
import { getStaffViewer } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
};

export type AdminVehicle = {
  id: string;
  make: string;
  model: string;
  generation: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  engine: string | null;
};

export type AdminProductImage = {
  id: string;
  url: string | null;
  altText: string | null;
  sortOrder: number;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  sku: string;
  article: string;
  slug: string;
  price: string | number;
  isActive: boolean;
  brandName: string;
  categoryName: string;
};

export type AdminProduct = AdminProductListItem & {
  description: string | null;
  brandId: string;
  categoryId: string;
  images: AdminProductImage[];
  quantityOnHand: number | null;
  quantityReserved: number | null;
  compatibility: Array<{ id: string; vehicleId: string; label: string }>;
};

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string | number;
  createdAt: string;
  contactName: string;
};

function vehicleLabel(vehicle: AdminVehicle) {
  const years = [vehicle.yearFrom, vehicle.yearTo].filter(Boolean).join("–");
  return [vehicle.make, vehicle.model, vehicle.generation, years, vehicle.engine]
    .filter((part) => part && String(part).trim())
    .join(" ");
}

async function staffClient() {
  await connection();
  const staff = await getStaffViewer();
  const supabase = await createClient();

  if (!staff || !supabase) {
    return null;
  }

  return supabase;
}

export async function listAdminBrands(): Promise<{
  brands: AdminBrand[];
  error: string | null;
}> {
  const supabase = await staffClient();

  if (!supabase) {
    return { brands: [], error: null };
  }

  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, is_published")
    .not("slug", "ilike", "rls-test%")
    .order("name");

  if (error) {
    return { brands: [], error: "Не удалось загрузить бренды." };
  }

  return {
    brands: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isPublished: row.is_published,
    })),
    error: null,
  };
}

export async function listAdminCategories(): Promise<{
  categories: AdminCategory[];
  error: string | null;
}> {
  const supabase = await staffClient();

  if (!supabase) {
    return { categories: [], error: null };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_published")
    .not("slug", "ilike", "rls-test%")
    .order("name");

  if (error) {
    return { categories: [], error: "Не удалось загрузить категории." };
  }

  return {
    categories: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isPublished: row.is_published,
    })),
    error: null,
  };
}

export async function listAdminVehicles(): Promise<{
  vehicles: AdminVehicle[];
  error: string | null;
}> {
  const supabase = await staffClient();

  if (!supabase) {
    return { vehicles: [], error: null };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, generation, year_from, year_to, engine")
    .not("make", "ilike", "rls-test%")
    .order("make")
    .order("model");

  if (error) {
    return { vehicles: [], error: "Не удалось загрузить автомобили." };
  }

  return {
    vehicles: (data ?? []).map((row) => ({
      id: row.id,
      make: row.make,
      model: row.model,
      generation: row.generation,
      yearFrom: row.year_from,
      yearTo: row.year_to,
      engine: row.engine,
    })),
    error: null,
  };
}

export async function listAdminProducts(): Promise<{
  products: AdminProductListItem[];
  error: string | null;
}> {
  const supabase = await staffClient();

  if (!supabase) {
    return { products: [], error: null };
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, article, slug, price, is_active, brands ( name ), categories ( name )")
    .not("sku", "ilike", "RLS-TEST%")
    .order("is_active", { ascending: true })
    .order("name");

  if (error) {
    return { products: [], error: "Не удалось загрузить товары." };
  }

  return {
    products: (data ?? []).map((row) => {
      const brands = row.brands as { name: string } | { name: string }[] | null;
      const categories = row.categories as { name: string } | { name: string }[] | null;
      const brandName = Array.isArray(brands) ? brands[0]?.name : brands?.name;
      const categoryName = Array.isArray(categories)
        ? categories[0]?.name
        : categories?.name;

      return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        article: row.article,
        slug: row.slug,
        price: row.price,
        isActive: row.is_active,
        brandName: brandName ?? "",
        categoryName: categoryName ?? "",
      };
    }),
    error: null,
  };
}

export async function getAdminProduct(id: string): Promise<{
  product: AdminProduct | null;
  error: string | null;
}> {
  const supabase = await staffClient();

  if (!supabase) {
    return { product: null, error: null };
  }

  const [{ data, error }, { data: inventory }, { data: links }, { data: vehicles }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          `
          id, name, sku, article, slug, description, price, is_active, brand_id, category_id,
          brands ( name ),
          categories ( name ),
          product_images ( id, storage_path, alt_text, sort_order )
        `,
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("inventory")
        .select("quantity_on_hand, quantity_reserved")
        .eq("product_id", id)
        .maybeSingle(),
      supabase
        .from("product_compatibility")
        .select("id, vehicle_id")
        .eq("product_id", id),
      supabase
        .from("vehicles")
        .select("id, make, model, generation, year_from, year_to, engine")
        .not("make", "ilike", "rls-test%"),
    ]);

  if (error) {
    return { product: null, error: "Не удалось загрузить товар." };
  }

  if (!data) {
    return { product: null, error: null };
  }

  const brands = data.brands as { name: string } | { name: string }[] | null;
  const categories = data.categories as { name: string } | { name: string }[] | null;
  const brandName = Array.isArray(brands) ? brands[0]?.name : brands?.name;
  const categoryName = Array.isArray(categories)
    ? categories[0]?.name
    : categories?.name;
  const images = Array.isArray(data.product_images) ? data.product_images : [];
  const vehicleMap = new Map(
    (vehicles ?? []).map((row) => [
      row.id,
      vehicleLabel({
        id: row.id,
        make: row.make,
        model: row.model,
        generation: row.generation,
        yearFrom: row.year_from,
        yearTo: row.year_to,
        engine: row.engine,
      }),
    ]),
  );

  return {
    product: {
      id: data.id,
      name: data.name,
      sku: data.sku,
      article: data.article,
      slug: data.slug,
      description: data.description,
      price: data.price,
      isActive: data.is_active,
      brandId: data.brand_id,
      categoryId: data.category_id,
      brandName: brandName ?? "",
      categoryName: categoryName ?? "",
      images: images
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((image) => ({
          id: image.id,
          url: productImagePublicUrl(image.storage_path),
          altText: image.alt_text,
          sortOrder: image.sort_order,
        })),
      quantityOnHand: inventory?.quantity_on_hand ?? null,
      quantityReserved: inventory?.quantity_reserved ?? null,
      compatibility: (links ?? []).map((link) => ({
        id: link.id,
        vehicleId: link.vehicle_id,
        label: vehicleMap.get(link.vehicle_id) ?? link.vehicle_id,
      })),
    },
    error: null,
  };
}

export { vehicleLabel };

export async function listAdminOrders(): Promise<{
  orders: AdminOrderListItem[];
  error: string | null;
}> {
  const supabase = await staffClient();

  if (!supabase) {
    return { orders: [], error: null };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, created_at, contact_name")
    .not("order_number", "ilike", "RLS-TEST%")
    .order("created_at", { ascending: false });

  if (error) {
    return { orders: [], error: "Не удалось загрузить заказы." };
  }

  return {
    orders: (data ?? []).map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      totalAmount: row.total_amount,
      createdAt: row.created_at,
      contactName: row.contact_name,
    })),
    error: null,
  };
}

export async function getAdminOrder(id: string) {
  const supabase = await staffClient();

  if (!supabase) {
    return { order: null, error: null as string | null };
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      total_amount,
      created_at,
      contact_name,
      contact_phone,
      shipping_city,
      shipping_region,
      shipping_postal_code,
      shipping_address_line1,
      shipping_address_line2,
      customer_comment,
      order_items (
        id,
        name_snapshot,
        sku_snapshot,
        quantity,
        unit_price,
        line_total
      ),
      order_status_history (
        id,
        new_status,
        created_at
      ),
      order_comments (
        id,
        body,
        created_at,
        visibility
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { order: null, error: "Не удалось загрузить заказ." };
  }

  if (!data) {
    return { order: null, error: null };
  }

  const comments = Array.isArray(data.order_comments) ? data.order_comments : [];
  const history = Array.isArray(data.order_status_history)
    ? data.order_status_history
    : [];
  const items = Array.isArray(data.order_items) ? data.order_items : [];

  return {
    order: {
      id: data.id,
      orderNumber: data.order_number,
      status: data.status,
      paymentStatus: data.payment_status,
      totalAmount: data.total_amount,
      createdAt: data.created_at,
      contactName: data.contact_name,
      contactPhone: data.contact_phone,
      shippingCity: data.shipping_city,
      shippingRegion: data.shipping_region,
      shippingPostalCode: data.shipping_postal_code,
      shippingAddressLine1: data.shipping_address_line1,
      shippingAddressLine2: data.shipping_address_line2,
      customerComment: data.customer_comment,
      items: items.map((item) => ({
        id: item.id,
        name: item.name_snapshot,
        sku: item.sku_snapshot,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      })),
      history: [...history]
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
        .map((entry) => ({
          id: entry.id,
          status: entry.new_status,
          createdAt: entry.created_at,
        })),
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
        visibility: comment.visibility as string,
      })),
    },
    error: null,
  };
}
