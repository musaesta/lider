export function safeNextPath(value: string | null | undefined) {
  if (!value) {
    return "/";
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }

  return value;
}

export function loginHref(nextPath?: string) {
  const next = safeNextPath(nextPath);

  if (next === "/") {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(next)}`;
}
