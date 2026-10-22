"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginHref } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export type CheckoutFormState = {
  error: string | null;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function mapPlaceOrderError(message: string) {
  if (message.includes("EMPTY_CART")) {
    return "Корзина пустая.";
  }

  if (message.includes("ADDRESS_NOT_FOUND")) {
    return "Выберите свой адрес доставки.";
  }

  if (message.includes("UNAVAILABLE_PRODUCTS")) {
    return "В корзине есть товар, который уже нельзя заказать. Удалите его и попробуйте снова.";
  }

  if (message.includes("COMMENT_TOO_LONG")) {
    return "Комментарий слишком длинный.";
  }

  if (message.includes("NOT_AUTHENTICATED")) {
    return "Нужно войти, чтобы оформить заказ.";
  }

  return "Не удалось оформить заказ. Попробуйте ещё раз.";
}

export async function placeOrder(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const addressId = readField(formData, "addressId");
  const customerComment = readField(formData, "customerComment");

  if (!addressId) {
    return { error: "Выберите адрес доставки." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId =
    typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;

  if (claimsError || !userId) {
    redirect(loginHref("/checkout"));
  }

  const { data, error } = await supabase.rpc("place_order", {
    p_address_id: addressId,
    p_customer_comment: customerComment || null,
  });

  if (error) {
    return { error: mapPlaceOrderError(error.message) };
  }

  if (typeof data !== "string" || !data) {
    return { error: "Заказ не создался. Попробуйте ещё раз." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath(`/orders/${data}`);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${data}`);
  redirect(`/orders/${data}`);
}
