"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginHref } from "@/lib/auth/paths";
import { addToCart, type CartFormState } from "@/lib/cart/actions";

const initialState: CartFormState = { error: null, info: null };

export function AddToCartButton({
  productId,
  loggedIn,
  nextPath,
  inStock,
}: {
  productId: string;
  loggedIn: boolean;
  nextPath: string;
  inStock: boolean;
}) {
  const [state, action, pending] = useActionState(addToCart, initialState);

  if (!inStock) {
    return (
      <p className="mt-8 text-sm font-medium text-slate-500">Нет в наличии</p>
    );
  }

  if (!loggedIn) {
    return (
      <Link
        className="mt-8 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
        href={loginHref(nextPath)}
      >
        Войти, чтобы добавить в корзину
      </Link>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <input name="productId" type="hidden" value={productId} />
      <input name="next" type="hidden" value={nextPath} />
      <button
        className="inline-flex w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Добавляем…" : "В корзину"}
      </button>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="text-sm text-slate-600" role="status">
          {state.info}{" "}
          <Link className="font-medium text-slate-950 underline" href="/cart">
            Открыть корзину
          </Link>
        </p>
      ) : null}
    </form>
  );
}
