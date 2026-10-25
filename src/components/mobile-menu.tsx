"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";

export function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const menuId = useId();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          setOpenPath(null);
        }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        className="inline-flex size-10 items-center justify-center rounded-full text-on-chrome transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onClick={() => setOpenPath(open ? null : pathname)}
        type="button"
      >
        {open ? (
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        ) : (
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        )}
      </button>
      {open ? (
        <>
          <button
            aria-label="Закрыть меню"
            className="fixed inset-0 top-[75px] z-30 bg-black/60"
            onClick={() => setOpenPath(null)}
            type="button"
          />
          <div
            className="absolute inset-x-0 top-full z-40 border-b border-white/10 bg-chrome px-4 py-4 shadow-xl shadow-black/40"
            id={menuId}
          >
            <nav
              aria-label="Мобильное меню"
              className="mx-auto flex max-w-7xl flex-col gap-1"
              onClick={(event) => {
                if (event.target instanceof Element && event.target.closest("a")) {
                  setOpenPath(null);
                }
              }}
            >
              {children}
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
