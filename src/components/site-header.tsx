import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AuthControls } from "@/components/auth-controls";
import { CartLink } from "@/components/cart-link";
import { drawerLinkClass } from "@/components/chrome";
import { MobileMenu } from "@/components/mobile-menu";
import { OrdersLink } from "@/components/orders-link";

export function SiteHeader() {
  return (
    <header className="relative z-40 border-b-[3px] border-accent bg-chrome text-on-chrome">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-10 lg:px-12">
        <div className="flex min-w-0 items-center gap-3 md:gap-6">
          <Link
            aria-label="LIDER Запчасти — главная"
            className="inline-flex shrink-0"
            href="/"
          >
            <Image
              alt=""
              className="size-11 md:hidden"
              height={44}
              src="/logo.svg"
              unoptimized
              width={44}
            />
            <Image
              alt=""
              className="hidden h-[52px] w-auto md:block"
              height={52}
              src="/logo-horizontal.svg"
              unoptimized
              width={146}
            />
          </Link>
          <Link
            className="hidden text-sm font-semibold uppercase tracking-[0.16em] text-on-chrome-muted transition-colors hover:text-on-chrome md:inline"
            href="/catalog"
          >
            Каталог
          </Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Suspense fallback={<div className="h-9 w-16 rounded-full bg-white/10" />}>
              <OrdersLink />
            </Suspense>
          </div>
          <Suspense fallback={<div className="size-10 rounded-full bg-white/10" />}>
            <CartLink />
          </Suspense>
          <div className="hidden md:block">
            <Suspense
              fallback={
                <div className="h-9 w-40 rounded-full bg-white/10" aria-hidden="true" />
              }
            >
              <AuthControls />
            </Suspense>
          </div>
          <Suspense fallback={<div className="size-10 rounded-full bg-white/10 md:hidden" />}>
            <MobileMenu>
              <Link className={drawerLinkClass} href="/catalog">
                Каталог
              </Link>
              <Suspense fallback={null}>
                <OrdersLink variant="drawer" />
              </Suspense>
              <Suspense
                fallback={<div className="mt-3 h-24 animate-pulse rounded-xl bg-white/10" />}
              >
                <AuthControls variant="drawer" />
              </Suspense>
            </MobileMenu>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
