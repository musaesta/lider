export function formatPrice(value: string | number | null) {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return "Цена уточняется";
  }

  const [rubles, kopecks] = amount.toFixed(2).split(".");
  const grouped = rubles.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  if (kopecks === "00") {
    return `${grouped} ₽`;
  }

  return `${grouped},${kopecks} ₽`;
}
