export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to configure Supabase.",
    );
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url && !publishableKey) {
    return null;
  }

  if (!url || !publishableKey) {
    throw new SupabaseConfigError();
  }

  return { url, publishableKey };
}
