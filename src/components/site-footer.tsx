import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-chrome text-on-chrome-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
        <Image
          alt="LIDER Запчасти"
          className="h-10 w-auto"
          height={40}
          src="/logo-horizontal.svg"
          unoptimized
          width={113}
        />
        <span className="text-xs">Каталог, заказ без оплаты и админка сотрудника</span>
      </div>
    </footer>
  );
}
