import { connection } from "next/server";
import { productImagePublicUrl } from "@/lib/catalog/image-url";
import { getAuthViewer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CartLine = {
  id: string;
  quantity: number;
  productId: string;
  name: string;
  slug: string;
  article: string;
  price: string | number;
  brandName: string;
  imageUrl: string | null;
  imageAlt: string;
  available: boolean;
};

type NamedRelation = { name: string } | { name: string }[] | null;
type ImageRow = {
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type CartProductRow = {
  id: string;
  name: string;
  slug: string;
  article: string;
  price: string | number;
  brands: NamedRelation;
  product_images: ImageRow[] | null;
} | null;

type CartItemRow = {
  id: string;
  quantity: number;
  product_id: string;
  products: CartProductRow | CartProductRow[];
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

function asProduct(value: CartProductRow | CartProductRow[]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

async function getOwnCartId() {
  const viewer = await getAuthViewer();
  const supabase = await createClient();

  if (!viewer || !supabase) {
    return { supabase: null, cartId: null as string | null };
  }

  const { data } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", viewer.id)
    .maybeSingle();

  return { supabase, cartId: data?.id ?? null };
}

export async function getCartItemCount() {
  await connection();
  const { supabase, cartId } = await getOwnCartId();

  if (!supabase || !cartId) {
    return 0;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cartId);

  if (error || !data) {
    return 0;
  }

  return data.reduce((sum, row) => sum + row.quantity, 0);
}

export async function getCartLines(): Promise<{
  lines: CartLine[];
  error: string | null;
}> {
  await connection();
  const { supabase, cartId } = await getOwnCartId();

  if (!supabase) {
    return { lines: [], error: null };
  }

  if (!cartId) {
    return { lines: [], error: null };
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product_id,
      products (
        id,
        name,
        slug,
        article,
        price,
        brands ( name ),
        product_images ( storage_path, alt_text, sort_order )
      )
    `,
    )
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("cart.getCartLines", error.message);
    return { lines: [], error: "Не удалось загрузить корзину. Попробуйте позже." };
  }

  const lines = ((data ?? []) as CartItemRow[]).map((row) => {
    const product = asProduct(row.products);
    const image = product?.product_images
      ? [...product.product_images].sort((left, right) => left.sort_order - right.sort_order)[0]
      : null;

    return {
      id: row.id,
      quantity: row.quantity,
      productId: row.product_id,
      name: product?.name ?? "Товар недоступен",
      slug: product?.slug ?? "",
      article: product?.article ?? "",
      price: product?.price ?? 0,
      brandName: relationName(product?.brands ?? null),
      imageUrl: productImagePublicUrl(image?.storage_path),
      imageAlt: image?.alt_text?.trim() || product?.name || "Товар",
      available: Boolean(product),
    };
  });

  return { lines, error: null };
}
