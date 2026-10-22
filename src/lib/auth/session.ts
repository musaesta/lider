import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AuthViewer = {
  id: string;
  email: string | null;
};

export async function getAuthViewer(): Promise<AuthViewer | null> {
  await connection();
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const id = typeof data.claims.sub === "string" ? data.claims.sub : null;

  if (!id) {
    return null;
  }

  const email =
    typeof data.claims.email === "string" ? data.claims.email : null;

  return { id, email };
}
