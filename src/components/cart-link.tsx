import Link from "next/link";
import { getCartItemCount } from "@/lib/cart/queries";

export async function CartLink() {
  const count = await getCartItemCount();
  const label = count > 0 ? `Корзина, товаров: ${count}` : "Корзина";

  return (
    <Link
      aria-label={label}
      className="relative inline-flex size-10 items-center justify-center rounded-full text-on-chrome-muted transition-colors hover:bg-white/10 hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      href="/cart"
      prefetch={false}
    >
      <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M6.5 7h13l-1.4 8.2a1.5 1.5 0 0 1-1.48 1.25H9.1a1.5 1.5 0 0 1-1.47-1.2L5.7 4.8H3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle cx="9.5" cy="20" fill="currentColor" r="1.35" />
        <circle cx="17.5" cy="20" fill="currentColor" r="1.35" />
      </svg>
      {count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
