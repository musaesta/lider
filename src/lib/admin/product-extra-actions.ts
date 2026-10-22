"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  emptyAdminFormState,
  optionalField,
  readField,
  type AdminFormState,
} from "@/lib/admin/form-state";
import { requireStaffAction } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

function refreshProduct(productId: string) {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/", "layout");
}

export async function createVehicle(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireStaffAction("/admin/vehicles");
  const make = readField(formData, "make");
  const model = readField(formData, "model");
  const generation = optionalField(formData, "generation");
  const engine = optionalField(formData, "engine");
  const yearFromRaw = readField(formData, "yearFrom");
  const yearToRaw = readField(formData, "yearTo");
  const yearFrom = yearFromRaw ? Number(yearFromRaw) : null;
  const yearTo = yearToRaw ? Number(yearToRaw) : null;

  if (!make || !model) {
    return { error: "Укажите марку и модель." };
  }

  if (
    (yearFrom != null && !Number.isInteger(yearFrom)) ||
    (yearTo != null && !Number.isInteger(yearTo))
  ) {
    return { error: "Годы должны быть целыми числами." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { error } = await supabase.from("vehicles").insert({
    make,
    model,
    generation,
    engine,
    year_from: yearFrom,
    year_to: yearTo,
  });

  if (error) {
    return { error: "Не удалось сохранить автомобиль. Возможно, такая запись уже есть." };
  }

  revalidatePath("/admin/vehicles");
  revalidatePath("/catalog");
  redirect("/admin/vehicles");
}

export async function addProductCompatibility(formData: FormData) {
  const productId = readField(formData, "productId");
  const vehicleId = readField(formData, "vehicleId");
  await requireStaffAction(productId ? `/admin/products/${productId}` : "/admin/products");

  if (!productId || !vehicleId) {
    return;
  }

  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  await supabase.from("product_compatibility").insert({
    product_id: productId,
    vehicle_id: vehicleId,
  });
  refreshProduct(productId);
}

export async function removeProductCompatibility(formData: FormData) {
  const productId = readField(formData, "productId");
  const linkId = readField(formData, "linkId");
  await requireStaffAction(productId ? `/admin/products/${productId}` : "/admin/products");

  if (!productId || !linkId) {
    return;
  }

  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  await supabase.from("product_compatibility").delete().eq("id", linkId).eq("product_id", productId);
  refreshProduct(productId);
}

export async function setProductInventory(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const productId = readField(formData, "productId");
  await requireStaffAction(productId ? `/admin/products/${productId}` : "/admin/products");
  const quantity = Number(readField(formData, "quantityOnHand"));

  if (!productId) {
    return { error: "Товар не найден." };
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    return { error: "Количество должно быть целым числом от 0." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { error } = await supabase.rpc("staff_set_inventory", {
    p_product_id: productId,
    p_quantity_on_hand: quantity,
  });

  if (error) {
    if (error.message.includes("RESERVED_ABOVE_STOCK")) {
      return { error: "Нельзя поставить остаток меньше уже зарезервированного." };
    }

    return { error: "Не удалось сохранить остаток." };
  }

  refreshProduct(productId);
  return emptyAdminFormState;
}

const allowedImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadProductImage(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const productId = readField(formData, "productId");
  await requireStaffAction(productId ? `/admin/products/${productId}` : "/admin/products");
  const altText = optionalField(formData, "altText");
  const file = formData.get("file");

  if (!productId) {
    return { error: "Товар не найден." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл JPEG, PNG или WebP." };
  }

  const extension = allowedImageTypes[file.type];

  if (!extension) {
    return { error: "Можно загрузить только JPEG, PNG или WebP." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Файл больше 5 МБ." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const storagePath = `products/${productId}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: "Не удалось загрузить файл в хранилище." };
  }

  const { data: current } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    alt_text: altText,
    sort_order: (current?.sort_order ?? -1) + 1,
  });

  if (insertError) {
    await supabase.storage.from("product-images").remove([storagePath]);
    return { error: "Файл загружен, но запись в каталоге не создалась." };
  }

  refreshProduct(productId);
  return emptyAdminFormState;
}

export async function deleteProductImage(formData: FormData) {
  const productId = readField(formData, "productId");
  const imageId = readField(formData, "imageId");
  await requireStaffAction(productId ? `/admin/products/${productId}` : "/admin/products");

  if (!productId || !imageId) {
    return;
  }

  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  const { data } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", productId);

  if (data?.storage_path) {
    await supabase.storage.from("product-images").remove([data.storage_path]);
  }

  refreshProduct(productId);
}
