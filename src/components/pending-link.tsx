"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { Spinner } from "@/components/spinner";

function PendingMark() {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return <Spinner className="size-3.5" />;
}

export function PendingLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <Link className={className} href={href} prefetch={false}>
      <span className="inline-flex items-center gap-2">
        {children}
        <PendingMark />
      </span>
    </Link>
  );
}
