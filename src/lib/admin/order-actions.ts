"use server";

import { revalidatePath } from "next/cache";
import { requireStaffAction } from "@/lib/auth/staff";
import {
  emptyAdminFormState,
  readField,
  type AdminFormState,
} from "@/lib/admin/form-state";
import { createClient } from "@/lib/supabase/server";

function refreshOrder(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

function mapStaffError(message: string) {
  if (message.includes("NOT_STAFF")) {
    return "Нужны права сотрудника.";
  }

  if (message.includes("ORDER_NOT_FOUND")) {
    return "Заказ не найден.";
  }

  if (message.includes("SAME_STATUS")) {
    return "Заказ уже в этом статусе.";
  }

  if (message.includes("EMPTY_COMMENT")) {
    return "Напишите текст комментария.";
  }

  if (message.includes("COMMENT_TOO_LONG")) {
    return "Комментарий слишком длинный.";
  }

  return "Не удалось выполнить действие.";
}

export async function setOrderStatus(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const orderId = readField(formData, "orderId");
  const status = readField(formData, "status");
  await requireStaffAction(orderId ? `/admin/orders/${orderId}` : "/admin/orders");

  if (!orderId || !status) {
    return { error: "Выберите статус." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { error } = await supabase.rpc("staff_set_order_status", {
    p_order_id: orderId,
    p_new_status: status,
  });

  if (error) {
    return { error: mapStaffError(error.message) };
  }

  refreshOrder(orderId);
  return emptyAdminFormState;
}

export async function addOrderComment(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const orderId = readField(formData, "orderId");
  const body = readField(formData, "body");
  const visibility = readField(formData, "visibility") || "internal";
  await requireStaffAction(orderId ? `/admin/orders/${orderId}` : "/admin/orders");

  if (!orderId) {
    return { error: "Заказ не найден." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено." };
  }

  const { error } = await supabase.rpc("staff_add_order_comment", {
    p_order_id: orderId,
    p_body: body,
    p_visibility: visibility,
  });

  if (error) {
    return { error: mapStaffError(error.message) };
  }

  refreshOrder(orderId);
  return emptyAdminFormState;
}
