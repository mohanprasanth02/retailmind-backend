export const formatPrice = (price) => {
  if (price == null || isNaN(price)) return "₹0";
  const num = Number(price);
  const configStr = localStorage.getItem("retailmind_store_config");
  let currency = "INR (₹)";
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      currency = config.currency || "INR (₹)";
    } catch (e) {}
  }

  if (currency.includes("USD") || currency.includes("$")) {
    const priceInUSD = (num / 83.0);
    return `$${priceInUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency.includes("EUR") || currency.includes("€")) {
    const priceInEUR = (num * 0.011);
    return `€${priceInEUR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency.includes("GBP") || currency.includes("£")) {
    const priceInGBP = (num * 0.0095);
    return `£${priceInGBP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Default to INR (₹)
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
