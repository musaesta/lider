"use client";

import { useActionState } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import { addOrderComment, setOrderStatus } from "@/lib/admin/order-actions";
import { emptyAdminFormState } from "@/lib/admin/form-state";
import { orderStatusLabel, orderStatusOptions } from "@/lib/orders/labels";

export function AdminOrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(setOrderStatus, emptyAdminFormState);

  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <input name="orderId" type="hidden" value={orderId} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Статус
        <select className={adminFieldClass} defaultValue={status} name="status">
          {orderStatusOptions.map((value) => (
            <option key={value} value={value}>
              {orderStatusLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <button className={adminButtonClass} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : "Сменить статус"}
      </button>
      {state.error ? (
        <p className="w-full text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function AdminOrderCommentForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(addOrderComment, emptyAdminFormState);

  return (
    <form action={action} className="mt-4 flex max-w-xl flex-col gap-3">
      <input name="orderId" type="hidden" value={orderId} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Комментарий
        <textarea className={adminFieldClass} name="body" required rows={3} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Кому виден
        <select className={adminFieldClass} defaultValue="customer" name="visibility">
          <option value="customer">Покупателю</option>
          <option value="internal">Только сотрудникам</option>
        </select>
      </label>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className={adminButtonClass} disabled={pending} type="submit">
        {pending ? "Отправляем…" : "Добавить комментарий"}
      </button>
    </form>
  );
}
