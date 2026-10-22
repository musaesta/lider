"use client";

import Link from "next/link";
import { useActionState } from "react";
import { formatAddress, type Address } from "@/lib/account/address-format";
import { placeOrder, type CheckoutFormState } from "@/lib/orders/actions";

const initialState: CheckoutFormState = { error: null };

export function CheckoutForm({
  addresses,
  canPlace = true,
}: {
  addresses: Address[];
  canPlace?: boolean;
}) {
  const [state, action, pending] = useActionState(placeOrder, initialState);

  if (addresses.length === 0) {
    return (
      <p className="mt-8 text-sm leading-6 text-slate-500">
        Сначала добавьте адрес доставки.{" "}
        <Link className="font-medium text-slate-900 underline" href="/account/addresses/new">
          Добавить адрес
        </Link>
      </p>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-slate-700">Адрес доставки</legend>
        {addresses.map((address, index) => (
          <label
            className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm"
            key={address.id}
          >
            <input
              className="mt-1"
              defaultChecked={index === 0}
              name="addressId"
              type="radio"
              value={address.id}
            />
            <span>
              <span className="block font-medium text-slate-950">
                {address.recipientName}, {address.phone}
              </span>
              <span className="mt-1 block text-slate-500">{formatAddress(address)}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <p>
        <Link className="text-sm font-medium text-slate-600 underline" href="/account/addresses">
          Управление адресами
        </Link>
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Комментарий к заказу
        <textarea
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4"
          maxLength={2000}
          name="customerComment"
          rows={3}
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending || !canPlace}
        type="submit"
      >
        {pending ? "Оформляем…" : "Оформить заказ"}
      </button>
      <p className="text-sm text-slate-400">
        Оплата пока не списывается. Заказ уйдёт менеджеру со статусом «ожидает оплаты».
      </p>
    </form>
  );
}
