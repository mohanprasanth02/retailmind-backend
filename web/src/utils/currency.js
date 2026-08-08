export const formatPrice = (priceInUSD) => {
  if (priceInUSD == null) return "";
  const configStr = localStorage.getItem("retailmind_store_config");
  let currency = "USD ($)";
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      currency = config.currency || "USD ($)";
    } catch (e) {}
  }

  if (currency.includes("INR") || currency.includes("₹")) {
    const priceInINR = priceInUSD * 83.0; // Exchange rate: 1 USD = 83 INR
    return `₹${priceInINR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency.includes("EUR") || currency.includes("€")) {
    const priceInEUR = priceInUSD * 0.92;
    return `€${priceInEUR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency.includes("GBP") || currency.includes("£")) {
    const priceInGBP = priceInUSD * 0.79;
    return `£${priceInGBP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `$${priceInUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
