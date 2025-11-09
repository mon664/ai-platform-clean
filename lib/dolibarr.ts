export async function saveDolSale(data: {
  product: string;
  quantity: number;
  price: number;
  customer: string;
  date: string;
}) {
  const apiKey = process.env.DOLIBARR_API_KEY;
  const baseUrl = process.env.DOLIBARR_URL;

  // Dolibarr 형식으로 변환
  const payload = {
    ref: `SALE-${Date.now()}`,
    date: Math.floor(new Date(data.date).getTime() / 1000),
    array_lines: [{
      description: data.product,
      qty: data.quantity,
      subprice: data.price,
      total_ht: data.quantity * data.price,
      total_ttc: data.quantity * data.price * 1.1 // 부가세 포함
    }]
  };

  const response = await fetch(`${baseUrl}/api/index.php/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DOLAPIKEY': apiKey
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

export async function saveDolPurchase(data: {
  product: string;
  quantity: number;
  price: number;
  vendor: string;
  date: string;
}) {
  const apiKey = process.env.DOLIBARR_API_KEY;
  const baseUrl = process.env.DOLIBARR_URL;

  const payload = {
    ref: `PUR-${Date.now()}`,
    date: Math.floor(new Date(data.date).getTime() / 1000),
    array_lines: [{
      description: data.product,
      qty: data.quantity,
      subprice: data.price,
      total_ht: data.quantity * data.price,
      total_ttc: data.quantity * data.price * 1.1
    }]
  };

  const response = await fetch(`${baseUrl}/api/index.php/supplierorders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DOLAPIKEY': apiKey
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
