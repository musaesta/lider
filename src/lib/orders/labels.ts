const orderStatusLabels: Record<string, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  assembling: "Собирается",
  packed: "Упакован",
  shipped: "Отправлен",
  completed: "Выполнен",
  cancelled: "Отменён",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Ожидает оплаты",
  authorized: "Авторизован",
  paid: "Оплачен",
  failed: "Ошибка оплаты",
  partially_refunded: "Частичный возврат",
  refunded: "Возврат",
  cancelled: "Отменён",
};

export const orderStatusOptions = Object.keys(orderStatusLabels);

export function orderStatusLabel(status: string) {
  return orderStatusLabels[status] ?? status;
}

export function paymentStatusLabel(status: string) {
  return paymentStatusLabels[status] ?? status;
}

export function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
