"use client";

import { useActionState } from "react";
import type { Address } from "@/lib/account/address-format";
import {
  createAddress,
  updateAddress,
  type AddressFormState,
} from "@/lib/account/address-actions";

const initialState: AddressFormState = { error: null };

const fieldClass =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4";

export function AddressForm({
  address,
}: {
  address?: Address;
}) {
  const action = address ? updateAddress : createAddress;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 flex max-w-xl flex-col gap-4">
      {address ? <input name="addressId" type="hidden" value={address.id} /> : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Получатель
        <input
          className={fieldClass}
          defaultValue={address?.recipientName ?? ""}
          name="recipientName"
          required
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Телефон
        <input
          className={fieldClass}
          defaultValue={address?.phone ?? ""}
          name="phone"
          required
          type="tel"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Город
        <input
          className={fieldClass}
          defaultValue={address?.city ?? ""}
          name="city"
          required
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Регион
        <input
          className={fieldClass}
          defaultValue={address?.region ?? ""}
          name="region"
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Индекс
        <input
          className={fieldClass}
          defaultValue={address?.postalCode ?? ""}
          name="postalCode"
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Улица, дом
        <input
          className={fieldClass}
          defaultValue={address?.addressLine1 ?? ""}
          name="addressLine1"
          required
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Квартира, офис
        <input
          className={fieldClass}
          defaultValue={address?.addressLine2 ?? ""}
          name="addressLine2"
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Комментарий для доставки
        <textarea
          className={fieldClass}
          defaultValue={address?.deliveryInstructions ?? ""}
          name="deliveryInstructions"
          rows={3}
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="mt-2 w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Сохраняем…" : address ? "Сохранить адрес" : "Добавить адрес"}
      </button>
    </form>
  );
}
