import Image from "next/image";

export function ProductPhoto({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw",
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative aspect-square overflow-hidden bg-slate-100 ${className}`.trim()}
    >
      {src ? (
        <Image
          alt={alt}
          className="object-cover"
          fetchPriority={priority ? "high" : "auto"}
          fill
          loading={priority ? "eager" : "lazy"}
          quality={75}
          sizes={sizes}
          src={src}
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full items-center justify-center text-slate-300"
        >
          <svg className="size-12" fill="none" viewBox="0 0 24 24">
            <path
              d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="m8 14 2.2-2.2a1 1 0 0 1 1.4 0L15 15l1.3-1.3a1 1 0 0 1 1.4 0L19.5 15.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            />
            <circle cx="9.25" cy="9" r="1.1" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}
