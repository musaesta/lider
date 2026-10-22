"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginHref, safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export type CartFormState = {
  error: string | null;
  info: string | null;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function requireCartUser(nextPath: string) {
  const supabase = await createClient();

  if (!supabase) {
    return { supabase: null, userId: null, error: "Подключение к базе не настроено." };
  }

  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (error || !userId) {
    redirect(loginHref(nextPath));
  }

  return { supabase, userId, error: null };
}

async function getOrCreateCartId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("carts")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("id")
    .single();

  if (error || !data) {
    return null;
  }

  return data.id as string;
}

function refreshCart() {
  revalidatePath("/", "layout");
  revalidatePath("/cart");
}

export async function addToCart(
  _prev: CartFormState,
  formData: FormData,
): Promise<CartFormState> {
  const productId = readField(formData, "productId");
  const nextPath = safeNextPath(readField(formData, "next") || "/cart");

  if (!productId) {
    return { error: "Не выбран товар.", info: null };
  }

  const { supabase, userId, error } = await requireCartUser(nextPath);

  if (!supabase || !userId) {
    return { error: error ?? "Нужно войти, чтобы добавить товар.", info: null };
  }

  const cartId = await getOrCreateCartId(supabase, userId);

  if (!cartId) {
    return { error: "Не удалось открыть корзину.", info: null };
  }

  const { data: existing, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) {
    return { error: "Не удалось добавить товар в корзину.", info: null };
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: Math.min(1000, existing.quantity + 1) })
      .eq("id", existing.id);

    if (updateError) {
      return { error: "Не удалось обновить количество.", info: null };
    }
  } else {
    const { error: insertError } = await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      quantity: 1,
    });

    if (insertError) {
      return { error: "Этот товар сейчас нельзя добавить в корзину.", info: null };
    }
  }

  refreshCart();
  return { error: null, info: "Товар добавлен в корзину." };
}

export async function updateCartItem(formData: FormData) {
  const itemId = readField(formData, "itemId");
  const quantity = Number(readField(formData, "quantity"));

  if (!itemId) {
    return;
  }

  const { supabase, userId } = await requireCartUser("/cart");

  if (!supabase || !userId) {
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    await supabase.from("cart_items").delete().eq("id", itemId);
    refreshCart();
    return;
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: Math.min(1000, quantity) })
    .eq("id", itemId);

  if (error) {
    return;
  }

  refreshCart();
}

export async function removeCartItem(formData: FormData) {
  const itemId = readField(formData, "itemId");

  if (!itemId) {
    return;
  }

  const { supabase, userId } = await requireCartUser("/cart");

  if (!supabase || !userId) {
    return;
  }

  await supabase.from("cart_items").delete().eq("id", itemId);
  refreshCart();
}
