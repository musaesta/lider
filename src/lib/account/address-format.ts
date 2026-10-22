export type Address = {
  id: string;
  recipientName: string;
  phone: string;
  countryCode: string;
  region: string | null;
  city: string;
  postalCode: string | null;
  addressLine1: string;
  addressLine2: string | null;
  deliveryInstructions: string | null;
};

export function formatAddress(address: Address) {
  return [
    address.city,
    address.region,
    address.postalCode,
    address.addressLine1,
    address.addressLine2,
  ]
    .filter((part) => part && part.trim())
    .join(", ");
}
