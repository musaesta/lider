import { connection } from "next/server";
import { getAuthViewer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string | number;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
};

export type OrderDetails = OrderSummary & {
  contactName: string;
  contactPhone: string;
  shippingCity: string;
  shippingRegion: string | null;
  shippingPostalCode: string | null;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  customerComment: string | null;
  items: OrderItem[];
  history: Array<{ id: string; status: string; createdAt: string }>;
  comments: Array<{ id: string; body: string; createdAt: string }>;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: string | number;
  created_at: string;
  contact_name?: string;
  contact_phone?: string;
  shipping_city?: string;
  shipping_region?: string | null;
  shipping_postal_code?: string | null;
  shipping_address_line1?: string;
  shipping_address_line2?: string | null;
  customer_comment?: string | null;
  order_items?: Array<{
    id: string;
    name_snapshot: string;
    sku_snapshot: string;
    quantity: number;
    unit_price: string | number;
    line_total: string | number;
  }>;
  order_status_history?: Array<{
    id: string;
    new_status: string;
    created_at: string;
  }>;
  order_comments?: Array<{
    id: string;
    body: string;
    created_at: string;
    visibility?: string;
  }>;
};

function mapSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
  };
}

export async function listMyOrders(): Promise<{
  orders: OrderSummary[];
  error: string | null;
}> {
  await connection();
  const viewer = await getAuthViewer();
  const supabase = await createClient();

  if (!viewer || !supabase) {
    return { orders: [], error: null };
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total_amount, created_at")
    .eq("customer_id", viewer.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("orders.listMyOrders", error.message);
    return { orders: [], error: "Не удалось загрузить заказы." };
  }

  return {
    orders: ((data ?? []) as OrderRow[]).map(mapSummary),
    error: null,
  };
}

export async function getMyOrder(
  id: string,
): Promise<{ order: OrderDetails | null; error: string | null }> {
  await connection();
  const viewer = await getAuthViewer();
  const supabase = await createClient();

  if (!viewer || !supabase) {
    return { order: null, error: null };
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_status,
      total_amount,
      created_at,
      contact_name,
      contact_phone,
      shipping_city,
      shipping_region,
      shipping_postal_code,
      shipping_address_line1,
      shipping_address_line2,
      customer_comment,
      order_items (
        id,
        name_snapshot,
        sku_snapshot,
        quantity,
        unit_price,
        line_total
      ),
      order_status_history (
        id,
        new_status,
        created_at
      ),
      order_comments (
        id,
        body,
        created_at,
        visibility
      )
    `,
    )
    .eq("id", id)
    .eq("customer_id", viewer.id)
    .maybeSingle();

  if (error) {
    console.error("orders.getMyOrder", error.message);
    return { order: null, error: "Не удалось загрузить заказ." };
  }

  if (!data) {
    return { order: null, error: null };
  }

  const row = data as OrderRow;

  return {
    order: {
      ...mapSummary(row),
      contactName: row.contact_name ?? "",
      contactPhone: row.contact_phone ?? "",
      shippingCity: row.shipping_city ?? "",
      shippingRegion: row.shipping_region ?? null,
      shippingPostalCode: row.shipping_postal_code ?? null,
      shippingAddressLine1: row.shipping_address_line1 ?? "",
      shippingAddressLine2: row.shipping_address_line2 ?? null,
      customerComment: row.customer_comment ?? null,
      items: (row.order_items ?? []).map((item) => ({
        id: item.id,
        name: item.name_snapshot,
        sku: item.sku_snapshot,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      })),
      history: [...(row.order_status_history ?? [])]
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
        .map((entry) => ({
          id: entry.id,
          status: entry.new_status,
          createdAt: entry.created_at,
        })),
      comments: (row.order_comments ?? [])
        .filter((comment) => comment.visibility !== "internal")
        .map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.created_at,
        })),
    },
    error: null,
  };
}
