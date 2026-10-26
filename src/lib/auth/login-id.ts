export const TEST_ADMIN_EMAIL = "admin@lider.local";

export function resolveLoginIdentifier(raw: string) {
  const trimmed = raw.trim();

  if (trimmed.toLowerCase() === "admin") {
    return TEST_ADMIN_EMAIL;
  }

  return trimmed;
}
