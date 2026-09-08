<<<<<<< HEAD
export const formatMoney = (amount, currency = "NGN") => {
  const numericAmount = Number(amount || 0);
  const currencyCode = String(currency || "NGN").toUpperCase();

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  }
=======
export const formatMoney = (amount, currency = "USD") => {
  const numericAmount = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "CAD" ? "CAD" : "USD",
    minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
>>>>>>> 26cceed184f29a0805f2d5ed809f7622d67499e7
};
