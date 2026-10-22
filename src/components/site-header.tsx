import Link from "next/link";
import { Suspense } from "react";
import { AdminLink } from "@/components/admin-link";
import { AuthControls } from "@/components/auth-controls";
import { CartLink } from "@/components/cart-link";
import { OrdersLink } from "@/components/orders-link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/75">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
        <div className="flex items-center gap-6">
          <Link
            aria-label="Автозапчасти — главная"
            className="inline-flex items-center gap-3"
            href="/"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-orange-400">
              <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v2m0 14v2M3 12h2m14 0h2m-2.636-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0-1.414-1.414M7.05 7.05 5.636 5.636M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Автозапчасти
            </span>
          </Link>
          <Link
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
            href="/catalog"
          >
            Каталог
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={<div className="h-9 w-16 rounded-full bg-slate-100" />}>
            <AdminLink />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-16 rounded-full bg-slate-100" />}>
            <OrdersLink />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-20 rounded-full bg-slate-100" />}>
            <CartLink />
          </Suspense>
          <Suspense
            fallback={
              <div className="h-9 w-40 rounded-full bg-slate-100" aria-hidden="true" />
            }
          >
            <AuthControls />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
