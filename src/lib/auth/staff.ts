import { redirect } from "next/navigation";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer, type AuthViewer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "operator" | "admin";

export type StaffViewer = AuthViewer & {
  role: StaffRole;
};

function isStaffRole(value: unknown): value is StaffRole {
  return value === "operator" || value === "admin";
}

export async function getStaffViewer(): Promise<StaffViewer | null> {
  const viewer = await getAuthViewer();
  const supabase = await createClient();

  if (!viewer || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", viewer.id)
    .maybeSingle();

  if (error || !isStaffRole(data?.role)) {
    return null;
  }

  return { ...viewer, role: data.role };
}

export async function requireStaffAction(
  nextPath = "/admin/orders",
): Promise<StaffViewer> {
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref(nextPath));
  }

  const staff = await getStaffViewer();

  if (!staff) {
    redirect("/");
  }

  return staff;
}
