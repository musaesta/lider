"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginHref } from "@/lib/auth/paths";
import { addToCart, type CartFormState } from "@/lib/cart/actions";
import { Spinner } from "@/components/spinner";

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
      <p className="mt-8 text-sm font-medium text-muted">Нет в наличии</p>
    );
  }

  if (!loggedIn) {
    return (
      <Link
        className="mt-8 inline-flex rounded-xl bg-accent transition-colors hover:bg-accent-hover px-4 py-2.5 text-sm font-semibold text-white"
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
        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Добавляем…" : "В корзину"}
      </button>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="text-sm text-muted" role="status">
          {state.info}{" "}
          <Link className="font-medium text-ink underline" href="/cart">
            Открыть корзину
          </Link>
        </p>
      ) : null}
    </form>
  );
}
