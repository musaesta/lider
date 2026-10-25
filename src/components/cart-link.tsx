import Link from "next/link";
import { chromeLinkClass } from "@/components/chrome";
import { getCartItemCount } from "@/lib/cart/queries";

export async function CartLink() {
  const count = await getCartItemCount();

  return (
    <Link className={chromeLinkClass} href="/cart" prefetch={false}>
      Корзина{count > 0 ? ` · ${count}` : ""}
    </Link>
  );
}
