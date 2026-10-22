import { getSupabaseConfig } from "@/lib/supabase/config";

const PRODUCT_IMAGE_BUCKET = "product-images";

export function productImagePublicUrl(storagePath: string | null | undefined) {
  if (!storagePath) {
    return null;
  }

  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const base = config.url.replace(/\/$/, "");
  const path = storagePath.replace(/^\/+/, "");

  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}
