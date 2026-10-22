"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginHref } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export type AddressFormState = {
  error: string | null;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalField(formData: FormData, name: string) {
  const value = readField(formData, name);
  return value.length > 0 ? value : null;
}

async function requireUser() {
  const supabase = await createClient();

  if (!supabase) {
    return { supabase: null, userId: null, error: "Подключение к базе не настроено." };
  }

  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (error || !userId) {
    redirect(loginHref("/account/addresses"));
  }

  return { supabase, userId, error: null };
}

function readAddressFields(formData: FormData) {
  const recipientName = readField(formData, "recipientName");
  const phone = readField(formData, "phone");
  const city = readField(formData, "city");
  const addressLine1 = readField(formData, "addressLine1");

  if (!recipientName || !phone || !city || !addressLine1) {
    return {
      error: "Укажите имя, телефон, город и улицу.",
      values: null,
    };
  }

  if (phone.length > 32) {
    return { error: "Телефон слишком длинный.", values: null };
  }

  return {
    error: null,
    values: {
      recipient_name: recipientName,
      phone,
      country_code: "RU",
      region: optionalField(formData, "region"),
      city,
      postal_code: optionalField(formData, "postalCode"),
      address_line1: addressLine1,
      address_line2: optionalField(formData, "addressLine2"),
      delivery_instructions: optionalField(formData, "deliveryInstructions"),
    },
  };
}

function refreshAddresses() {
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function createAddress(
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const parsed = readAddressFields(formData);

  if (parsed.error || !parsed.values) {
    return { error: parsed.error };
  }

  const { supabase, userId, error } = await requireUser();

  if (!supabase || !userId) {
    return { error: error ?? "Нужно войти, чтобы сохранить адрес." };
  }

  const { error: insertError } = await supabase.from("addresses").insert({
    user_id: userId,
    ...parsed.values,
  });

  if (insertError) {
    return { error: "Не удалось сохранить адрес. Проверьте поля и попробуйте ещё раз." };
  }

  refreshAddresses();
  redirect("/account/addresses");
}

export async function updateAddress(
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const id = readField(formData, "addressId");
  const parsed = readAddressFields(formData);

  if (!id) {
    return { error: "Адрес не найден." };
  }

  if (parsed.error || !parsed.values) {
    return { error: parsed.error };
  }

  const { supabase, userId, error } = await requireUser();

  if (!supabase || !userId) {
    return { error: error ?? "Нужно войти, чтобы изменить адрес." };
  }

  const { error: updateError } = await supabase
    .from("addresses")
    .update(parsed.values)
    .eq("id", id)
    .eq("user_id", userId);

  if (updateError) {
    return { error: "Не удалось обновить адрес." };
  }

  refreshAddresses();
  redirect("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  const id = readField(formData, "addressId");

  if (!id) {
    return;
  }

  const { supabase, userId } = await requireUser();

  if (!supabase || !userId) {
    return;
  }

  await supabase.from("addresses").delete().eq("id", id).eq("user_id", userId);
  refreshAddresses();
  redirect("/account/addresses");
}
