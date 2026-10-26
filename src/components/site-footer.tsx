import Image from "next/image";

const mapsHref =
  "https://yandex.ru/maps/org/lider_zapchast/224920309039?si=jd06qdcfem0rc643pjvh8j08uc";
const instagramHref = "https://www.instagram.com/lider_zapchasti?obrf=bTB4M203ZzByaHVj";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-chrome text-on-chrome-muted">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 px-4 py-6 sm:px-10 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-10 lg:px-12">
        <Image
          alt="LIDER Запчасти"
          className="col-span-2 h-10 w-auto lg:col-span-1"
          height={40}
          src="/logo-horizontal.svg"
          style={{ width: "auto" }}
          unoptimized
          width={113}
        />
        <div className="min-w-0">
          <a
            className="inline-flex text-base font-semibold text-on-chrome transition-colors hover:text-accent-on-dark"
            href="tel:+79289176646"
          >
            +7 (928) 917-66-46
          </a>
          <a
            className="mt-2 block max-w-2xl text-sm leading-6 underline decoration-white/25 underline-offset-4 transition-colors hover:text-on-chrome hover:decoration-accent"
            href={mapsHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            Лидер запчасть — Республика Ингушетия, Назрановский район, сельское поселение Яндаре
          </a>
        </div>
        <a
          aria-label="Instagram"
          className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-on-chrome transition-colors hover:border-accent hover:text-accent-on-dark"
          href={instagramHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          <svg aria-hidden="true" className="size-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 1.8H7A2.2 2.2 0 0 0 4.8 7v10A2.2 2.2 0 0 0 7 19.2h10a2.2 2.2 0 0 0 2.2-2.2V7A2.2 2.2 0 0 0 17 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.35 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
