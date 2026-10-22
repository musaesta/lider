import { connection } from "next/server";
import { getAuthViewer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { type Address } from "@/lib/account/address-format";

export type { Address } from "@/lib/account/address-format";
export { formatAddress } from "@/lib/account/address-format";

type AddressRow = {
  id: string;
  recipient_name: string;
  phone: string;
  country_code: string;
  region: string | null;
  city: string;
  postal_code: string | null;
  address_line1: string;
  address_line2: string | null;
  delivery_instructions: string | null;
};

function mapAddress(row: AddressRow): Address {
  return {
    id: row.id,
    recipientName: row.recipient_name,
    phone: row.phone,
    countryCode: row.country_code,
    region: row.region,
    city: row.city,
    postalCode: row.postal_code,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    deliveryInstructions: row.delivery_instructions,
  };
}

const addressSelect = `
  id,
  recipient_name,
  phone,
  country_code,
  region,
  city,
  postal_code,
  address_line1,
  address_line2,
  delivery_instructions
`;

export async function listMyAddresses(): Promise<{
  addresses: Address[];
  error: string | null;
}> {
  await connection();
  const viewer = await getAuthViewer();
  const supabase = await createClient();

  if (!viewer || !supabase) {
    return { addresses: [], error: null };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select(addressSelect)
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("addresses.listMyAddresses", error.message);
    return { addresses: [], error: "Не удалось загрузить адреса." };
  }

  return {
    addresses: ((data ?? []) as AddressRow[]).map(mapAddress),
    error: null,
  };
}

export async function getMyAddress(
  id: string,
): Promise<{ address: Address | null; error: string | null }> {
  await connection();
  const viewer = await getAuthViewer();
  const supabase = await createClient();

  if (!viewer || !supabase) {
    return { address: null, error: null };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select(addressSelect)
    .eq("id", id)
    .eq("user_id", viewer.id)
    .maybeSingle();

  if (error) {
    return { address: null, error: "Не удалось загрузить адрес." };
  }

  return {
    address: data ? mapAddress(data as AddressRow) : null,
    error: null,
  };
}
