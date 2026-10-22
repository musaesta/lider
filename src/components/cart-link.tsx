import Link from "next/link";
import { getCartItemCount } from "@/lib/cart/queries";

export async function CartLink() {
  const count = await getCartItemCount();

  return (
    <Link
      className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
      href="/cart"
    >
      Корзина{count > 0 ? ` · ${count}` : ""}
    </Link>
  );
}
