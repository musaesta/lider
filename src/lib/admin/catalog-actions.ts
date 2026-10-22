"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  emptyAdminFormState,
  optionalField,
  readField,
  type AdminFormState,
} from "@/lib/admin/form-state";
import { slugify } from "@/lib/admin/slug";
import { requireStaffAction } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

function refreshCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/brands");
  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidatePath("/", "layout");
}

export async function createBrand(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireStaffAction("/admin/brands");
  const name = readField(formData, "name");
  const slug = slugify(readField(formData, "slug") || name);
  const isPublished = formData.get("isPublished") === "on";

  if (!name || !slug) {
    return { error: "Укажите название. Для ссылки нужны латинские буквы или цифры." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { error } = await supabase.from("brands").insert({
    name,
    slug,
    is_published: isPublished,
  });

  if (error) {
    return { error: "Не удалось сохранить бренд. Возможно, такое имя или ссылка уже есть." };
  }

  refreshCatalog();
  redirect("/admin/brands");
}

export async function createCategory(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireStaffAction("/admin/categories");
  const name = readField(formData, "name");
  const slug = slugify(readField(formData, "slug") || name);
  const description = optionalField(formData, "description");
  const isPublished = formData.get("isPublished") === "on";

  if (!name || !slug) {
    return { error: "Укажите название. Для ссылки нужны латинские буквы или цифры." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description,
    is_published: isPublished,
  });

  if (error) {
    return { error: "Не удалось сохранить категорию. Проверьте уникальность ссылки." };
  }

  refreshCatalog();
  redirect("/admin/categories");
}

function readProductFields(formData: FormData) {
  const name = readField(formData, "name");
  const sku = readField(formData, "sku");
  const article = readField(formData, "article");
  const slug = slugify(readField(formData, "slug") || sku);
  const description = optionalField(formData, "description");
  const brandId = readField(formData, "brandId");
  const categoryId = readField(formData, "categoryId");
  const price = Number(readField(formData, "price").replace(",", "."));
  const isActive = formData.get("isActive") === "on";

  if (!name || !sku || !article || !slug || !brandId || !categoryId) {
    return { error: "Заполните название, SKU, артикул, бренд и категорию.", values: null };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Укажите цену числом.", values: null };
  }

  return {
    error: null,
    values: {
      name,
      sku,
      article,
      slug,
      description,
      brand_id: brandId,
      category_id: categoryId,
      price,
      is_active: isActive,
    },
  };
}

export async function createProduct(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireStaffAction("/admin/products/new");
  const parsed = readProductFields(formData);

  if (parsed.error || !parsed.values) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.values, is_active: false })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    return { error: "Не удалось создать товар. Проверьте уникальность SKU, артикула и ссылки." };
  }

  refreshCatalog();
  redirect(`/admin/products/${data.id}`);
}

export async function updateProduct(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const id = readField(formData, "productId");
  await requireStaffAction(id ? `/admin/products/${id}` : "/admin/products");
  const parsed = readProductFields(formData);

  if (!id) {
    return { error: "Товар не найден." };
  }

  if (parsed.error || !parsed.values) {
    return { error: parsed.error };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const fields = {
    name: parsed.values.name,
    sku: parsed.values.sku,
    article: parsed.values.article,
    slug: parsed.values.slug,
    description: parsed.values.description,
    brand_id: parsed.values.brand_id,
    category_id: parsed.values.category_id,
    price: parsed.values.price,
  };
  const { error } = await supabase.from("products").update(fields).eq("id", id);

  if (error) {
    return { error: "Не удалось сохранить товар." };
  }

  refreshCatalog();
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/catalog/${fields.slug}`);
  return emptyAdminFormState;
}

export async function publishProduct(formData: FormData) {
  const id = readField(formData, "productId");
  await requireStaffAction(id ? `/admin/products/${id}` : "/admin/products");

  if (!id) {
    return;
  }

  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("products")
    .update({ is_active: true })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error || !data?.slug) {
    return;
  }

  refreshCatalog();
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/catalog/${data.slug}`);
  redirect(`/catalog/${data.slug}`);
}

export async function hideProductFromCatalog(formData: FormData) {
  const id = readField(formData, "productId");
  await requireStaffAction(id ? `/admin/products/${id}` : "/admin/products");

  if (!id) {
    return;
  }

  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  const { data } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  refreshCatalog();
  revalidatePath(`/admin/products/${id}`);
  if (data?.slug) {
    revalidatePath(`/catalog/${data.slug}`);
  }
}
