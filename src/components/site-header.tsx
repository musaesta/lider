import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLink } from "@/components/admin-link";
import { AuthControls } from "@/components/auth-controls";
import { CartLink } from "@/components/cart-link";
import { OrdersLink } from "@/components/orders-link";

export function SiteHeader() {
  return (
    <header className="border-b-[3px] border-accent bg-chrome text-on-chrome">
      <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-10 lg:px-12">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            aria-label="LIDER Запчасти — главная"
            className="inline-flex shrink-0"
            href="/"
          >
            <Image
              alt=""
              className="size-11 sm:hidden"
              height={44}
              src="/logo.svg"
              unoptimized
              width={44}
            />
            <Image
              alt=""
              className="hidden h-[52px] w-auto sm:block"
              height={52}
              src="/logo-horizontal.svg"
              unoptimized
              width={146}
            />
          </Link>
          <Link
            className="text-sm font-semibold uppercase tracking-[0.16em] text-on-chrome-muted transition-colors hover:text-on-chrome"
            href="/catalog"
          >
            Каталог
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <Suspense fallback={<div className="h-9 w-16 rounded-full bg-white/10" />}>
            <AdminLink />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-16 rounded-full bg-white/10" />}>
            <OrdersLink />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-20 rounded-full bg-white/10" />}>
            <CartLink />
          </Suspense>
          <Suspense
            fallback={
              <div className="h-9 w-40 rounded-full bg-white/10" aria-hidden="true" />
            }
          >
            <AuthControls />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
